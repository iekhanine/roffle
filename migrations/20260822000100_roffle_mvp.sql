-- ROFFLE MVP schema
-- Portable by design: safe to apply to a brand-new Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ROFFLE User',
  avatar_url text,
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  youtube_url text not null,
  youtube_id text not null check (char_length(youtube_id) between 6 and 20),
  video_type text not null check (video_type in ('short', 'video')),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);

create index if not exists posts_user_id_idx
  on public.posts (user_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

-- Profiles are public enough for author attribution in the feed.
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- A signed-in user may only edit their own profile.
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Published posts are public; owners may also see their own future drafts.
drop policy if exists "posts public read" on public.posts;
create policy "posts public read"
  on public.posts
  for select
  to anon, authenticated
  using (published = true or auth.uid() = user_id);

-- Users can only create posts as themselves.
drop policy if exists "posts owner insert" on public.posts;
create policy "posts owner insert"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can only update their own posts.
drop policy if exists "posts owner update" on public.posts;
create policy "posts owner update"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own posts.
drop policy if exists "posts owner delete" on public.posts;
create policy "posts owner delete"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Explicit API grants. RLS remains the real security boundary.
grant select on table public.profiles to anon, authenticated;
grant update on table public.profiles to authenticated;
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

-- OAuth users receive a ROFFLE profile automatically on first sign-in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
  resolved_avatar text;
  resolved_provider text;
begin
  resolved_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(coalesce(new.email, 'ROFFLE User'), '@', 1),
    'ROFFLE User'
  );

  resolved_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  resolved_provider := new.raw_app_meta_data ->> 'provider';

  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    provider
  )
  values (
    new.id,
    resolved_name,
    resolved_avatar,
    resolved_provider
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    provider = coalesce(excluded.provider, public.profiles.provider),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of raw_user_meta_data, raw_app_meta_data
on auth.users
for each row
execute function public.handle_new_user();

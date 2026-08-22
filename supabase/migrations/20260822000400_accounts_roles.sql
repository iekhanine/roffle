-- ==========================================================
-- ROFFLE
-- ACCOUNTS + USER ROLES
-- Migration 004
-- ==========================================================

begin;


-- ==========================================================
-- PROFILE USERNAME
-- ==========================================================

alter table public.profiles
  add column if not exists username text;


alter table public.profiles
  drop constraint if exists profiles_username_format_check;


alter table public.profiles
  add constraint profiles_username_format_check
  check (
    username is null
    or
    username ~ '^[A-Za-z0-9_]{3,24}$'
  );


create unique index if not exists
  profiles_username_lower_unique_idx
  on public.profiles (
    lower(username)
  )
  where username is not null;


-- ==========================================================
-- SECURE ROLE / ACCOUNT TABLE
-- Kept separate from profiles so users cannot self-promote.
-- ==========================================================

create table if not exists public.user_roles (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  role text not null
    default 'user'
    check (
      role in (
        'user',
        'moderator',
        'admin'
      )
    ),

  account_status text not null
    default 'active'
    check (
      account_status in (
        'active',
        'suspended',
        'banned'
      )
    ),

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now()
);


alter table public.user_roles
  enable row level security;


insert into public.user_roles (
  user_id
)
select
  id
from auth.users
on conflict (user_id)
do nothing;


-- ==========================================================
-- ROLE HELPERS
-- ==========================================================

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where
      user_id = auth.uid()
      and role in (
        'moderator',
        'admin'
      )
      and account_status =
        'active'
  );
$$;


create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where
      user_id = auth.uid()
      and role = 'admin'
      and account_status =
        'active'
  );
$$;


revoke all
  on function public.is_staff()
  from public;

revoke all
  on function public.is_admin()
  from public;

grant execute
  on function public.is_staff()
  to authenticated;

grant execute
  on function public.is_admin()
  to authenticated;


-- ==========================================================
-- USER ROLE RLS
-- Users can read only their own access row.
-- Staff can read all access rows.
-- No client gets direct write privileges.
-- ==========================================================

drop policy if exists
  "user roles own or staff read"
  on public.user_roles;


create policy
  "user roles own or staff read"
  on public.user_roles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
  );


grant select
  on table public.user_roles
  to authenticated;


revoke insert, update, delete
  on table public.user_roles
  from anon, authenticated;


-- ==========================================================
-- USERNAME AVAILABILITY
-- Safe boolean-only lookup for the create-account form.
-- ==========================================================

create or replace function public.is_username_available(
  candidate text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    candidate is not null
    and trim(candidate)
      ~ '^[A-Za-z0-9_]{3,24}$'
    and not exists (
      select 1
      from public.profiles
      where
        lower(username) =
        lower(
          trim(candidate)
        )
    );
$$;


revoke all
  on function public.is_username_available(text)
  from public;

grant execute
  on function public.is_username_available(text)
  to anon, authenticated;


-- ==========================================================
-- PROFILE TRIGGER
-- Username is pulled from sign-up metadata.
-- OAuth accounts may leave username null initially.
-- ==========================================================

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
  resolved_username text;
begin
  resolved_username :=
    nullif(
      trim(
        new.raw_user_meta_data
          ->> 'username'
      ),
      ''
    );

  resolved_name :=
    coalesce(
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'display_name'
        ),
        ''
      ),
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),
      nullif(
        trim(
          new.raw_user_meta_data
            ->> 'name'
        ),
        ''
      ),
      resolved_username,
      split_part(
        coalesce(
          new.email,
          'ROFFLE User'
        ),
        '@',
        1
      ),
      'ROFFLE User'
    );

  resolved_avatar :=
    coalesce(
      new.raw_user_meta_data
        ->> 'avatar_url',
      new.raw_user_meta_data
        ->> 'picture'
    );

  resolved_provider :=
    new.raw_app_meta_data
      ->> 'provider';

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    provider
  )
  values (
    new.id,
    resolved_username,
    resolved_name,
    resolved_avatar,
    resolved_provider
  )
  on conflict (id)
  do update
  set
    username =
      coalesce(
        excluded.username,
        public.profiles.username
      ),

    display_name =
      excluded.display_name,

    avatar_url =
      coalesce(
        excluded.avatar_url,
        public.profiles.avatar_url
      ),

    provider =
      coalesce(
        excluded.provider,
        public.profiles.provider
      ),

    updated_at =
      now();

  return new;
end;
$$;


-- ==========================================================
-- DEFAULT ROLE TRIGGER
-- Every new auth user starts as a normal user.
-- ==========================================================

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_roles (
    user_id,
    role,
    account_status
  )
  values (
    new.id,
    'user',
    'active'
  )
  on conflict (user_id)
  do nothing;

  return new;
end;
$$;


drop trigger if exists
  on_auth_user_role_created
  on auth.users;


create trigger
  on_auth_user_role_created
after insert
on auth.users
for each row
execute function
  public.handle_new_user_role();


-- ==========================================================
-- UPDATED_AT FOR ROLE TABLE
-- ==========================================================

drop trigger if exists
  user_roles_set_updated_at
  on public.user_roles;


create trigger
  user_roles_set_updated_at
before update
on public.user_roles
for each row
execute function
  public.set_updated_at();


commit;

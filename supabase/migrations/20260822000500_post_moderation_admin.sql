-- ==========================================================
-- ROFFLE
-- POST MODERATION + ADMIN RPC
-- Migration 005
-- Requires Migration 004 (accounts + user_roles)
-- ==========================================================

begin;


-- ==========================================================
-- POST MODERATION COLUMNS
-- ==========================================================

alter table public.posts
  add column if not exists moderation_status text
    not null
    default 'pending',

  add column if not exists submitted_at timestamptz
    not null
    default now(),

  add column if not exists moderated_at timestamptz,

  add column if not exists moderated_by uuid
    references auth.users(id)
    on delete set null,

  add column if not exists moderation_note text;


alter table public.posts
  drop constraint if exists posts_moderation_status_check;


alter table public.posts
  add constraint posts_moderation_status_check
  check (
    moderation_status in (
      'pending',
      'approved',
      'rejected'
    )
  );


-- Preserve existing content as already-approved.
update public.posts
set
  moderation_status =
    'approved',

  published =
    true,

  moderated_at =
    coalesce(
      moderated_at,
      created_at
    )
where
  moderation_status =
    'pending'
  and created_at <
    now();


create index if not exists
  posts_moderation_status_idx
  on public.posts (
    moderation_status,
    created_at
  );


-- ==========================================================
-- INSERT GUARD
-- Normal users -> pending + unpublished.
-- Staff -> approved + published.
-- Password users must have confirmed email.
-- Suspended/banned accounts cannot submit.
-- ==========================================================

create or replace function public.apply_post_moderation_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_role text;
  resolved_status text;
  resolved_provider text;
  confirmed_at timestamptz;
begin
  select
    role,
    account_status
  into
    resolved_role,
    resolved_status
  from public.user_roles
  where
    user_id =
      new.user_id;

  if
    resolved_status is null
    or resolved_status <> 'active'
  then
    raise exception
      'ROFFLE account is not active.';
  end if;

  select
    raw_app_meta_data ->> 'provider',
    email_confirmed_at
  into
    resolved_provider,
    confirmed_at
  from auth.users
  where
    id =
      new.user_id;

  if
    resolved_provider = 'email'
    and confirmed_at is null
  then
    raise exception
      'Confirm your email before posting.';
  end if;

  new.submitted_at :=
    now();

  if
    resolved_role in (
      'moderator',
      'admin'
    )
  then
    new.moderation_status :=
      'approved';

    new.published :=
      true;

    new.moderated_at :=
      now();

    new.moderated_by :=
      new.user_id;

    new.moderation_note :=
      null;
  else
    new.moderation_status :=
      'pending';

    new.published :=
      false;

    new.moderated_at :=
      null;

    new.moderated_by :=
      null;

    new.moderation_note :=
      null;
  end if;

  return new;
end;
$$;


drop trigger if exists
  posts_apply_moderation_defaults
  on public.posts;


create trigger
  posts_apply_moderation_defaults
before insert
on public.posts
for each row
execute function
  public.apply_post_moderation_defaults();


-- ==========================================================
-- POSTS RLS
-- Public: approved + published only.
-- Owner: can see own pending/rejected posts.
-- Staff: can see everything.
-- Normal users do not get direct UPDATE permission.
-- ==========================================================

drop policy if exists
  "posts public read"
  on public.posts;


drop policy if exists
  "posts moderated read"
  on public.posts;


create policy
  "posts moderated read"
  on public.posts
  for select
  to anon, authenticated
  using (
    (
      moderation_status =
        'approved'
      and published =
        true
    )
    or
    auth.uid() =
      user_id
    or
    public.is_staff()
  );


drop policy if exists
  "posts owner update"
  on public.posts;


drop policy if exists
  "posts staff update"
  on public.posts;


create policy
  "posts staff update"
  on public.posts
  for update
  to authenticated
  using (
    public.is_staff()
  )
  with check (
    public.is_staff()
  );


-- Keep the existing owner INSERT / DELETE policies.
-- INSERT status is forced by the trigger above.


-- ==========================================================
-- MODERATE POST RPC
-- ==========================================================

create or replace function public.moderate_post(
  target_post uuid,
  decision text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff()
  then
    raise exception
      'Moderator access required.';
  end if;

  if
    decision not in (
      'approved',
      'rejected'
    )
  then
    raise exception
      'Invalid moderation decision.';
  end if;

  update public.posts
  set
    moderation_status =
      decision,

    published =
      (
        decision =
        'approved'
      ),

    moderated_at =
      now(),

    moderated_by =
      auth.uid(),

    moderation_note =
      nullif(
        trim(note),
        ''
      )
  where
    id =
      target_post;

  if not found
  then
    raise exception
      'Post not found.';
  end if;
end;
$$;


revoke all
  on function public.moderate_post(
    uuid,
    text,
    text
  )
  from public;

grant execute
  on function public.moderate_post(
    uuid,
    text,
    text
  )
  to authenticated;


-- ==========================================================
-- ADMIN DASHBOARD STATS
-- ==========================================================

create or replace function public.admin_dashboard_stats()
returns table (
  total_users bigint,
  total_posts bigint,
  pending_posts bigint,
  approved_posts bigint,
  rejected_posts bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  return query
  select
    (
      select count(*)
      from auth.users
    )::bigint,

    (
      select count(*)
      from public.posts
    )::bigint,

    (
      select count(*)
      from public.posts
      where
        moderation_status =
        'pending'
    )::bigint,

    (
      select count(*)
      from public.posts
      where
        moderation_status =
        'approved'
    )::bigint,

    (
      select count(*)
      from public.posts
      where
        moderation_status =
        'rejected'
    )::bigint;
end;
$$;


revoke all
  on function public.admin_dashboard_stats()
  from public;

grant execute
  on function public.admin_dashboard_stats()
  to authenticated;


-- ==========================================================
-- ADMIN USER LIST
-- Only admins can see Auth emails and manage roles/status.
-- ==========================================================

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  provider text,
  created_at timestamptz,
  username text,
  display_name text,
  role text,
  account_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  return query
  select
    au.id,
    au.email,
    au.email_confirmed_at,
    au.raw_app_meta_data
      ->> 'provider',
    au.created_at,
    p.username,
    p.display_name,
    ur.role,
    ur.account_status
  from auth.users au
  join public.profiles p
    on p.id =
      au.id
  join public.user_roles ur
    on ur.user_id =
      au.id
  order by
    au.created_at desc;
end;
$$;


revoke all
  on function public.admin_list_users()
  from public;

grant execute
  on function public.admin_list_users()
  to authenticated;


-- ==========================================================
-- ROLE MANAGEMENT
-- Admin only.
-- Prevents an admin from accidentally removing their own
-- admin role while using the UI.
-- ==========================================================

create or replace function public.admin_set_user_role(
  target_user uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  if
    new_role not in (
      'user',
      'moderator',
      'admin'
    )
  then
    raise exception
      'Invalid role.';
  end if;

  if
    target_user =
      auth.uid()
    and new_role <>
      'admin'
  then
    raise exception
      'You cannot remove your own admin role from the ROFFLE admin UI.';
  end if;

  update public.user_roles
  set
    role =
      new_role
  where
    user_id =
      target_user;

  if not found
  then
    raise exception
      'User not found.';
  end if;
end;
$$;


create or replace function public.admin_set_account_status(
  target_user uuid,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin()
  then
    raise exception
      'Admin access required.';
  end if;

  if
    new_status not in (
      'active',
      'suspended',
      'banned'
    )
  then
    raise exception
      'Invalid account status.';
  end if;

  if
    target_user =
      auth.uid()
    and new_status <>
      'active'
  then
    raise exception
      'You cannot suspend or ban your own account from the ROFFLE admin UI.';
  end if;

  update public.user_roles
  set
    account_status =
      new_status
  where
    user_id =
      target_user;

  if not found
  then
    raise exception
      'User not found.';
  end if;
end;
$$;


revoke all
  on function public.admin_set_user_role(
    uuid,
    text
  )
  from public;

revoke all
  on function public.admin_set_account_status(
    uuid,
    text
  )
  from public;

grant execute
  on function public.admin_set_user_role(
    uuid,
    text
  )
  to authenticated;

grant execute
  on function public.admin_set_account_status(
    uuid,
    text
  )
  to authenticated;


commit;

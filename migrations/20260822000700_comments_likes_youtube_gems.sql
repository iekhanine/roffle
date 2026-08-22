-- ==========================================================
-- ROFFLE
-- COMMENTS + LIKES + YOUTUBE GEMS
-- Migration 007
-- Requires the existing ROFFLE accounts/moderation schema.
-- ==========================================================

begin;


-- ==========================================================
-- POST LIKES
-- One like per user per post.
-- ==========================================================

create table if not exists public.post_likes (
  post_id uuid not null
    references public.posts(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now(),

  primary key (
    post_id,
    user_id
  )
);


create index if not exists
  post_likes_post_id_idx
  on public.post_likes (
    post_id
  );


alter table public.post_likes
  enable row level security;


drop policy if exists
  "post likes public read"
  on public.post_likes;


create policy
  "post likes public read"
  on public.post_likes
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts p
      where
        p.id =
          post_likes.post_id
        and p.moderation_status =
          'approved'
        and p.published =
          true
    )
  );


drop policy if exists
  "post likes owner insert"
  on public.post_likes;


create policy
  "post likes owner insert"
  on public.post_likes
  for insert
  to authenticated
  with check (
    user_id =
      auth.uid()

    and exists (
      select 1
      from public.user_roles ur
      where
        ur.user_id =
          auth.uid()
        and ur.account_status =
          'active'
    )

    and exists (
      select 1
      from public.posts p
      where
        p.id =
          post_likes.post_id
        and p.moderation_status =
          'approved'
        and p.published =
          true
    )
  );


drop policy if exists
  "post likes owner delete"
  on public.post_likes;


create policy
  "post likes owner delete"
  on public.post_likes
  for delete
  to authenticated
  using (
    user_id =
      auth.uid()
  );


grant select
  on table public.post_likes
  to anon, authenticated;


grant insert, delete
  on table public.post_likes
  to authenticated;


-- ==========================================================
-- POST COMMENTS
-- Comments are immediate on approved posts.
-- Users can delete their own comments.
-- Staff can delete any comment.
-- ==========================================================

create table if not exists public.post_comments (
  id uuid primary key
    default gen_random_uuid(),

  post_id uuid not null
    references public.posts(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  body text not null,

  created_at timestamptz
    not null
    default now(),

  constraint post_comments_body_check
  check (
    char_length(
      trim(body)
    ) between 1 and 500
  )
);


create index if not exists
  post_comments_post_id_created_idx
  on public.post_comments (
    post_id,
    created_at
  );


create index if not exists
  post_comments_user_id_idx
  on public.post_comments (
    user_id
  );


alter table public.post_comments
  enable row level security;


drop policy if exists
  "post comments public read"
  on public.post_comments;


create policy
  "post comments public read"
  on public.post_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts p
      where
        p.id =
          post_comments.post_id
        and p.moderation_status =
          'approved'
        and p.published =
          true
    )
  );


drop policy if exists
  "post comments owner insert"
  on public.post_comments;


create policy
  "post comments owner insert"
  on public.post_comments
  for insert
  to authenticated
  with check (
    user_id =
      auth.uid()

    and exists (
      select 1
      from public.user_roles ur
      where
        ur.user_id =
          auth.uid()
        and ur.account_status =
          'active'
    )

    and exists (
      select 1
      from public.posts p
      where
        p.id =
          post_comments.post_id
        and p.moderation_status =
          'approved'
        and p.published =
          true
    )
  );


drop policy if exists
  "post comments owner or staff delete"
  on public.post_comments;


create policy
  "post comments owner or staff delete"
  on public.post_comments
  for delete
  to authenticated
  using (
    user_id =
      auth.uid()
    or
    public.is_staff()
  );


grant select
  on table public.post_comments
  to anon, authenticated;


grant insert, delete
  on table public.post_comments
  to authenticated;


-- ==========================================================
-- YOUTUBE GEMS
--
-- Ranking:
--   likes + comments
--
-- Tie breakers:
--   1. likes
--   2. comments
--   3. newest post
--
-- Approved/public YouTube posts only.
-- ==========================================================

create or replace function public.get_youtube_gems(
  result_limit integer
  default 3
)
returns table (
  post_id uuid,
  title text,
  youtube_id text,
  like_count bigint,
  comment_count bigint,
  engagement_score bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with like_counts as (
    select
      pl.post_id,
      count(*)::bigint
        as like_count
    from public.post_likes pl
    group by
      pl.post_id
  ),

  comment_counts as (
    select
      pc.post_id,
      count(*)::bigint
        as comment_count
    from public.post_comments pc
    group by
      pc.post_id
  )

  select
    p.id
      as post_id,

    coalesce(
      nullif(
        trim(p.title),
        ''
      ),
      case
        when p.video_type =
          'short'
          then 'YouTube Short'
        else 'YouTube video'
      end
    )::text
      as title,

    p.youtube_id::text,

    coalesce(
      lc.like_count,
      0
    )::bigint
      as like_count,

    coalesce(
      cc.comment_count,
      0
    )::bigint
      as comment_count,

    (
      coalesce(
        lc.like_count,
        0
      )
      +
      coalesce(
        cc.comment_count,
        0
      )
    )::bigint
      as engagement_score

  from public.posts p

  left join like_counts lc
    on lc.post_id =
      p.id

  left join comment_counts cc
    on cc.post_id =
      p.id

  where
    p.post_type =
      'youtube'
    and p.youtube_id
      is not null
    and p.moderation_status =
      'approved'
    and p.published =
      true

  order by
    engagement_score desc,
    like_count desc,
    comment_count desc,
    p.created_at desc

  limit least(
    greatest(
      coalesce(
        result_limit,
        3
      ),
      1
    ),
    10
  );
$$;


revoke all
  on function public.get_youtube_gems(integer)
  from public;


grant execute
  on function public.get_youtube_gems(integer)
  to anon, authenticated;


commit;

-- ==========================================================
-- ROFFLE
-- QUICK POSTS MIGRATION
-- YouTube + Text + Image
-- ==========================================================

begin;


-- ==========================================================
-- POSTS: EXPAND FROM YOUTUBE-ONLY TO GENERAL QUICK POSTS
-- ==========================================================

alter table public.posts
  add column if not exists post_type text,
  add column if not exists body text,
  add column if not exists image_url text;


-- Existing records were YouTube posts.
update public.posts
set post_type = 'youtube'
where post_type is null;


alter table public.posts
  alter column post_type set default 'youtube',
  alter column post_type set not null,
  alter column title drop not null,
  alter column youtube_url drop not null,
  alter column youtube_id drop not null,
  alter column video_type drop not null;


alter table public.posts
  drop constraint if exists posts_post_type_check;

alter table public.posts
  add constraint posts_post_type_check
  check (
    post_type in (
      'youtube',
      'text',
      'image'
    )
  );


alter table public.posts
  drop constraint if exists posts_content_check;

alter table public.posts
  add constraint posts_content_check
  check (
    (
      post_type = 'youtube'
      and youtube_url is not null
      and youtube_id is not null
      and video_type in ('short', 'video')
    )
    or
    (
      post_type = 'text'
      and body is not null
      and char_length(trim(body)) between 1 and 500
    )
    or
    (
      post_type = 'image'
      and image_url is not null
    )
  );


create index if not exists posts_post_type_idx
  on public.posts (
    post_type
  );


-- ==========================================================
-- STORAGE: PUBLIC POST IMAGE BUCKET
-- ==========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id)
do update
set
  public = excluded.public,
  file_size_limit =
    excluded.file_size_limit,
  allowed_mime_types =
    excluded.allowed_mime_types;


-- ==========================================================
-- STORAGE RLS
-- Each authenticated user writes only inside:
-- post-images/<auth.uid()>/...
-- ==========================================================

drop policy if exists
  "post images public read"
  on storage.objects;

create policy
  "post images public read"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id =
      'post-images'
  );


drop policy if exists
  "post images owner insert"
  on storage.objects;

create policy
  "post images owner insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id =
      'post-images'
    and
    (
      storage.foldername(name)
    )[1] =
      auth.uid()::text
  );


drop policy if exists
  "post images owner update"
  on storage.objects;

create policy
  "post images owner update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id =
      'post-images'
    and
    (
      storage.foldername(name)
    )[1] =
      auth.uid()::text
  )
  with check (
    bucket_id =
      'post-images'
    and
    (
      storage.foldername(name)
    )[1] =
      auth.uid()::text
  );


drop policy if exists
  "post images owner delete"
  on storage.objects;

create policy
  "post images owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id =
      'post-images'
    and
    (
      storage.foldername(name)
    )[1] =
      auth.uid()::text
  );


commit;

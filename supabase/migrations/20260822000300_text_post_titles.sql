-- ==========================================================
-- ROFFLE
-- TEXT POST TITLE MIGRATION
-- ==========================================================

begin;


-- Existing text posts were body-only.
-- Give those legacy rows a title so the new constraint can apply.
update public.posts
set title =
  left(
    trim(body),
    180
  )
where
  post_type = 'text'
  and
  (
    title is null
    or
    char_length(
      trim(title)
    ) = 0
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
      and video_type in (
        'short',
        'video'
      )
    )
    or
    (
      post_type = 'text'
      and title is not null
      and char_length(
        trim(title)
      ) between 1 and 180
      and body is not null
      and char_length(
        trim(body)
      ) between 1 and 500
    )
    or
    (
      post_type = 'image'
      and image_url is not null
    )
  );


commit;

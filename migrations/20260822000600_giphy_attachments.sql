-- ==========================================================
-- ROFFLE
-- UNIVERSAL GIPHY ATTACHMENTS
-- Migration 006
-- ==========================================================

begin;


-- ==========================================================
-- OPTIONAL GIF ATTACHMENT
-- This does NOT create a new post type.
-- A GIF may be attached to YouTube, Text, or Image posts.
-- ==========================================================

alter table public.posts
  add column if not exists gif_id text,
  add column if not exists gif_url text,
  add column if not exists gif_preview_url text;


-- ==========================================================
-- BODY LENGTH
-- YouTube and Image posts may now have optional commentary.
-- Text posts continue to require body via posts_content_check.
-- ==========================================================

alter table public.posts
  drop constraint if exists posts_body_length_check;


alter table public.posts
  add constraint posts_body_length_check
  check (
    body is null
    or char_length(
      trim(body)
    ) between 1 and 500
  );


-- ==========================================================
-- GIF CONSISTENCY
-- Either no GIPHY attachment exists, or at minimum its
-- GIPHY id + rendered URL are stored together.
-- ==========================================================

alter table public.posts
  drop constraint if exists posts_gif_attachment_check;


alter table public.posts
  add constraint posts_gif_attachment_check
  check (
    (
      gif_id is null
      and gif_url is null
      and gif_preview_url is null
    )
    or
    (
      gif_id is not null
      and char_length(
        trim(gif_id)
      ) > 0
      and gif_url is not null
      and char_length(
        trim(gif_url)
      ) > 0
    )
  );


commit;

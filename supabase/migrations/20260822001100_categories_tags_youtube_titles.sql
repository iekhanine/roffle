-- ==========================================================
-- ROFFLE
-- CATEGORIES + ARTICLE TAGS
-- Migration 011
--
-- Controlled vocabulary:
--   - one category per post
--   - zero to five tags per post
--   - moderators/admins manage the vocabulary
-- ==========================================================

begin;


-- ==========================================================
-- CATEGORIES
-- ==========================================================

create table if not exists public.post_categories (
  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  slug text not null
    unique,

  active boolean not null
    default true,

  sort_order integer not null
    default 100,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint post_categories_name_check
  check (
    char_length(
      trim(name)
    ) between 1 and 48
  )
);


create unique index if not exists
  post_categories_name_ci_unique
  on public.post_categories (
    lower(name)
  );


-- ==========================================================
-- TAGS
-- ==========================================================

create table if not exists public.tags (
  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  slug text not null
    unique,

  active boolean not null
    default true,

  sort_order integer not null
    default 100,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint tags_name_check
  check (
    char_length(
      trim(name)
    ) between 1 and 48
  )
);


create unique index if not exists
  tags_name_ci_unique
  on public.tags (
    lower(name)
  );


-- ==========================================================
-- POSTS -> CATEGORY
-- ==========================================================

alter table public.posts
  add column if not exists
    category_id uuid;


do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where
      conname =
        'posts_category_id_fkey'
      and conrelid =
        'public.posts'::regclass
  )
  then
    alter table public.posts
      add constraint
        posts_category_id_fkey
      foreign key (
        category_id
      )
      references
        public.post_categories(id)
      on delete set null;
  end if;
end
$$;


create index if not exists
  posts_category_id_idx
  on public.posts (
    category_id
  );


-- ==========================================================
-- POST <-> TAG MANY-TO-MANY
-- ==========================================================

create table if not exists public.post_tags (
  post_id uuid not null
    references public.posts(id)
    on delete cascade,

  tag_id uuid not null
    references public.tags(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now(),

  primary key (
    post_id,
    tag_id
  )
);


create index if not exists
  post_tags_tag_id_idx
  on public.post_tags (
    tag_id
  );


-- ==========================================================
-- DEFAULT CATEGORIES
-- ==========================================================

insert into public.post_categories (
  name,
  slug,
  active,
  sort_order
)
values
  (
    'Funny',
    'funny',
    true,
    10
  ),
  (
    'WTF',
    'wtf',
    true,
    20
  ),
  (
    'Videos',
    'videos',
    true,
    30
  ),
  (
    'Images',
    'images',
    true,
    40
  ),
  (
    'Stories',
    'stories',
    true,
    50
  ),
  (
    'Gaming',
    'gaming',
    true,
    60
  ),
  (
    'Tech',
    'tech',
    true,
    70
  ),
  (
    'Internet',
    'internet',
    true,
    80
  ),
  (
    'Animals',
    'animals',
    true,
    90
  ),
  (
    'Random',
    'random',
    true,
    100
  )
on conflict (
  slug
)
do nothing;


-- ==========================================================
-- DEFAULT ARTICLE TAGS
-- ==========================================================

insert into public.tags (
  name,
  slug,
  active,
  sort_order
)
values
  (
    'Fail',
    'fail',
    true,
    10
  ),
  (
    'Win',
    'win',
    true,
    20
  ),
  (
    'Cringe',
    'cringe',
    true,
    30
  ),
  (
    'Wholesome',
    'wholesome',
    true,
    40
  ),
  (
    'Meme',
    'meme',
    true,
    50
  ),
  (
    'Classic',
    'classic',
    true,
    60
  ),
  (
    'Viral',
    'viral',
    true,
    70
  ),
  (
    'Oddly Satisfying',
    'oddly-satisfying',
    true,
    80
  ),
  (
    'NSFW-ish',
    'nsfw-ish',
    true,
    90
  ),
  (
    'Gaming',
    'gaming',
    true,
    100
  ),
  (
    'Tech',
    'tech',
    true,
    110
  ),
  (
    'Animals',
    'animals',
    true,
    120
  ),
  (
    'Work',
    'work',
    true,
    130
  ),
  (
    'People',
    'people',
    true,
    140
  ),
  (
    'Internet History',
    'internet-history',
    true,
    150
  )
on conflict (
  slug
)
do nothing;


-- Existing posts become Random.
update public.posts
set
  category_id =
    (
      select id
      from public.post_categories
      where
        slug =
          'random'
      limit 1
    )
where
  category_id is null;


-- ==========================================================
-- RLS: VOCABULARY IS PUBLICLY READABLE
-- Disabled items remain readable so historical posts retain
-- their labels, but the app only offers active items.
-- ==========================================================

alter table public.post_categories
  enable row level security;

alter table public.tags
  enable row level security;

alter table public.post_tags
  enable row level security;


drop policy if exists
  "categories public read"
  on public.post_categories;


create policy
  "categories public read"
  on public.post_categories
  for select
  to anon, authenticated
  using (
    true
  );


drop policy if exists
  "tags public read"
  on public.tags;


create policy
  "tags public read"
  on public.tags
  for select
  to anon, authenticated
  using (
    true
  );


drop policy if exists
  "post tags visible with post"
  on public.post_tags;


create policy
  "post tags visible with post"
  on public.post_tags
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts p
      where
        p.id =
          post_tags.post_id
        and
        (
          (
            p.moderation_status =
              'approved'
            and p.published =
              true
          )
          or
          p.user_id =
            auth.uid()
          or
          public.is_staff()
        )
    )
  );


grant select
  on table
    public.post_categories,
    public.tags,
    public.post_tags
  to anon, authenticated;


revoke insert, update, delete
  on table
    public.post_categories,
    public.tags,
    public.post_tags
  from anon, authenticated;


-- ==========================================================
-- POST CATEGORY VALIDATION
-- New selections must point to an active category.
-- Existing posts remain valid if a category is disabled later.
-- ==========================================================

create or replace function
  public.validate_post_category()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if
    tg_op =
      'INSERT'
  then
    if
      new.category_id is not null
      and not exists (
        select 1
        from public.post_categories pc
        where
          pc.id =
            new.category_id
          and pc.active =
            true
      )
    then
      raise exception
        'Choose an active category.';
    end if;

  elsif
    new.category_id is distinct from
      old.category_id
  then
    if
      new.category_id is not null
      and not exists (
        select 1
        from public.post_categories pc
        where
          pc.id =
            new.category_id
          and pc.active =
            true
      )
    then
      raise exception
        'Choose an active category.';
    end if;
  end if;

  return new;
end;
$$;


drop trigger if exists
  validate_post_category_trigger
  on public.posts;


create trigger
  validate_post_category_trigger
before insert
or update of category_id
on public.posts
for each row
execute function
  public.validate_post_category();


-- ==========================================================
-- SET TAGS FOR A POST
-- Owner or staff only.
-- Maximum five.
-- Active tags only.
-- ==========================================================

create or replace function
  public.set_post_tags(
    target_post uuid,
    tag_ids uuid[]
  )
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_count integer;
  valid_count integer;
begin
  caller_id :=
    auth.uid();

  if caller_id is null
  then
    raise exception
      'Sign in to tag a post.';
  end if;

  if not exists (
    select 1
    from public.posts p
    where
      p.id =
        target_post
      and
      (
        p.user_id =
          caller_id
        or
        public.is_staff()
      )
  )
  then
    raise exception
      'You cannot edit tags on this post.';
  end if;

  select
    count(
      distinct value
    )
  into
    normalized_count
  from unnest(
    coalesce(
      tag_ids,
      array[]::uuid[]
    )
  ) as selected(value);

  if normalized_count >
    5
  then
    raise exception
      'Choose no more than five tags.';
  end if;

  select
    count(*)
  into
    valid_count
  from public.tags t
  where
    t.active =
      true
    and t.id in (
      select distinct value
      from unnest(
        coalesce(
          tag_ids,
          array[]::uuid[]
        )
      ) as selected(value)
    );

  if valid_count <>
    normalized_count
  then
    raise exception
      'One or more selected tags are unavailable.';
  end if;

  delete from
    public.post_tags
  where
    post_id =
      target_post;

  insert into
    public.post_tags (
      post_id,
      tag_id
    )
  select
    target_post,
    selected.value
  from (
    select distinct value
    from unnest(
      coalesce(
        tag_ids,
        array[]::uuid[]
      )
    ) as values_list(value)
  ) as selected;
end;
$$;


revoke all
  on function
    public.set_post_tags(
      uuid,
      uuid[]
    )
  from public;


grant execute
  on function
    public.set_post_tags(
      uuid,
      uuid[]
    )
  to authenticated;


-- ==========================================================
-- ADMIN/MODERATOR TAXONOMY CREATE
-- ==========================================================

create or replace function
  public.admin_create_taxonomy(
    item_kind text,
    item_name text
  )
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_name text;
  base_slug text;
  candidate_slug text;
  created_id uuid;
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  cleaned_name :=
    trim(item_name);

  if
    cleaned_name is null
    or char_length(
      cleaned_name
    ) not between
      1 and 48
  then
    raise exception
      'Name must be between 1 and 48 characters.';
  end if;

  base_slug :=
    lower(
      regexp_replace(
        regexp_replace(
          cleaned_name,
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        ),
        '(^-+|-+$)',
        '',
        'g'
      )
    );

  if
    base_slug = ''
  then
    base_slug :=
      'item';
  end if;

  candidate_slug :=
    base_slug;

  if item_kind =
    'category'
  then
    if exists (
      select 1
      from public.post_categories
      where
        lower(name) =
          lower(cleaned_name)
    )
    then
      raise exception
        'That category already exists.';
    end if;

    while exists (
      select 1
      from public.post_categories
      where
        slug =
          candidate_slug
    )
    loop
      candidate_slug :=
        base_slug
        || '-'
        || substr(
          replace(
            gen_random_uuid()::text,
            '-',
            ''
          ),
          1,
          6
        );
    end loop;

    insert into
      public.post_categories (
        name,
        slug,
        active,
        created_by
      )
    values (
      cleaned_name,
      candidate_slug,
      true,
      auth.uid()
    )
    returning id
    into created_id;

  elsif item_kind =
    'tag'
  then
    if exists (
      select 1
      from public.tags
      where
        lower(name) =
          lower(cleaned_name)
    )
    then
      raise exception
        'That tag already exists.';
    end if;

    while exists (
      select 1
      from public.tags
      where
        slug =
          candidate_slug
    )
    loop
      candidate_slug :=
        base_slug
        || '-'
        || substr(
          replace(
            gen_random_uuid()::text,
            '-',
            ''
          ),
          1,
          6
        );
    end loop;

    insert into
      public.tags (
        name,
        slug,
        active,
        created_by
      )
    values (
      cleaned_name,
      candidate_slug,
      true,
      auth.uid()
    )
    returning id
    into created_id;

  else
    raise exception
      'Unknown taxonomy type.';
  end if;

  return created_id;
end;
$$;


revoke all
  on function
    public.admin_create_taxonomy(
      text,
      text
    )
  from public;


grant execute
  on function
    public.admin_create_taxonomy(
      text,
      text
    )
  to authenticated;


-- ==========================================================
-- ADMIN/MODERATOR TAXONOMY UPDATE
-- Rename and enable/disable.
-- Slugs intentionally remain stable.
-- ==========================================================

create or replace function
  public.admin_update_taxonomy(
    item_kind text,
    item_id uuid,
    new_name text,
    new_active boolean
  )
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_name text;
begin
  if not public.is_staff()
  then
    raise exception
      'Staff access required.';
  end if;

  cleaned_name :=
    trim(new_name);

  if
    cleaned_name is null
    or char_length(
      cleaned_name
    ) not between
      1 and 48
  then
    raise exception
      'Name must be between 1 and 48 characters.';
  end if;

  if item_kind =
    'category'
  then
    update
      public.post_categories
    set
      name =
        cleaned_name,
      active =
        new_active,
      updated_at =
        now()
    where
      id =
        item_id;

  elsif item_kind =
    'tag'
  then
    update
      public.tags
    set
      name =
        cleaned_name,
      active =
        new_active,
      updated_at =
        now()
    where
      id =
        item_id;

  else
    raise exception
      'Unknown taxonomy type.';
  end if;
end;
$$;


revoke all
  on function
    public.admin_update_taxonomy(
      text,
      uuid,
      text,
      boolean
    )
  from public;


grant execute
  on function
    public.admin_update_taxonomy(
      text,
      uuid,
      text,
      boolean
    )
  to authenticated;


notify pgrst,
  'reload schema';


commit;

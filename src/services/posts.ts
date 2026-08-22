import { supabase } from "../lib/supabase";

import {
  parseYouTubeUrl,
} from "../lib/youtube";

import {
  attachPostEngagement,
} from "./engagement";

import type {
  CreateQuickPostInput,
  GifAttachment,
  PostRecord,
} from "../types/post";


/* ==========================================================
   ROFFLE
   POSTS SERVICE
   ========================================================== */


const POST_IMAGE_BUCKET =
  "post-images";

const MAX_IMAGE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);


/* ==========================================================
   HELPERS
   ========================================================== */


function cleanOptionalText(
  value?: string,
) {
  const cleaned =
    value?.trim() ?? "";

  return cleaned || null;
}


function getGifFields(
  gif?:
    GifAttachment | null,
) {
  return {
    gif_id:
      gif?.id ??
      null,

    gif_url:
      gif?.url ??
      null,

    gif_preview_url:
      gif?.previewUrl ??
      null,
  };
}


function getImageExtension(
  file: File,
) {
  const typeToExtension:
    Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

  return (
    typeToExtension[file.type] ??
    "jpg"
  );
}


async function getCurrentUser() {
  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth
      .getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to post."
    );
  }

  return user;
}


/* ==========================================================
   STORAGE
   ========================================================== */


async function uploadPostImage(
  userId: string,
  file: File,
) {
  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type
    )
  ) {
    throw new Error(
      "ROFFLE currently accepts JPG, PNG, WEBP, and GIF images."
    );
  }

  if (
    file.size >
    MAX_IMAGE_BYTES
  ) {
    throw new Error(
      "Image must be 10 MB or smaller."
    );
  }

  const extension =
    getImageExtension(file);

  const path =
    `${userId}/${crypto.randomUUID()}.${extension}`;

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        POST_IMAGE_BUCKET
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert: false,
        }
      );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        POST_IMAGE_BUCKET
      )
      .getPublicUrl(
        path
      );

  return {
    imageUrl:
      data.publicUrl,

    storagePath:
      path,
  };
}


/* ==========================================================
   TAXONOMY HYDRATION
   ========================================================== */


async function attachTaxonomy(
  rows:
    PostRecord[],
): Promise<PostRecord[]> {
  if (
    rows.length === 0
  ) {
    return [];
  }

  const categoryIds =
    Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              row.category_id
          )
          .filter(
            (
              value
            ):
              value is string =>
                Boolean(value)
          )
      )
    );

  const postIds =
    rows.map(
      (
        row
      ) =>
        row.id
    );


  const [
    categoriesResult,
    postTagsResult,
  ] =
    await Promise.all([
      categoryIds.length >
        0
        ? supabase
            .from(
              "post_categories"
            )
            .select(
              "id, name, slug"
            )
            .in(
              "id",
              categoryIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      supabase
        .from(
          "post_tags"
        )
        .select(
          "post_id, tag_id"
        )
        .in(
          "post_id",
          postIds
        ),
    ]);


  if (
    categoriesResult.error
  ) {
    console.warn(
      "ROFFLE CATEGORY LOAD ERROR:",
      categoriesResult.error
    );
  }

  if (
    postTagsResult.error
  ) {
    console.warn(
      "ROFFLE TAG LINK LOAD ERROR:",
      postTagsResult.error
    );
  }


  const categoryMap =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
      }
    >();

  for (
    const category
    of categoriesResult.data ??
    []
  ) {
    categoryMap.set(
      category.id,
      category
    );
  }


  const tagIds =
    Array.from(
      new Set(
        (
          postTagsResult.data ??
          []
        ).map(
          (
            row
          ) =>
            row.tag_id
        )
      )
    );

  const {
    data:
      tagRows,
    error:
      tagsError,
  } =
    tagIds.length >
      0
      ? await supabase
          .from(
            "tags"
          )
          .select(
            "id, name, slug"
          )
          .in(
            "id",
            tagIds
          )
      : {
          data: [],
          error: null,
        };


  if (tagsError) {
    console.warn(
      "ROFFLE TAG LOAD ERROR:",
      tagsError
    );
  }


  const tagMap =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
      }
    >();

  for (
    const tag
    of tagRows ?? []
  ) {
    tagMap.set(
      tag.id,
      tag
    );
  }


  const tagsByPost =
    new Map<
      string,
      Array<{
        id: string;
        name: string;
        slug: string;
      }>
    >();

  for (
    const link
    of postTagsResult.data ??
    []
  ) {
    const tag =
      tagMap.get(
        link.tag_id
      );

    if (!tag) {
      continue;
    }

    const existing =
      tagsByPost.get(
        link.post_id
      ) ??
      [];

    existing.push(
      tag
    );

    tagsByPost.set(
      link.post_id,
      existing
    );
  }


  return rows.map(
    (
      row
    ) => ({
      ...row,

      category:
        row.category_id
          ? categoryMap.get(
              row.category_id
            ) ??
            null
          : null,

      tags:
        tagsByPost.get(
          row.id
        ) ??
        [],
    })
  );
}


/* ==========================================================
   CREATE POST
   ========================================================== */


async function attachProfiles(
  rows:
    Array<Record<string, any>>,
): Promise<PostRecord[]> {
  if (
    rows.length === 0
  ) {
    return [];
  }

  const userIds =
    Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              row.user_id as
                string | undefined
          )
          .filter(
            (
              value
            ):
              value is string =>
                Boolean(value)
          )
      )
    );


  if (
    userIds.length === 0
  ) {
    return rows.map(
      (
        row
      ) => ({
        ...row,

        profiles:
          null,
      })
    ) as unknown as
      PostRecord[];
  }


  const {
    data:
      profileRows,
    error:
      profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url"
      )
      .in(
        "id",
        userIds
      );


  if (profileError) {
    console.warn(
      "ROFFLE PROFILE LOAD ERROR:",
      profileError
    );
  }


  const profileMap =
    new Map<
      string,
      {
        display_name:
          string;
        avatar_url:
          string | null;
      }
    >();


  for (
    const profile
    of profileRows ?? []
  ) {
    profileMap.set(
      profile.id,
      {
        display_name:
          profile.display_name,

        avatar_url:
          profile.avatar_url,
      }
    );
  }


  return rows.map(
    (
      row
    ) => ({
      ...row,

      gif_id:
        row.gif_id ??
        null,

      gif_url:
        row.gif_url ??
        null,

      gif_preview_url:
        row.gif_preview_url ??
        null,

      moderation_status:
        row.moderation_status ??
        (
          row.published
            ? "approved"
            : "pending"
        ),

      submitted_at:
        row.submitted_at ??
        row.created_at ??
        null,

      moderated_at:
        row.moderated_at ??
        null,

      moderation_note:
        row.moderation_note ??
        null,

      profiles:
        profileMap.get(
          row.user_id
        ) ??
        null,
    })
  ) as unknown as
    PostRecord[];
}


export async function createQuickPost(
  input:
    CreateQuickPostInput,
): Promise<PostRecord> {
  const user =
    await getCurrentUser();

  if (
    !input.categoryId
  ) {
    throw new Error(
      "Choose a category."
    );
  }

  if (
    input.tagIds.length >
    5
  ) {
    throw new Error(
      "Choose no more than five tags."
    );
  }

  let storagePath:
    string | null = null;

  let payload:
    Record<string, unknown>;


  const optionalGif =
    input.gif
      ? getGifFields(
          input.gif
        )
      : {};


  if (
    input.postType ===
    "youtube"
  ) {
    const parsed =
      parseYouTubeUrl(
        input.youtubeUrl
      );

    if (!parsed) {
      throw new Error(
        "That does not look like a valid YouTube URL."
      );
    }

    payload = {
      user_id:
        user.id,

      post_type:
        "youtube",

      category_id:
        input.categoryId,

      title:
        cleanOptionalText(
          input.title
        ),

      body:
        cleanOptionalText(
          input.body
        ),

      youtube_url:
        parsed.canonicalUrl,

      youtube_id:
        parsed.youtubeId,

      video_type:
        parsed.videoType,

      image_url:
        null,

      ...optionalGif,

      published:
        true,
    };
  } else if (
    input.postType ===
    "text"
  ) {
    const title =
      input.title.trim();

    const body =
      input.body.trim();

    if (!title) {
      throw new Error(
        "Give the post a title."
      );
    }

    if (
      title.length > 180
    ) {
      throw new Error(
        "Titles are limited to 180 characters."
      );
    }

    if (!body) {
      throw new Error(
        "Write something first."
      );
    }

    if (
      body.length > 500
    ) {
      throw new Error(
        "Text posts are limited to 500 characters."
      );
    }

    payload = {
      user_id:
        user.id,

      post_type:
        "text",

      category_id:
        input.categoryId,

      title,

      body,

      youtube_url:
        null,

      youtube_id:
        null,

      video_type:
        null,

      image_url:
        null,

      ...optionalGif,

      published:
        true,
    };
  } else {
    const uploaded =
      await uploadPostImage(
        user.id,
        input.image
      );

    storagePath =
      uploaded.storagePath;

    payload = {
      user_id:
        user.id,

      post_type:
        "image",

      category_id:
        input.categoryId,

      title:
        cleanOptionalText(
          input.title
        ),

      body:
        cleanOptionalText(
          input.body
        ),

      youtube_url:
        null,

      youtube_id:
        null,

      video_type:
        null,

      image_url:
        uploaded.imageUrl,

      ...optionalGif,

      published:
        true,
    };
  }


  const {
    data,
    error,
  } =
    await supabase
      .from("posts")
      .insert(payload)
      .select("*")
      .single();


  if (error) {
    if (storagePath) {
      await supabase.storage
        .from(
          POST_IMAGE_BUCKET
        )
        .remove([
          storagePath,
        ]);
    }

    throw error;
  }


  const {
    error:
      taxonomyError,
  } =
    await supabase.rpc(
      "set_post_tags",
      {
        target_post:
          data.id,

        tag_ids:
          input.tagIds,
      }
    );


  if (taxonomyError) {
    await supabase
      .from(
        "posts"
      )
      .delete()
      .eq(
        "id",
        data.id
      )
      .eq(
        "user_id",
        user.id
      );

    if (storagePath) {
      await supabase.storage
        .from(
          POST_IMAGE_BUCKET
        )
        .remove([
          storagePath,
        ]);
    }

    throw taxonomyError;
  }


  const profiled =
    await attachProfiles([
      data as
        Record<string, any>,
    ]);

  const attached =
    await attachTaxonomy(
      profiled
    );


  return {
    ...attached[0],

    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  };
}


/* ==========================================================
   READ FEED
   ========================================================== */


export async function getFeedPosts() {
  const {
    data,
    error,
  } =
    await supabase
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(50);


  if (error) {
    console.error(
      "ROFFLE POSTS QUERY ERROR:",
      {
        message:
          error.message,

        code:
          error.code,

        details:
          error.details,

        hint:
          error.hint,
      }
    );

    throw error;
  }


  const profiledRecords =
    await attachProfiles(
      (
        data ??
        []
      ) as
        Array<
          Record<string, any>
        >
    );

  const records =
    await attachTaxonomy(
      profiledRecords
    );

  const mainFeedRecords =
    records.filter(
      (
        post
      ) =>
        post.moderation_status !==
          "rejected"
    );

  return attachPostEngagement(
    mainFeedRecords
  );
}

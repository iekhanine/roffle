import { supabase } from "../lib/supabase";

import {
  parseYouTubeUrl,
} from "../lib/youtube";

import type {
  CreateQuickPostInput,
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
   CREATE POST
   ========================================================== */


export async function createQuickPost(
  input:
    CreateQuickPostInput,
): Promise<PostRecord> {
  const user =
    await getCurrentUser();

  let storagePath:
    string | null = null;

  let payload:
    Record<string, unknown>;

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

      title:
        cleanOptionalText(
          input.title
        ),

      body:
        null,

      youtube_url:
        parsed.canonicalUrl,

      youtube_id:
        parsed.youtubeId,

      video_type:
        parsed.videoType,

      image_url:
        null,

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
      .select(`
        id,
        user_id,
        post_type,
        title,
        body,
        youtube_url,
        youtube_id,
        video_type,
        image_url,
        published,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey (
          display_name,
          avatar_url
        )
      `)
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

  return data as unknown as PostRecord;
}


/* ==========================================================
   READ FEED
   ========================================================== */


export async function getPublishedPosts() {
  const {
    data,
    error,
  } =
    await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        post_type,
        title,
        body,
        youtube_url,
        youtube_id,
        video_type,
        image_url,
        published,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey (
          display_name,
          avatar_url
        )
      `)
      .eq(
        "published",
        true
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(50);

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as unknown as PostRecord[];
}

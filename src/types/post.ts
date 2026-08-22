/* ==========================================================
   ROFFLE
   POST TYPES
   ========================================================== */

export type QuickPostType =
  | "youtube"
  | "text"
  | "image";

export type YouTubeVideoType =
  | "short"
  | "video";

export type GifAttachment = {
  id: string;
  url: string;
  previewUrl: string;
};


import type {
  PostCategoryReference,
  PostTagReference,
} from "./taxonomy";


export type PostProfile = {
  display_name: string;
  avatar_url: string | null;
};

export type PostRecord = {
  id: string;
  user_id: string;

  post_type: QuickPostType;

  title: string | null;
  body: string | null;

  youtube_url: string | null;
  youtube_id: string | null;
  video_type: YouTubeVideoType | null;

  image_url: string | null;

  category_id:
    string | null;

  category?:
    PostCategoryReference | null;

  tags?:
    PostTagReference[];

  gif_id: string | null;
  gif_url: string | null;
  gif_preview_url:
    string | null;

  published: boolean;

  moderation_status:
    | "pending"
    | "approved"
    | "rejected";

  submitted_at:
    string | null;

  moderated_at:
    string | null;

  moderation_note:
    string | null;

  created_at: string;
  updated_at: string;

  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;

  profiles?: PostProfile | null;
};

export type CreateYouTubePostInput = {
  postType: "youtube";
  title?: string;
  body?: string;
  youtubeUrl: string;

  categoryId: string;
  tagIds: string[];

  gif?: GifAttachment | null;
};

export type CreateTextPostInput = {
  postType: "text";
  title: string;
  body: string;

  categoryId: string;
  tagIds: string[];

  gif?: GifAttachment | null;
};

export type CreateImagePostInput = {
  postType: "image";
  title?: string;
  body?: string;
  image: File;

  categoryId: string;
  tagIds: string[];

  gif?: GifAttachment | null;
};

export type CreateQuickPostInput =
  | CreateYouTubePostInput
  | CreateTextPostInput
  | CreateImagePostInput;

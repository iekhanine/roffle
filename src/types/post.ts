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

  profiles?: PostProfile | null;
};

export type CreateYouTubePostInput = {
  postType: "youtube";
  title?: string;
  youtubeUrl: string;
};

export type CreateTextPostInput = {
  postType: "text";
  title: string;
  body: string;
};

export type CreateImagePostInput = {
  postType: "image";
  title?: string;
  body?: string;
  image: File;
};

export type CreateQuickPostInput =
  | CreateYouTubePostInput
  | CreateTextPostInput
  | CreateImagePostInput;

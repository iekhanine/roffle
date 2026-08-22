/* ==========================================================
   ROFFLE
   ADMIN TYPES
   ========================================================== */


export type UserRole =
  | "user"
  | "moderator"
  | "admin";


export type AccountStatus =
  | "active"
  | "suspended"
  | "banned";


export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected";


export type MyAccess = {
  role: UserRole;
  account_status:
    AccountStatus;
};


export type AdminStats = {
  total_users: number;
  total_posts: number;
  pending_posts: number;
  approved_posts: number;
  rejected_posts: number;
};


export type AdminUser = {
  user_id: string;
  email: string | null;
  email_confirmed_at:
    string | null;
  provider: string | null;
  created_at: string;
  username: string | null;
  display_name: string;
  role: UserRole;
  account_status:
    AccountStatus;
};


export type ModerationPost = {
  id: string;
  user_id: string;
  post_type:
    | "youtube"
    | "text"
    | "image";
  title: string | null;
  body: string | null;
  youtube_url:
    string | null;
  image_url:
    string | null;
  created_at: string;
  moderation_status:
    ModerationStatus;
  profiles?: {
    username:
      string | null;
    display_name:
      string;
  } | null;
};

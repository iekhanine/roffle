import { supabase } from "../lib/supabase";

import type {
  AccountStatus,
  AdminStats,
  AdminUser,
  ModerationPost,
  MyAccess,
  UserRole,
} from "../types/admin";


/* ==========================================================
   ROFFLE
   ADMIN SERVICE
   ========================================================== */


export async function getMyAccess():
Promise<MyAccess | null> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("user_roles")
      .select(
        "role, account_status"
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    MyAccess | null;
}


export async function getAdminStats() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_dashboard_stats"
    );

  if (error) {
    throw error;
  }

  const first =
    Array.isArray(data)
      ? data[0]
      : data;

  return first as
    AdminStats;
}


export async function getModerationQueue() {
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
        image_url,
        created_at,
        moderation_status,
        profiles!posts_user_id_fkey (
          username,
          display_name
        )
      `)
      .eq(
        "moderation_status",
        "pending"
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as unknown as
    ModerationPost[];
}


export async function moderatePost(
  postId: string,
  decision:
    | "approved"
    | "rejected",
  note?: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "moderate_post",
      {
        target_post:
          postId,

        decision,

        note:
          note?.trim() ||
          null,
      }
    );

  if (error) {
    throw error;
  }
}


export async function getAdminUsers() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_list_users"
    );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as AdminUser[];
}


export async function setUserRole(
  userId: string,
  role: UserRole,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_user_role",
      {
        target_user:
          userId,

        new_role:
          role,
      }
    );

  if (error) {
    throw error;
  }
}


export async function setAccountStatus(
  userId: string,
  status:
    AccountStatus,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_account_status",
      {
        target_user:
          userId,

        new_status:
          status,
      }
    );

  if (error) {
    throw error;
  }
}

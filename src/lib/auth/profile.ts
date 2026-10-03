import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AccountRole = "guest" | "member" | "creator_pending" | "creator" | "admin";

export type UserProfile = {
  id: string;
  displayName: string | null;
  referralCode: string | null;
  creatorStatus: "none" | "pending" | "approved" | "rejected";
  isAdmin: boolean;
  role: AccountRole;
};

export async function getCurrentUserProfile(): Promise<{
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, profile: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: row } = await supabase
    .from("profiles")
    .select(
      "id, display_name, referral_code, creator_status, is_admin, is_creator",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!row) {
    return {
      user: { id: user.id, email: user.email },
      profile: null,
    };
  }

  const creatorStatus = (row.creator_status ??
    "none") as UserProfile["creatorStatus"];

  let role: AccountRole = "member";
  if (row.is_admin) role = "admin";
  else if (creatorStatus === "approved") role = "creator";
  else if (creatorStatus === "pending") role = "creator_pending";

  return {
    user: { id: user.id, email: user.email },
    profile: {
      id: row.id,
      displayName: row.display_name,
      referralCode: row.referral_code,
      creatorStatus,
      isAdmin: row.is_admin ?? false,
      role,
    },
  };
}

export async function requireAuth(redirectTo = "/login") {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect(redirectTo);
  }
  return { user: user!, profile };
}

export async function requireApprovedCreator() {
  const { user, profile } = await requireAuth("/login?next=/studio");
  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    const { redirect } = await import("next/navigation");
    redirect("/become-creator?error=not_approved");
  }
  return { user, profile: profile! };
}

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AccountRole = "guest" | "member" | "creator_pending" | "creator" | "admin";

export type UserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
  creatorStatus: "none" | "pending" | "approved" | "rejected";
  isAdmin: boolean;
  role: AccountRole;
  creatorOnboardingCompleted: boolean;
};

export const getCurrentUserProfile = cache(async (): Promise<{
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
}> => {
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

  const fullSelect =
    "id, display_name, avatar_url, referral_code, creator_status, is_admin, is_creator, creator_onboarding_completed_at";
  const legacySelect =
    "id, display_name, referral_code, creator_status, is_admin, is_creator";

  let { data: row, error } = await supabase
    .from("profiles")
    .select(fullSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (error && /avatar_url|creator_onboarding|schema cache/i.test(error.message)) {
    ({ data: row } = await supabase
      .from("profiles")
      .select(legacySelect)
      .eq("id", user.id)
      .maybeSingle());
  }

  if (!row) {
    return {
      user: { id: user.id, email: user.email },
      profile: null,
    };
  }

  const avatarUrl =
    "avatar_url" in row && typeof row.avatar_url === "string"
      ? row.avatar_url
      : null;

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
      avatarUrl,
      referralCode: row.referral_code,
      creatorStatus,
      isAdmin: row.is_admin ?? false,
      role,
      creatorOnboardingCompleted: Boolean(
        "creator_onboarding_completed_at" in row && row.creator_onboarding_completed_at,
      ),
    },
  };
});

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

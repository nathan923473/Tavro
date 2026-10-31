import {
  accessDecisionForAccount,
  accountNeedsVerification,
  ownershipGateEnabled,
} from "@/lib/auth/email-verification";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AuStateOrTerritory } from "@/lib/timezone/constants";

export type AccountRole = "guest" | "member" | "creator_pending" | "creator" | "admin";

export type UserProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
  creatorStatus: "none" | "pending" | "approved" | "rejected";
  timezone: string | null;
  auStateOrTerritory: AuStateOrTerritory | null;
  isAdmin: boolean;
  role: AccountRole;
  creatorOnboardingCompleted: boolean;
};

export const getCurrentUserProfile = cache(async (): Promise<{
  user: { id: string; email?: string; emailConfirmedAt: string | null } | null;
  profile: UserProfile | null;
  /** undefined when migration 052 is not applied yet. */
  emailOwnershipVerifiedAt: string | null | undefined;
}> => {
  if (!isSupabaseConfigured()) {
    return { user: null, profile: null, emailOwnershipVerifiedAt: undefined };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, emailOwnershipVerifiedAt: undefined };
  }

  const accountUser = {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  };

  const fullSelect =
    "id, display_name, avatar_url, referral_code, creator_status, timezone, au_state_or_territory, is_admin, is_creator, creator_onboarding_completed_at, email_ownership_verified_at";
  const legacySelect =
    "id, display_name, referral_code, creator_status, timezone, is_admin, is_creator";

  let usedFallback = false;
  let { data: row, error } = await supabase
    .from("profiles")
    .select(fullSelect)
    .eq("id", user.id)
    .maybeSingle();

  if (
    error &&
    /avatar_url|creator_onboarding|timezone|au_state|email_ownership|schema cache/i.test(
      error.message,
    )
  ) {
    usedFallback = true;
    ({ data: row } = await supabase
      .from("profiles")
      .select(legacySelect)
      .eq("id", user.id)
      .maybeSingle());
  }

  let emailOwnershipVerifiedAt: string | null | undefined = undefined;
  if (!usedFallback && row && "email_ownership_verified_at" in row) {
    emailOwnershipVerifiedAt =
      typeof row.email_ownership_verified_at === "string"
        ? row.email_ownership_verified_at
        : null;
  }

  if (!row) {
    return {
      user: accountUser,
      profile: null,
      emailOwnershipVerifiedAt,
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
    user: accountUser,
    emailOwnershipVerifiedAt,
    profile: {
      id: row.id,
      displayName: row.display_name,
      avatarUrl,
      referralCode: row.referral_code,
      creatorStatus,
      timezone:
        "timezone" in row && typeof row.timezone === "string" ? row.timezone : null,
      auStateOrTerritory:
        "au_state_or_territory" in row &&
        typeof row.au_state_or_territory === "string"
          ? (row.au_state_or_territory as AuStateOrTerritory)
          : null,
      isAdmin: row.is_admin ?? false,
      role,
      creatorOnboardingCompleted: Boolean(
        "creator_onboarding_completed_at" in row && row.creator_onboarding_completed_at,
      ),
    },
  };
});

export async function requireAuth(redirectTo = "/login") {
  const session = await getCurrentUserProfile();
  const { redirect } = await import("next/navigation");
  if (!session.user) {
    redirect(redirectTo);
  }
  const user = session.user!;
  const decision = accessDecisionForAccount({
    hasUser: true,
    emailConfirmedAt: user.emailConfirmedAt,
    ownershipVerifiedAt: session.emailOwnershipVerifiedAt,
    enforceOwnership: ownershipGateEnabled(),
  });
  if (accountNeedsVerification(decision)) {
    redirect("/verify-email");
  }
  return { user, profile: session.profile };
}

export async function requireApprovedCreator() {
  const { user, profile } = await requireAuth("/login?next=/studio");
  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    const { redirect } = await import("next/navigation");
    redirect("/become-creator?error=not_approved");
  }
  return { user, profile: profile! };
}

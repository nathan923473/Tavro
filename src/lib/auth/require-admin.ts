import {
  accessDecisionForAccount,
  accountNeedsVerification,
  ownershipGateEnabled,
} from "@/lib/auth/email-verification";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { redirect } from "next/navigation";

export async function requireAdmin(nextPath = "/admin/creator-applications") {
  const session = await getCurrentUserProfile();
  if (!session.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  const decision = accessDecisionForAccount({
    hasUser: true,
    emailConfirmedAt: session.user.emailConfirmedAt,
    ownershipVerifiedAt: session.emailOwnershipVerifiedAt,
    enforceOwnership: ownershipGateEnabled(),
  });
  if (accountNeedsVerification(decision)) {
    redirect(`/verify-email?next=${encodeURIComponent(nextPath)}`);
  }
  if (session.profile?.role !== "admin") {
    redirect("/profile?error=admin_only");
  }
  return { user: session.user, profile: session.profile! };
}

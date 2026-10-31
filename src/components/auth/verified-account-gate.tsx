import {
  accessDecisionForAccount,
  accountNeedsVerification,
  ownershipGateEnabled,
} from "@/lib/auth/email-verification";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Signed-out visitors can browse. Signed-in accounts must prove the inbox first. */
export async function VerifiedAccountGate({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore
    .getAll()
    .some((cookie) => cookie.name.includes("-auth-token"));
  if (!hasSessionCookie) return children;

  const session = await getCurrentUserProfile();
  if (!session.user) return children;

  const decision = accessDecisionForAccount({
    hasUser: true,
    emailConfirmedAt: session.user.emailConfirmedAt,
    ownershipVerifiedAt: session.emailOwnershipVerifiedAt,
    enforceOwnership: ownershipGateEnabled(),
  });
  if (accountNeedsVerification(decision)) {
    redirect("/verify-email");
  }
  return children;
}

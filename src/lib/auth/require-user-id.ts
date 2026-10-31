import {
  accessDecisionForAccount,
  accountNeedsVerification,
  ownershipGateEnabled,
} from "@/lib/auth/email-verification";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function assertVerifiedAccount(): Promise<void> {
  const session = await getCurrentUserProfile();
  if (!session.user) throw new Error("Log in required.");
  const decision = accessDecisionForAccount({
    hasUser: true,
    emailConfirmedAt: session.user.emailConfirmedAt,
    ownershipVerifiedAt: session.emailOwnershipVerifiedAt,
    enforceOwnership: ownershipGateEnabled(),
  });
  if (accountNeedsVerification(decision)) {
    throw new Error("Confirm your email before continuing.");
  }
}

export async function requireUserId() {
  await assertVerifiedAccount();
  const { user } = await getCurrentUserProfile();
  const supabase = await createClient();
  return { supabase, userId: user!.id };
}

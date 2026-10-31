import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import {
  accessDecisionForAccount,
  ownershipGateEnabled,
} from "@/lib/auth/email-verification";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { safeInternalPath } from "@/lib/site-url";
import { redirect } from "next/navigation";

export const metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; next?: string }>;
}) {
  const query = await searchParams;
  const nextPath = safeInternalPath(query.next);
  const session = await getCurrentUserProfile();
  const decision = accessDecisionForAccount({
    hasUser: Boolean(session.user),
    emailConfirmedAt: session.user?.emailConfirmedAt ?? null,
    ownershipVerifiedAt: session.emailOwnershipVerifiedAt,
    enforceOwnership: ownershipGateEnabled(),
  });

  if (decision === "ok") {
    redirect(nextPath);
  }

  const mode =
    decision === "needs_reverify" ? "reverify" : session.user ? "confirm" : "signed_out";

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 pt-[env(safe-area-inset-top)]">
      <StandalonePageHeader pathname="/verify-email" title="Verify your email" />
      <VerifyEmailPanel
        mode={mode}
        email={session.user?.email ?? query.email ?? ""}
        nextPath={nextPath}
        queryError={query.error}
      />
    </div>
  );
}

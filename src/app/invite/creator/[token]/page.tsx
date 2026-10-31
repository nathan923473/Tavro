import { acceptCreatorInvitationAction } from "@/app/invite/creator/[token]/actions";
import { StandalonePageHeader } from "@/components/layout/standalone-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { isCreatorInvitationToken } from "@/lib/creator/invitation-token";
import { previewCreatorInvitation } from "@/lib/creator/invitations";
import { invitationPreviewCopy } from "@/lib/creator/onboarding-rules";
import { safeInternalPath } from "@/lib/site-url";
import Link from "next/link";

export const metadata = { title: "Creator invitation" };

export default async function CreatorInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const nextPath = safeInternalPath(`/invite/creator/${token}`);
  const preview = isCreatorInvitationToken(token)
    ? await previewCreatorInvitation(token)
    : { state: "invalid" as const, expiresAt: null };
  const copy = invitationPreviewCopy(preview.state);
  const { user, profile } = await getCurrentUserProfile();
  const alreadyCreator = profile?.role === "creator" || profile?.role === "admin";

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 pt-[env(safe-area-inset-top)]">
      <div className="animate-fade-up space-y-4">
        <StandalonePageHeader pathname={nextPath} title="Creator invitation" />
        <Card className="space-y-3">
          <h1 className="text-xl font-semibold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.body}</p>
          {query.error ? (
            <p className="text-sm text-destructive" role="alert">
              {query.error}
            </p>
          ) : null}
          {preview.state === "ready" && !user ? (
            <div className="grid gap-2">
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                Create account
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
              >
                I already have an account
              </Link>
            </div>
          ) : null}
          {preview.state === "ready" && user ? (
            <form action={acceptCreatorInvitationAction.bind(null, token)} className="space-y-3">
              <p className="text-sm">
                Signed in as <strong>{user.email}</strong>. The invite only works for the
                email the admin entered.
              </p>
              {alreadyCreator ? (
                <p className="text-sm text-muted-foreground">
                  This account already has Creator Studio. Accepting uses up the invite
                  and records who approved it.
                </p>
              ) : null}
              <Button type="submit" fullWidth>
                Accept and open Creator Studio
              </Button>
            </form>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

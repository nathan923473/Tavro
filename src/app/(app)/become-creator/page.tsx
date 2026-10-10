import { BecomeCreatorForm } from "@/components/creator/become-creator-form";
import { CreatorVerificationPanel } from "@/components/creator/creator-verification-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getOpenApplicationForUser } from "@/lib/creator/applications";
import { getOfficialDmTarget } from "@/lib/creator/verification";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Become a creator" };

export default async function BecomeCreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string; app?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login?next=/become-creator");
  }

  if (profile?.role === "creator" || profile?.role === "admin") {
    redirect("/studio");
  }

  const openApplication = await getOpenApplicationForUser(user.id);
  const ownershipRequested =
    openApplication?.status === "pending_verification" &&
    openApplication.verification_state !== "verified";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Become a creator"
        subtitle="Manual approval · same login as members"
      />
      <div className="space-y-4 px-4 py-4">
        {params.error === "not_approved" ? (
          <Card className="border-amber-200 bg-amber-50/80">
            <p className="text-sm">
              Creator Studio requires approval.{" "}
              <Link href="/creators" className="font-medium text-primary">
                Learn about becoming a creator
              </Link>{" "}
              or apply below.
            </p>
          </Card>
        ) : null}

        {openApplication ? (
          <>
            <Card>
              <h2 className="font-semibold">Application submitted</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong>{openApplication.display_name}</strong> — your
                application is with our team for manual review. Ownership
                verification is only needed if an admin asks for it.
              </p>
            </Card>
            {ownershipRequested ? (
              <CreatorVerificationPanel
                application={openApplication}
                dmTarget={getOfficialDmTarget()}
              />
            ) : openApplication.verification_state === "verified" ? (
              <Card>
                <p className="text-sm text-muted-foreground">
                  Ownership verified. Waiting for final creator approval.
                </p>
              </Card>
            ) : (
              <Card className="border-dashed">
                <p className="text-sm text-muted-foreground">
                  No further action needed right now. We&apos;ll unlock Creator
                  Studio on this same account if you&apos;re approved.
                </p>
              </Card>
            )}
          </>
        ) : profile?.creatorStatus === "rejected" ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Your previous application was not approved. Contact support to reapply.
            </p>
          </Card>
        ) : (
          <>
            <Card className="border-dashed">
              <p className="text-sm text-muted-foreground">
                New here? Read why creators join Tavro on the{" "}
                <Link href="/creators" className="font-medium text-primary">
                  creators page
                </Link>
                .
              </p>
            </Card>
            <BecomeCreatorForm />
          </>
        )}

        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            Members can always create{" "}
            <Link href="/challenges/create" className="font-medium text-primary">
              private invite-only challenges
            </Link>{" "}
            without creator approval.
          </p>
        </Card>
      </div>
    </div>
  );
}

import { BecomeCreatorForm } from "@/components/creator/become-creator-form";
import { CreatorVerificationPanel } from "@/components/creator/creator-verification-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getOpenApplicationForUser } from "@/lib/creator/applications";
import { getOfficialDmInstructions } from "@/lib/creator/verification";
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
              Creator Studio requires approval. Apply below or keep enjoying member
              features.
            </p>
          </Card>
        ) : null}

        {openApplication ? (
          <>
            <Card>
              <h2 className="font-semibold">Application submitted</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong>{openApplication.display_name}</strong> — verify your
                social account, then wait for admin review.
              </p>
            </Card>
            <CreatorVerificationPanel
              application={openApplication}
              dmTarget={getOfficialDmInstructions()}
            />
          </>
        ) : profile?.creatorStatus === "rejected" ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              Your previous application was not approved. Contact support to reapply.
            </p>
          </Card>
        ) : (
          <BecomeCreatorForm />
        )}

        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            After approval, you publish free public challenges from Creator Studio — the only way
            to host a challenge on Tavro.
          </p>
        </Card>
      </div>
    </div>
  );
}

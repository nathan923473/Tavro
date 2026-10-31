import { BecomeCreatorForm } from "@/components/creator/become-creator-form";
import { CreatorVerificationPanel } from "@/components/creator/creator-verification-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getLatestApplicationForUser } from "@/lib/creator/applications";
import {
  applicantNextStep,
  applicantStatusCopy,
} from "@/lib/creator/onboarding-rules";
import { getOfficialDmInstructions } from "@/lib/creator/verification";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Become a creator" };

export default async function BecomeCreatorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login?next=/become-creator");
  }

  if (profile?.role === "creator" || profile?.role === "admin") {
    redirect("/studio");
  }

  const application = await getLatestApplicationForUser(user.id);
  let reapplyPermitted = false;
  const supabase = await createClient();
  const reapply = await supabase
    .from("profiles")
    .select("creator_reapply_permitted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!reapply.error) {
    reapplyPermitted = Boolean(reapply.data?.creator_reapply_permitted_at);
  }

  const step = applicantNextStep(
    application
      ? {
          status: application.status,
          verificationState: application.verification_state,
          expiresAt: application.verification_code_expires_at,
          reviewedBy: application.reviewed_by ?? null,
          reapplyPermitted,
        }
      : null,
  );
  const copy = applicantStatusCopy(step);

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
              Creator Studio requires approval. Apply below, or keep using member
              features. A personal invite from an admin is the other way in.
            </p>
          </Card>
        ) : null}

        {step.kind === "verify" && application ? (
          <CreatorVerificationPanel
            application={application}
            dmTarget={getOfficialDmInstructions()}
            canRefreshCode={step.canRefreshCode}
            statusTitle={copy.title}
            statusBody={copy.body}
          />
        ) : null}

        {step.kind === "review" ? (
          <Card>
            <h2 className="font-semibold">{copy.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
            {application ? (
              <p className="mt-3 text-sm">
                <strong>{application.display_name}</strong>
                {application.coaching_focus ? ` · ${application.coaching_focus}` : ""}
              </p>
            ) : null}
          </Card>
        ) : null}

        {step.kind === "rejected" ? (
          <Card>
            <h2 className="font-semibold">{copy.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
          </Card>
        ) : null}

        {step.kind === "form" ? (
          <>
            {step.reapply ? (
              <Card className="border-primary/30 bg-primary/5">
                <h2 className="font-semibold">{copy.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
              </Card>
            ) : null}
            <BecomeCreatorForm reapply={step.reapply} />
          </>
        ) : null}

        <Card className="border-dashed">
          <p className="text-sm text-muted-foreground">
            After approval you go straight to Creator Studio. The setup checklist is
            optional — you can create a challenge immediately.
          </p>
        </Card>
      </div>
    </div>
  );
}

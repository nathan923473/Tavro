import { ChallengeBuilderWizard } from "@/components/creator/studio/challenge-builder-wizard";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { Suspense } from "react";

export const metadata = { title: "Create challenge" };

export default async function NewChallengePage() {
  await requireApprovedCreator();

  return (
    <StudioLayout
      title="Create challenge"
      subtitle="Free · ~5–10 minutes once your content is ready"
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ChallengeBuilderWizard />
      </Suspense>
    </StudioLayout>
  );
}

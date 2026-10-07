import { ChallengeBuilderWizard } from "@/components/creator/studio/challenge-builder-wizard";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { Suspense } from "react";

export const metadata = { title: "Create challenge" };

export default async function NewChallengePage() {
  const { user } = await requireApprovedCreator();
  const supabase = await createClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const defaultChallengeTimezone = normalizeTimezone(
    profileRow?.timezone,
    DEFAULT_FALLBACK_TIMEZONE,
  );

  return (
    <StudioLayout
      title="Create challenge"
      subtitle="Free · ~5–10 minutes once your content is ready"
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ChallengeBuilderWizard defaultChallengeTimezone={defaultChallengeTimezone} />
      </Suspense>
    </StudioLayout>
  );
}

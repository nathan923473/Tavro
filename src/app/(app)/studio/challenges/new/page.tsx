import { ChallengeBuilderWizard } from "@/components/creator/studio/challenge-builder-wizard";
import { ChallengeStartChoice } from "@/components/creator/studio/challenge-start-choice";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { findLibraryTemplate, templateByKey } from "@/lib/creator/challenge-templates";
import { getPersonalChallengeTemplate } from "@/lib/creator/personal-templates";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { redirect } from "next/navigation";

export const metadata = { title: "Create challenge" };

export default async function NewChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; personal?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireApprovedCreator();
  const supabase = await createClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("timezone, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const defaultChallengeTimezone = normalizeTimezone(
    profileRow?.timezone,
    DEFAULT_FALLBACK_TIMEZONE,
  );

  if (!params.template && !params.personal) {
    return (
      <StudioLayout title="Create challenge" subtitle="Start blank, or start from a template">
        <ChallengeStartChoice />
      </StudioLayout>
    );
  }

  const personal = params.personal
    ? await getPersonalChallengeTemplate(user.id, params.personal)
    : null;
  if (params.personal && !personal) {
    redirect("/studio/challenges/templates?error=missing_template");
  }

  const libraryTemplate = params.template ? findLibraryTemplate(params.template) : null;
  if (params.template && params.template !== "scratch" && !libraryTemplate) {
    redirect("/studio/challenges/templates?error=missing_template");
  }

  const template = personal ?? libraryTemplate ?? templateByKey("scratch");

  return (
    <StudioLayout
      title="Create challenge"
      subtitle={template.key === "scratch" ? "Blank draft · edit everything before you publish" : "Template copied into a new draft · edit anything"}
    >
      <ChallengeBuilderWizard
        defaultChallengeTimezone={defaultChallengeTimezone}
        creatorDisplayName={profileRow?.display_name ?? "You"}
        creatorAvatarUrl={profileRow?.avatar_url ?? null}
        template={template}
      />
    </StudioLayout>
  );
}

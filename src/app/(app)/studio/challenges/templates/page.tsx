import { ChallengeTemplateLibrary } from "@/components/creator/studio/challenge-template-library";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { findLibraryTemplate, libraryTemplates } from "@/lib/creator/challenge-templates";
import { listPersonalChallengeTemplates } from "@/lib/creator/personal-templates";

export const metadata = { title: "Challenge templates" };

export default async function ChallengeTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string; previewPersonal?: string; notice?: string; error?: string }>;
}) {
  const { user } = await requireApprovedCreator();
  const params = await searchParams;
  const personal = await listPersonalChallengeTemplates(user.id);
  const personalTemplates = personal.status === "ok" ? personal.templates : [];

  const officialPreview = params.preview ? findLibraryTemplate(params.preview) : null;
  const personalPreview = params.previewPersonal
    ? personalTemplates.find((template) => template.id === params.previewPersonal) ?? null
    : null;
  const preview = officialPreview
    ? {
        template: officialPreview,
        useHref: `/studio/challenges/new?template=${officialPreview.key}`,
      }
    : personalPreview
      ? {
          template: personalPreview,
          useHref: `/studio/challenges/new?personal=${personalPreview.id}`,
        }
      : null;

  return (
    <StudioLayout
      title="Challenge templates"
      subtitle="Preview a plan, then customise it"
    >
      <ChallengeTemplateLibrary
        official={libraryTemplates()}
        personal={personalTemplates}
        migrationRequired={personal.status === "migration"}
        preview={preview}
        notice={params.notice ?? null}
        error={params.error ?? null}
      />
    </StudioLayout>
  );
}

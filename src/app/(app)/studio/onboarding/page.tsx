import { CreatorSetupChecklist } from "@/components/creator/studio/creator-setup-checklist";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { loadCreatorSetup } from "@/lib/creator/setup-progress";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Creator setup" };

export default async function CreatorOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireApprovedCreator();
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("slug, community_name, bio")
    .eq("owner_id", user.id)
    .maybeSingle();
  const setup = await loadCreatorSetup(
    user.id,
    community
      ? {
          slug: community.slug,
          communityName: community.community_name,
          bio: community.bio,
        }
      : null,
  );
  const welcome = params.welcome === "invite" || setup.welcome === "invite" ? "invite" : "approved";

  return (
    <div className="animate-fade-up pb-6">
      <PageHeader
        title={welcome === "invite" ? "You're invited" : "Creator setup"}
        subtitle="Optional · create a challenge whenever you're ready"
      />
      <div className="px-4 py-4">
        <CreatorSetupChecklist
          steps={setup.steps}
          welcome={welcome}
          shareChallengeId={setup.shareChallengeId}
          sharePath={setup.sharePath}
          shareTitle={setup.shareTitle}
        />
      </div>
    </div>
  );
}

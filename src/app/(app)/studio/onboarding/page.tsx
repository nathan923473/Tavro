import { CreatorOnboardingFlow } from "@/components/creator/studio/creator-onboarding-flow";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Creator onboarding" };

export default async function CreatorOnboardingPage() {
  const { user, profile } = await requireApprovedCreator();
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("slug, community_name, bio, avatar_url, banner_url")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="animate-fade-up pb-6">
      <PageHeader
        title="Welcome to Creator Studio"
        subtitle="Publish your first free challenge"
      />
      <div className="px-4 py-4">
        <CreatorOnboardingFlow
          communitySlug={community?.slug ?? null}
          skipped={Boolean(profile?.creatorOnboardingCompleted)}
        />
      </div>
    </div>
  );
}

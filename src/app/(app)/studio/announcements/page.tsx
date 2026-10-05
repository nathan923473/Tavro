import { StudioAnnouncementsPanel } from "@/components/creator/studio/studio-announcements-panel";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCreatorAnnouncements, fetchCreatorStudioChallenges } from "@/lib/data/creator-studio";
import { fetchOwnerCommunity } from "@/lib/data/communities";

export const metadata = { title: "Announcements" };

type Props = { searchParams: Promise<{ challenge?: string }> };

export default async function StudioAnnouncementsPage({ searchParams }: Props) {
  const { user } = await requireApprovedCreator();
  const community = await fetchOwnerCommunity(user.id);
  const params = await searchParams;

  if (!community) {
    return (
      <StudioLayout title="Announcements" subtitle="Requires a community page">
        <p className="text-sm text-muted-foreground">
          <a href="/studio/community" className="font-medium text-primary">
            Create your community
          </a>{" "}
          first.
        </p>
      </StudioLayout>
    );
  }

  const [announcements, challenges] = await Promise.all([
    fetchCreatorAnnouncements(community.id),
    fetchCreatorStudioChallenges(user.id),
  ]);

  return (
    <StudioLayout title="Announcements" subtitle="Community-wide or per challenge">
      <StudioAnnouncementsPanel
        communityId={community.id}
        challenges={challenges.filter((c) => c.publishStatus !== "draft")}
        announcements={announcements}
        defaultChallengeId={params.challenge ?? null}
      />
    </StudioLayout>
  );
}

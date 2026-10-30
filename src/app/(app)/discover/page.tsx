import { DiscoverInteractive } from "@/components/discover/discover-interactive";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchJoinedChallengeIds } from "@/lib/data/challenges";
import { fetchDiscoverSectionsCached } from "@/lib/data/discover-cached";
import { fetchMemberGoalPreferences } from "@/lib/data/member-preferences";
import { sortChallengesByMemberPreferences } from "@/lib/member/sort-challenges";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const { user } = await getCurrentUserProfile();
  const [sections, joinedIds, memberPrefs] = await Promise.all([
    fetchDiscoverSectionsCached(),
    user?.id ? fetchJoinedChallengeIds(user.id) : Promise.resolve([]),
    user?.id
      ? fetchMemberGoalPreferences(user.id)
      : Promise.resolve({ workTowards: null, growthFriction: null }),
  ]);

  const personalized = {
    ...sections,
    active: sortChallengesByMemberPreferences(sections.active, memberPrefs),
    upcoming: sortChallengesByMemberPreferences(sections.upcoming, memberPrefs),
    featured: sortChallengesByMemberPreferences(sections.featured, memberPrefs),
  };

  return (
    <div className="animate-fade-up pb-6">
      <PageHeader
        title="Discover"
        subtitle="Same search as the Challenges tab — browse everything in one place"
      />
      <div className="px-4 py-4">
        <DiscoverInteractive
          initial={personalized}
          viewerUserId={user?.id ?? null}
          joinedChallengeIds={joinedIds}
        />
      </div>
    </div>
  );
}

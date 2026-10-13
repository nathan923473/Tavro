import { DiscoverInteractive } from "@/components/discover/discover-interactive";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchChallengesForUser } from "@/lib/data/challenges";
import { fetchDiscoverSections } from "@/lib/data/discover";
import { fetchMemberGoalPreferences } from "@/lib/data/member-preferences";
import { sortChallengesByMemberPreferences } from "@/lib/member/sort-challenges";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const { user } = await getCurrentUserProfile();
  const [sections, joinedMine, memberPrefs] = await Promise.all([
    fetchDiscoverSections(),
    user?.id ? fetchChallengesForUser(user.id) : Promise.resolve({ mine: [], discover: [] }),
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
          joinedChallengeIds={joinedMine.mine.map((c) => c.id)}
        />
      </div>
    </div>
  );
}

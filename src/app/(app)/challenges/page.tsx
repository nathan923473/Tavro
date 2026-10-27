import { ChallengesInteractive } from "@/components/challenges/challenges-interactive";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { DiscoverInteractive } from "@/components/discover/discover-interactive";
import { fetchJoinedChallengesForMember } from "@/lib/data/challenges";
import { fetchDiscoverSectionsCached } from "@/lib/data/discover-cached";
import { fetchMemberGoalPreferences } from "@/lib/data/member-preferences";
import { sortChallengesByMemberPreferences } from "@/lib/member/sort-challenges";
import { fetchChallengeMessagesForChallenges } from "@/lib/data/messages";
import { MutedCallout } from "@/components/ui/muted-callout";
import { SecondaryLink } from "@/components/ui/link-button";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Challenges",
};

export default async function ChallengesPage() {
  const { user, profile } = await getCurrentUserProfile();
  const userId = user?.id ?? null;
  const viewerName =
    profile?.displayName?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    "Member";

  const [mine, discoverSections, memberPrefs] = await Promise.all([
    userId ? fetchJoinedChallengesForMember(userId) : Promise.resolve([]),
    fetchDiscoverSectionsCached(),
    userId
      ? fetchMemberGoalPreferences(userId)
      : Promise.resolve({ workTowards: null, growthFriction: null }),
  ]);

  const personalizedDiscover = {
    ...discoverSections,
    active: sortChallengesByMemberPreferences(discoverSections.active, memberPrefs),
    upcoming: sortChallengesByMemberPreferences(discoverSections.upcoming, memberPrefs),
    featured: sortChallengesByMemberPreferences(discoverSections.featured, memberPrefs),
  };

  const challengeMessages = userId
    ? await fetchChallengeMessagesForChallenges(mine.map((c) => c.id))
    : {};

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Challenges"
        subtitle="Search free creator challenges · join in one tap"
      />
      <div className="page-stack px-4 py-4">
        <DiscoverInteractive
          initial={personalizedDiscover}
          variant="embedded"
          viewerUserId={userId}
          joinedChallengeIds={mine.map((c) => c.id)}
        />

        {profile?.role === "creator" || profile?.role === "admin" ? (
          <SecondaryLink href="/studio/challenges" fullWidth className="border-primary/30 bg-secondary/40 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            Add photos to your public challenges
          </SecondaryLink>
        ) : null}

        <MutedCallout title="100% free at launch">
          Creators host public challenges from Creator Studio. Every challenge has a unique invite
          link.
        </MutedCallout>

        <ChallengesInteractive
          mine={mine}
          viewerName={viewerName}
          loggedIn={Boolean(userId)}
          viewerUserId={userId}
          challengeMessages={challengeMessages}
        />
      </div>
    </div>
  );
}

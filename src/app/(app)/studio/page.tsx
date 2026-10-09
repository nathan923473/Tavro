import { CreatorChallengeMessageHub } from "@/components/creator/creator-challenge-message-hub";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { QuickActionsGrid } from "@/components/creator/studio/quick-actions-grid";
import { CurrentChallengeCard } from "@/components/creator/studio/current-challenge-card";
import { CommunityGrowthChart } from "@/components/creator/studio/community-growth-chart";
import { StudioPerformanceSummary } from "@/components/creator/studio/studio-performance-summary";
import { StudioUpcomingChallengeCard } from "@/components/creator/studio/studio-upcoming-challenge-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCommunityBySlug, fetchOwnerCommunity } from "@/lib/data/communities";
import { fetchCreatorStudioOverview } from "@/lib/data/creator-studio";
import Link from "next/link";

export const metadata = { title: "Creator Studio" };

export default async function CreatorStudioPage() {
  const { user, profile } = await requireApprovedCreator();
  const ownerRow = await fetchOwnerCommunity(user.id);
  const overview = await fetchCreatorStudioOverview(user.id);

  const { community } = ownerRow
    ? await fetchCommunityBySlug(ownerRow.slug, user.id)
    : { community: null };

  const displayName = profile.displayName ?? "creator";

  return (
    <StudioLayout
      title="Creator Studio"
      subtitle={`Welcome back, ${displayName} · free for approved creators`}
    >
      {!profile.creatorOnboardingCompleted ? (
        <Card className="border-dashed border-primary/40">
          <p className="text-sm font-medium">New creator? Finish the 3-minute setup.</p>
          <Link href="/studio/onboarding" className="mt-2 inline-block text-sm font-semibold text-primary">
            Start creator onboarding →
          </Link>
        </Card>
      ) : null}

      <Card className="border-primary/20 bg-secondary/30">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">Approved creator</Badge>
          {profile.isAdmin ? <Badge tone="muted">Admin</Badge> : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {overview.currentChallenge
            ? `Live now: ${overview.currentChallenge.title} · ${overview.currentChallenge.participantCount} participants`
            : overview.upcomingChallenge
              ? `Next up: ${overview.upcomingChallenge.title} · ${overview.upcomingChallenge.participantCount} registered`
              : "No active challenge — create or schedule your next one."}
        </p>
      </Card>

      <QuickActionsGrid hasCommunity={Boolean(community)} communitySlug={overview.communitySlug} />

      <StudioPerformanceSummary
        followers={overview.totalFollowers}
        registrations={overview.totalRegistrations}
        activeParticipants={overview.activeParticipantsTotal}
        linkClicks={overview.totalLinkClicks}
      />

      <section aria-labelledby="current-challenge-heading">
        <h2 id="current-challenge-heading" className="mb-2 text-base font-semibold">
          Current challenge
        </h2>
        {overview.currentChallenge ? (
          <div className="space-y-2">
            <CurrentChallengeCard
              challenge={overview.currentChallenge}
              communitySlug={overview.communitySlug}
            />
            {overview.otherActiveChallenges.map((c) => (
              <CurrentChallengeCard
                key={c.id}
                challenge={c}
                communitySlug={overview.communitySlug}
                compact
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed text-center">
            <p className="text-sm text-muted-foreground">No active challenge</p>
            <Link
              href="/studio/challenges/new"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Create challenge
            </Link>
          </Card>
        )}
      </section>

      {overview.upcomingChallenge ? (
        <section aria-labelledby="upcoming-challenge-heading">
          <h2 id="upcoming-challenge-heading" className="mb-2 text-base font-semibold">
            Upcoming challenge
          </h2>
          <StudioUpcomingChallengeCard challenge={overview.upcomingChallenge} />
        </section>
      ) : null}

      <section aria-labelledby="your-community-heading">
        <h2 id="your-community-heading" className="mb-2 text-base font-semibold">
          Your community
        </h2>
        <Card className="space-y-1">
          {overview.communityName ? (
            <>
              <p className="text-3xl font-semibold tabular-nums">
                {overview.totalFollowers.toLocaleString()} followers
              </p>
              <p className="text-sm text-primary">
                +{overview.newFollowersThisMonth} this month
              </p>
              <p className="text-xs text-muted-foreground">
                +{overview.newFollowersThisWeek} this week
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Set up your permanent community page first.
              </p>
              <Link href="/studio/community/setup" className="text-sm font-semibold text-primary">
                Create community →
              </Link>
            </>
          )}
        </Card>
      </section>

      {overview.growthByWeek.some((w) => w.count > 0) ? (
        <section aria-labelledby="growth-heading">
          <h2 id="growth-heading" className="mb-2 text-base font-semibold">
            Follower growth
          </h2>
          <CommunityGrowthChart data={overview.growthByWeek} />
        </section>
      ) : null}

      {overview.recentActivity.length > 0 ? (
        <section aria-labelledby="recent-activity-heading">
          <h2 id="recent-activity-heading" className="mb-2 text-base font-semibold">
            Recent community activity
          </h2>
          <ul className="space-y-2">
            {overview.recentActivity.map((item) => (
              <li key={item.id}>
                <Card padding="sm">
                  <p className="text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {community ? (
        <section aria-labelledby="challenge-groups-heading">
          <h2 id="challenge-groups-heading" className="mb-2 text-base font-semibold">
            Message challenge groups
          </h2>
          <CreatorChallengeMessageHub
            creatorDisplayName={community.creatorDisplayName}
            challenges={community.challenges}
          />
        </section>
      ) : null}

      {community ? (
        <Link
          href={`/creator/${community.slug}`}
          className="block text-center text-sm font-medium text-primary"
        >
          View public creator profile →
        </Link>
      ) : null}
    </StudioLayout>
  );
}

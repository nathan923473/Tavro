import { CreatorChallengeMessageHub } from "@/components/creator/creator-challenge-message-hub";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { QuickActionsGrid } from "@/components/creator/studio/quick-actions-grid";
import { CurrentChallengeCard } from "@/components/creator/studio/current-challenge-card";
import { CommunityGrowthChart } from "@/components/creator/studio/community-growth-chart";
import { StudioPerformanceSummary } from "@/components/creator/studio/studio-performance-summary";
import { StudioUpcomingChallengeCard } from "@/components/creator/studio/studio-upcoming-challenge-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreatorSetupChecklist } from "@/components/creator/studio/creator-setup-checklist";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { loadCreatorSetup } from "@/lib/creator/setup-progress";
import { fetchCommunityBySlug, fetchOwnerCommunity } from "@/lib/data/communities";
import { fetchCreatorStudioOverview } from "@/lib/data/creator-studio";
import { PrimaryLink } from "@/components/ui/link-button";
import { SectionHeader } from "@/components/ui/section-header";
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
  const setup = profile.creatorOnboardingCompleted
    ? null
    : await loadCreatorSetup(
        user.id,
        community
          ? { slug: community.slug, communityName: community.communityName, bio: community.bio }
          : null,
      );

  return (
    <StudioLayout
      title="Creator Studio"
      subtitle={`Welcome back, ${displayName} · free for approved creators`}
    >
      {setup ? (
        <CreatorSetupChecklist
          steps={setup.steps}
          welcome={setup.welcome}
          shareChallengeId={setup.shareChallengeId}
          sharePath={setup.sharePath}
          shareTitle={setup.shareTitle}
        />
      ) : null}

      <Card variant="brand" className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">Approved creator</Badge>
          {profile.isAdmin ? <Badge tone="muted">Admin</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
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

      <section aria-labelledby="current-challenge-heading" className="section-stack">
        <SectionHeader titleId="current-challenge-heading" title="Current challenge" />
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
            <PrimaryLink href="/studio/challenges/new" className="mt-3 rounded-xl">
              Create challenge
            </PrimaryLink>
          </Card>
        )}
      </section>

      {overview.upcomingChallenge ? (
        <section aria-labelledby="upcoming-challenge-heading" className="section-stack">
          <SectionHeader titleId="upcoming-challenge-heading" title="Upcoming challenge" />
          <StudioUpcomingChallengeCard challenge={overview.upcomingChallenge} />
        </section>
      ) : null}

      <section aria-labelledby="your-community-heading" className="section-stack">
        <SectionHeader titleId="your-community-heading" title="Your community" />
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
        <section aria-labelledby="growth-heading" className="section-stack">
          <SectionHeader titleId="growth-heading" title="Follower growth" />
          <CommunityGrowthChart data={overview.growthByWeek} />
        </section>
      ) : null}

      {overview.recentActivity.length > 0 ? (
        <section aria-labelledby="recent-activity-heading" className="section-stack">
          <SectionHeader titleId="recent-activity-heading" title="Recent community activity" />
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
        <section aria-labelledby="challenge-groups-heading" className="section-stack">
          <SectionHeader titleId="challenge-groups-heading" title="Message challenge groups" />
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

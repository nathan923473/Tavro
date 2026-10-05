import { CreatorChallengeMessageHub } from "@/components/creator/creator-challenge-message-hub";
import { StudioLayout } from "@/components/creator/studio/studio-layout";
import { QuickActionsGrid } from "@/components/creator/studio/quick-actions-grid";
import { CurrentChallengeCard } from "@/components/creator/studio/current-challenge-card";
import { CommunityGrowthChart } from "@/components/creator/studio/community-growth-chart";
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

  return (
    <StudioLayout
      title="Creator Studio"
      subtitle={`Hi ${profile.displayName ?? "creator"} · free challenges only`}
    >
      <Card className="border-primary/20 bg-secondary/30">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success">Approved creator</Badge>
          {profile.isAdmin ? <Badge tone="muted">Admin</Badge> : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Aggregate community stats only — no private member health data.
        </p>
      </Card>

      <section aria-labelledby="your-community-heading">
        <h2 id="your-community-heading" className="mb-2 text-base font-semibold">
          Your community
        </h2>
        <Card className="space-y-1">
          {overview.communityName ? (
            <>
              <p className="text-3xl font-semibold tabular-nums">
                {overview.totalFollowers.toLocaleString()} members
              </p>
              <p className="text-sm text-primary">
                +{overview.newFollowersThisMonth} this month
              </p>
              <p className="text-xs text-muted-foreground">
                +{overview.newFollowersThisWeek} this week ·{" "}
                {overview.activeChallengeCount} active challenge
                {overview.activeChallengeCount === 1 ? "" : "s"}
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

      <QuickActionsGrid hasCommunity={Boolean(community)} communitySlug={overview.communitySlug} />

      {overview.growthByWeek.some((w) => w.count > 0) ? (
        <section aria-labelledby="growth-heading">
          <h2 id="growth-heading" className="mb-2 text-base font-semibold">
            Community growth
          </h2>
          <CommunityGrowthChart data={overview.growthByWeek} />
        </section>
      ) : null}

      {overview.recentActivity.length > 0 ? (
        <section aria-labelledby="recent-activity-heading">
          <h2 id="recent-activity-heading" className="mb-2 text-base font-semibold">
            Recent activity
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
          View public community page →
        </Link>
      ) : null}
    </StudioLayout>
  );
}

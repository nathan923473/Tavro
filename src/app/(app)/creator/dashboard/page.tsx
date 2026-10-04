import { CreatorChallengeMessageHub } from "@/components/creator/creator-challenge-message-hub";
import { PostAnnouncementButton } from "@/components/creator/post-announcement-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCommunityBySlug, fetchOwnerCommunity } from "@/lib/data/communities";
import { fetchCreatorDashboardStats } from "@/lib/data/creator-stats";
import { BarChart3, Megaphone, Pencil, PlusCircle, Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Creator dashboard" };

export default async function CreatorDashboardPage() {
  const { user } = await requireApprovedCreator();
  const ownerRow = await fetchOwnerCommunity(user.id);
  const stats = await fetchCreatorDashboardStats(user.id);
  const { community } = ownerRow
    ? await fetchCommunityBySlug(ownerRow.slug, user.id)
    : { community: null };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator dashboard"
        subtitle="Private · no access to user health data"
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-primary/20 bg-secondary/30">
          <Badge className="mb-2">Approved creator</Badge>
          <p className="text-sm text-muted-foreground">
            Manage {community?.communityName ?? "your community"}, challenges, and
            announcements. Participant counts are aggregate only.
          </p>
          {community ? (
            <Link
              href={`/creator/${community.slug}`}
              className="mt-3 inline-block text-sm font-semibold text-primary"
            >
              View public community page →
            </Link>
          ) : (
            <Link
              href="/studio/community"
              className="mt-3 inline-block text-sm font-semibold text-primary"
            >
              Create community page →
            </Link>
          )}
        </Card>

        <ul className="grid grid-cols-2 gap-2">
          <StatCard
            label="Followers"
            value={stats.totalFollowers.toLocaleString()}
            icon={Users}
          />
          <StatCard
            label="Active challenges"
            value={String(stats.activeChallenges)}
            icon={BarChart3}
          />
          <StatCard
            label="Total participants"
            value={stats.totalParticipants.toLocaleString()}
            icon={Users}
          />
          <StatCard
            label="Participation rate"
            value={`${stats.participationRatePercent}%`}
            icon={BarChart3}
          />
        </ul>

        <div className="grid gap-2">
          {community ? (
            <Link
              href={`/creator/${community.slug}/edit`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit community
            </Link>
          ) : (
            <Link
              href="/studio/community"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Create community
            </Link>
          )}
          <Link
            href="/studio/challenges/new"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            Create challenge
          </Link>
          <Link
            href="/creator/analytics"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
            Invite & referral analytics
          </Link>
        </div>

        {community ? (
          <>
            <section aria-labelledby="creator-challenge-chat-heading">
              <h2
                id="creator-challenge-chat-heading"
                className="mb-2 text-base font-semibold"
              >
                Challenge group messages
              </h2>
              <CreatorChallengeMessageHub
                creatorDisplayName={community.creatorDisplayName}
                challenges={community.challenges}
              />
            </section>

            <Card>
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                <div className="flex-1">
                  <h2 className="font-semibold">Community announcement</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {community.announcement ??
                      "Share updates with followers who opt in to notifications."}
                  </p>
                  <div className="mt-3">
                    <PostAnnouncementButton
                      communityId={community.id}
                      defaultText={community.announcement ?? ""}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <Card padding="sm">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

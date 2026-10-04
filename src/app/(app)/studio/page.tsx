import { CreatorChallengeMessageHub } from "@/components/creator/creator-challenge-message-hub";
import { PostAnnouncementButton } from "@/components/creator/post-announcement-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireApprovedCreator } from "@/lib/auth/profile";
import { fetchCommunityBySlug, fetchOwnerCommunity } from "@/lib/data/communities";
import { BarChart3, Pencil, PlusCircle, Users } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Creator Studio" };

export default async function CreatorStudioPage() {
  const { user, profile } = await requireApprovedCreator();
  const ownerRow = await fetchOwnerCommunity(user.id);

  const { community } = ownerRow
    ? await fetchCommunityBySlug(ownerRow.slug, user.id)
    : { community: null };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Creator Studio"
        subtitle={`Hi ${profile.displayName ?? "creator"} · Supabase-backed`}
      />
      <div className="space-y-4 px-4 py-4">
        <Card className="border-primary/20 bg-secondary/30">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Approved creator</Badge>
            {profile.isAdmin ? <Badge tone="muted">Admin</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            You have all member features plus public community tools. Private
            member data is never visible here.
          </p>
        </Card>

        {!community ? (
          <Card className="border-dashed">
            <p className="text-sm text-muted-foreground">
              Set up your public community page first — required before publishing
              challenges.
            </p>
            <Link
              href="/studio/community"
              className="mt-3 inline-block text-sm font-semibold text-primary"
            >
              Create community →
            </Link>
          </Card>
        ) : null}

        <ul className="grid grid-cols-2 gap-2">
          <MiniStat
            icon={Users}
            label="Followers"
            value={community ? String(community.memberCount) : "—"}
          />
          <MiniStat
            icon={PlusCircle}
            label="Active challenges"
            value={
              community
                ? String(
                    community.challenges.filter((c) => c.timeline !== "previous")
                      .length,
                  )
                : "—"
            }
          />
        </ul>

        <div className="grid gap-2">
          {community ? (
            <Link
              href={`/creator/${community.slug}/edit`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit community & branding
            </Link>
          ) : (
            <Link
              href="/studio/community"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Create community page
            </Link>
          )}
          <Link
            href="/studio/challenges/new"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            Create public challenge
          </Link>
          <Link
            href="/studio/challenges"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Challenge photos
          </Link>
          <Link
            href="/creator/analytics"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
            Creator analytics
          </Link>
          {community ? (
            <PostAnnouncementButton
              communityId={community.id}
              defaultText={community.announcement ?? ""}
            />
          ) : null}
        </div>

        {community ? (
          <section aria-labelledby="challenge-groups-heading">
            <h2
              id="challenge-groups-heading"
              className="mb-2 text-base font-semibold"
            >
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
      </div>
    </div>
  );
}

function MiniStat({
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
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </Card>
  );
}

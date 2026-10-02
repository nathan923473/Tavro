import { ChallengeTimelineSection } from "@/components/creator/challenge-timeline-section";
import { CommunityHero } from "@/components/creator/community-hero";
import { CreatorShopSection } from "@/components/creator/creator-shop-section";
import { FollowCommunityButton } from "@/components/creator/follow-community-button";
import {
  demoFollowingSlugs,
  getCreatorCommunityBySlug,
  isDemoCommunityOwner,
} from "@/lib/mock-creators";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type CreatorCommunityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CreatorCommunityPageProps) {
  const { slug } = await params;
  const community = getCreatorCommunityBySlug(slug);
  return {
    title: community?.communityName ?? "Creator community",
  };
}

export default async function CreatorCommunityPage({
  params,
}: CreatorCommunityPageProps) {
  const { slug } = await params;
  const community = getCreatorCommunityBySlug(slug);

  if (!community || !community.isApproved) {
    notFound();
  }

  const isFollowing = demoFollowingSlugs.includes(slug);
  const isOwner = isDemoCommunityOwner(slug);

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/50 bg-background/90 px-3 py-2 backdrop-blur-md">
        <Link
          href="/challenges"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
          aria-label="Back to challenges"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-medium truncate">Creator community</span>
        {isOwner ? (
          <Link href="/creator/dashboard" className="ml-auto text-xs font-semibold text-primary">
            Dashboard
          </Link>
        ) : null}
      </div>

      <CommunityHero
        community={community}
        showEditLink={isOwner}
        action={
          <FollowCommunityButton
            communityName={community.communityName}
            initiallyFollowing={isFollowing}
          />
        }
      />

      <div className="mt-6 space-y-6">
        <ChallengeTimelineSection
          title="Current challenges"
          timeline="current"
          challenges={community.challenges}
        />
        <ChallengeTimelineSection
          title="Upcoming challenges"
          timeline="upcoming"
          challenges={community.challenges}
        />
        <ChallengeTimelineSection
          title="Previous challenges"
          timeline="previous"
          challenges={community.challenges}
        />
        <CreatorShopSection community={community} />
      </div>

      <div className="mt-6 px-4">
        <Link
          href={`/join/${community.challenges.find((c) => c.timeline === "current")?.inviteSlug ?? "gentle-reset-riley"}`}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
        >
          Join a free challenge
        </Link>
      </div>
    </div>
  );
}

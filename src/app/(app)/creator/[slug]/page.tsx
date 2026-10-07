import { ChallengeTimelineSection } from "@/components/creator/challenge-timeline-section";
import { CommunityHero } from "@/components/creator/community-hero";
import { CreatorLinksSection } from "@/components/creator/creator-links-section";
import { CreatorShopSection } from "@/components/creator/creator-shop-section";
import { fetchCreatorLinks } from "@/lib/data/creator-studio";
import { FollowCommunityButton } from "@/components/creator/follow-community-button";
import { BackButton } from "@/components/layout/back-button";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { fetchCommunityBySlug } from "@/lib/data/communities";
import Link from "next/link";
import { notFound } from "next/navigation";

type CreatorCommunityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CreatorCommunityPageProps) {
  const { slug } = await params;
  const { community } = await fetchCommunityBySlug(slug, null);
  return {
    title: community?.communityName ?? "Creator community",
  };
}

export default async function CreatorCommunityPage({
  params,
}: CreatorCommunityPageProps) {
  const { slug } = await params;
  const { user } = await getCurrentUserProfile();
  const { community, isFollowing, isOwner } = await fetchCommunityBySlug(
    slug,
    user?.id ?? null,
  );

  if (!community) {
    notFound();
  }

  const creatorLinks = await fetchCreatorLinks(community.id);

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-40 space-y-2 border-b border-border/50 bg-background/90 px-3 py-3 backdrop-blur-md">
        <BackButton fallbackHref="/challenges" />
        <div className="flex items-center gap-2 px-1">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            Creator community
          </span>
          {isOwner ? (
            <Link
              href="/studio"
              className="shrink-0 text-xs font-semibold text-primary"
            >
              Studio
            </Link>
          ) : null}
        </div>
      </div>

      <CommunityHero
        community={community}
        viewerUserId={user?.id ?? null}
        showEditLink={isOwner}
        action={
          <FollowCommunityButton
            communityId={community.id}
            initialFollowing={isFollowing}
            loggedIn={Boolean(user)}
          />
        }
      />

      <CreatorShopSection community={community} />
      <CreatorLinksSection links={creatorLinks} />

      <ChallengeTimelineSection
        title="Current & upcoming"
        timeline="current"
        challenges={community.challenges}
        creatorUserId={community.ownerUserId}
        creatorDisplayName={community.creatorDisplayName}
        creatorAvatarUrl={community.avatarUrl}
        viewerUserId={user?.id ?? null}
      />
      <ChallengeTimelineSection
        title="Upcoming"
        timeline="upcoming"
        challenges={community.challenges}
        creatorUserId={community.ownerUserId}
        creatorDisplayName={community.creatorDisplayName}
        creatorAvatarUrl={community.avatarUrl}
        viewerUserId={user?.id ?? null}
      />
      <ChallengeTimelineSection
        title="Past challenges"
        timeline="previous"
        challenges={community.challenges}
        creatorUserId={community.ownerUserId}
        creatorDisplayName={community.creatorDisplayName}
        creatorAvatarUrl={community.avatarUrl}
        viewerUserId={user?.id ?? null}
      />
    </div>
  );
}

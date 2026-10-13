import { fetchChallengeGalleryDetailsMap } from "@/lib/data/challenge-media";
import { resolveCreatorAvatarUrl } from "@/lib/creator-avatar";
import { CHALLENGE_PARTICIPANTS_EMBED, unwrapOne } from "@/lib/data/relations";
import { publicChallengePath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { Challenge } from "@/types";

/** Server-safe canonical URL for a challenge landing page. */
export function landingCanonicalPath(data: {
  communitySlug: string | null;
  challenge: { inviteSlug: string };
}) {
  if (data.communitySlug) {
    return publicChallengePath(data.communitySlug, data.challenge.inviteSlug);
  }
  return `/join/${data.challenge.inviteSlug}`;
}

export type ChallengeLandingData = {
  challenge: Challenge;
  communityId: string | null;
  communitySlug: string | null;
  communityName: string | null;
  creatorBio: string | null;
  brandColor: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  shortDescription: string | null;
  goalDescription: string | null;
  category: string | null;
  joined: boolean;
  onboardingCompleted: boolean;
  isOwner: boolean;
  isApprovedPublic: boolean;
  isLandingVisible: boolean;
};

export async function fetchChallengeLandingByInviteSlug(
  inviteSlug: string,
  userId: string | null,
): Promise<ChallengeLandingData | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("challenges")
    .select(
      `
      id, title, description, short_description, goal_description, category,
      start_date, end_date, start_at, end_at, challenge_timezone,
      invite_slug, focus_areas, cover_url, created_by,
      visibility, publish_status, community_id,
      creator:profiles!challenges_created_by_fkey ( display_name, creator_status, avatar_url ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count ),
      community:creator_communities (
        slug, community_name, bio, brand_color, avatar_url, banner_url, owner_id
      )
    `,
    )
    .eq("invite_slug", inviteSlug)
    .maybeSingle();

  if (!row) return null;

  const community = unwrapOne(row.community);
  const creator = unwrapOne(row.creator);
  const published =
    row.publish_status === "published" ||
    row.publish_status === "scheduled" ||
    row.publish_status == null;
  const isPublicCreatorChallenge =
    row.visibility === "public" && published && Boolean(row.community_id);
  const creatorApproved = creator?.creator_status === "approved";
  /** Shown on landing — public creator challenges only (private member challenges removed). */
  const isLandingVisible =
    published && isPublicCreatorChallenge && creatorApproved;
  /** Eligible for public discover search/lists. */
  const isApprovedPublic = isPublicCreatorChallenge && creatorApproved;

  const isOwner =
    Boolean(userId) &&
    (userId === row.created_by ||
      (community?.owner_id != null && userId === community.owner_id));

  let joined = false;
  let onboardingCompleted = false;
  if (userId) {
    let membership: {
      progress_percent?: number | null;
      onboarding_completed_at?: string | null;
    } | null = null;
    const membershipFull = await supabase
      .from("challenge_participants")
      .select("progress_percent, onboarding_completed_at")
      .eq("challenge_id", row.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (
      membershipFull.error &&
      /progress_percent|onboarding_completed_at|schema cache/i.test(membershipFull.error.message)
    ) {
      const legacy = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("challenge_id", row.id)
        .eq("user_id", userId)
        .maybeSingle();
      membership = legacy.data ? { onboarding_completed_at: null } : null;
    } else if (!membershipFull.error) {
      membership = membershipFull.data;
    }
    joined = Boolean(membership) || isOwner;
    onboardingCompleted =
      isOwner || Boolean(membership?.onboarding_completed_at);
  }

  const galleryMap = await fetchChallengeGalleryDetailsMap([row.id]);
  const galleryItems = galleryMap[row.id] ?? [];

  const challenge: Challenge = {
    id: row.id,
    title: row.title,
    creatorName: creator?.display_name ?? "Creator",
    creatorId: row.created_by,
    creatorAvatarUrl: resolveCreatorAvatarUrl(
      community?.avatar_url ?? null,
      creator?.avatar_url ?? null,
    ),
    description: row.description ?? "",
    startDate: row.start_date,
    endDate: row.end_date,
    startAt: row.start_at ?? null,
    endAt: row.end_at ?? null,
    challengeTimezone: row.challenge_timezone ?? null,
    participants: row.participants?.[0]?.count ?? 0,
    joined,
    progressPercent: 0,
    inviteSlug: row.invite_slug,
    focusAreas: row.focus_areas ?? [],
    coverUrl: row.cover_url ?? null,
    galleryPhotos: galleryItems.map((p) => p.imageUrl),
    galleryPhotoItems: galleryItems,
  };

  return {
    challenge,
    communityId: row.community_id ?? null,
    communitySlug: community?.slug ?? null,
    communityName: community?.community_name ?? null,
    creatorBio: community?.bio ?? null,
    brandColor: community?.brand_color ?? "#3156E8",
    avatarUrl: resolveCreatorAvatarUrl(community?.avatar_url ?? null, creator?.avatar_url ?? null),
    bannerUrl: community?.banner_url ?? null,
    shortDescription: row.short_description ?? null,
    goalDescription: row.goal_description ?? null,
    category: row.category ?? null,
    joined,
    onboardingCompleted,
    isOwner,
    isApprovedPublic,
    isLandingVisible,
  };
}

export async function fetchChallengeLandingByCommunityAndSlug(
  communitySlug: string,
  inviteSlug: string,
  userId: string | null,
): Promise<ChallengeLandingData | null> {
  const base = await fetchChallengeLandingByInviteSlug(inviteSlug, userId);
  if (!base?.communitySlug || base.communitySlug !== communitySlug) {
    if (base && !base.communitySlug) return null;
    if (base?.communitySlug !== communitySlug) return null;
  }
  return base;
}

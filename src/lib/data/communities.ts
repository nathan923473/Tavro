import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/data/relations";
import type { CreatorCommunity, CreatorCommunityChallenge } from "@/types/creator-community";

function challengeTimeline(
  start: string,
  end: string,
): "current" | "upcoming" | "previous" {
  const today = new Date().toISOString().slice(0, 10);
  if (end < today) return "previous";
  if (start > today) return "upcoming";
  return "current";
}

export async function fetchCommunityBySlug(
  slug: string,
  userId: string | null,
): Promise<{
  community: CreatorCommunity | null;
  isFollowing: boolean;
  isOwner: boolean;
}> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("creator_communities")
    .select(
      `
      id, owner_id, slug, community_name, bio, brand_color, banner_url,
      avatar_url, shop_url, shop_label, affiliate_disclosure, announcement,
      member_count_cache, social_links,
      owner:profiles!creator_communities_owner_id_fkey ( display_name )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!row) {
    return { community: null, isFollowing: false, isOwner: false };
  }

  const { data: challenges } = await supabase
    .from("challenges")
    .select(
      `
      id, title, description, start_date, end_date, invite_slug,
      participants:challenge_participants ( count )
    `,
    )
    .eq("community_id", row.id)
    .eq("visibility", "public")
    .order("start_date", { ascending: false });

  const mappedChallenges: CreatorCommunityChallenge[] = (challenges ?? []).map(
    (c) => ({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      startDate: c.start_date,
      endDate: c.end_date,
      participants: c.participants?.[0]?.count ?? 0,
      inviteSlug: c.invite_slug,
      timeline: challengeTimeline(c.start_date, c.end_date),
      coverGradient: `linear-gradient(145deg, ${row.brand_color ?? "#3d8b6e"}, #2f6f58)`,
    }),
  );

  let isFollowing = false;
  if (userId) {
    const { data: follow } = await supabase
      .from("community_follows")
      .select("user_id")
      .eq("user_id", userId)
      .eq("community_id", row.id)
      .maybeSingle();
    isFollowing = Boolean(follow);
  }

  const ownerName = unwrapOne(row.owner)?.display_name ?? "Creator";
  const initials = ownerName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const community: CreatorCommunity = {
    id: row.id,
    slug: row.slug,
    communityName: row.community_name,
    creatorDisplayName: ownerName,
    bio: row.bio ?? "",
    memberCount: row.member_count_cache ?? 0,
    challengesHosted: mappedChallenges.length,
    brandColor: row.brand_color ?? "#3d8b6e",
    avatarInitials: initials,
    bannerGradient: `linear-gradient(135deg, ${row.brand_color ?? "#3d8b6e"} 0%, #2f6f58 100%)`,
    isApproved: true,
    ownerUserId: row.owner_id,
    socialLinks: (row.social_links as CreatorCommunity["socialLinks"]) ?? [],
    shopUrl: row.shop_url ?? undefined,
    shopLabel: row.shop_label ?? undefined,
    affiliateDisclosure: row.affiliate_disclosure ?? undefined,
    announcement: row.announcement ?? undefined,
    challenges: mappedChallenges,
  };

  return {
    community,
    isFollowing,
    isOwner: userId === row.owner_id,
  };
}

export async function fetchCommunitiesList(): Promise<
  Array<{
    id: string;
    slug: string;
    communityName: string;
    brandColor: string;
    avatarInitials: string;
    memberCount: number;
    challengesHosted: number;
  }>
> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("creator_communities")
    .select(
      `
      id, slug, community_name, brand_color, member_count_cache,
      owner:profiles!creator_communities_owner_id_fkey ( display_name )
    `,
    )
    .order("community_name");

  if (!rows) return [];

  const result = [];
  for (const row of rows) {
    const { count } = await supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("community_id", row.id)
      .eq("visibility", "public");

    const ownerName = unwrapOne(row.owner)?.display_name ?? "Creator";
    const initials = ownerName
      .split(/\s+/)
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    result.push({
      id: row.id,
      slug: row.slug,
      communityName: row.community_name,
      brandColor: row.brand_color ?? "#3d8b6e",
      avatarInitials: initials,
      memberCount: row.member_count_cache ?? 0,
      challengesHosted: count ?? 0,
    });
  }
  return result;
}

export async function fetchOwnerCommunity(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_communities")
    .select("id, slug, community_name, announcement, owner_id")
    .eq("owner_id", userId)
    .maybeSingle();
  return data;
}

export async function fetchFollowedCommunities(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_follows")
    .select(
      `
      community_id,
      community:creator_communities (
        id, slug, community_name, bio, brand_color, member_count_cache,
        owner:profiles!creator_communities_owner_id_fkey ( display_name )
      )
    `,
    )
    .eq("user_id", userId);

  return (data ?? [])
    .map((row) => unwrapOne(row.community))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
}

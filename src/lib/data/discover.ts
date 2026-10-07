import { fetchChallengeGalleryMap } from "@/lib/data/challenge-media";
import { unwrapOne } from "@/lib/data/relations";
import { createClient } from "@/lib/supabase/server";
import { resolveCreatorAvatarUrl } from "@/lib/creator-avatar";
import { challengeTimeline } from "@/lib/data/communities";
import { challengePhaseFromInstants } from "@/lib/timezone/challenge-calendar";

export type DiscoverChallenge = {
  id: string;
  title: string;
  shortDescription: string | null;
  inviteSlug: string;
  communitySlug: string;
  communityName: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  createdById: string;
  startDate: string;
  endDate: string;
  startAt: string | null;
  endAt: string | null;
  challengeTimezone: string | null;
  participants: number;
  coverUrl: string | null;
  timeline: "current" | "upcoming" | "previous";
};

function timelineForChallenge(row: {
  start_date: string;
  end_date: string;
  start_at?: string | null;
  end_at?: string | null;
  challenge_timezone?: string | null;
}): DiscoverChallenge["timeline"] {
  if (row.start_at && row.end_at) {
    const phase = challengePhaseFromInstants(
      new Date(row.start_at),
      new Date(row.end_at),
    );
    if (phase === "upcoming") return "upcoming";
    if (phase === "completed") return "previous";
    return "current";
  }
  return challengeTimeline(row.start_date, row.end_date);
}

export type DiscoverCreator = {
  id: string;
  slug: string;
  communityName: string;
  bio: string | null;
  avatarUrl: string | null;
  memberCount: number;
  ownerName: string;
  featuredChallengeTitle: string | null;
};

export async function searchDiscover(query: string): Promise<{
  challenges: DiscoverChallenge[];
  creators: DiscoverCreator[];
}> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return { challenges: [], creators: [] };

  const ilike = `%${q.replace(/[%_]/g, "")}%`;

  const { data: communities } = await supabase
    .from("creator_communities")
    .select(
      `
      id, slug, community_name, bio, avatar_url, member_count_cache,
      owner:profiles!creator_communities_owner_id_fkey ( display_name, creator_status, avatar_url )
    `,
    )
    .ilike("community_name", ilike)
    .limit(20);

  const creators: DiscoverCreator[] = (communities ?? [])
    .filter((c) => unwrapOne(c.owner)?.creator_status === "approved")
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      communityName: c.community_name,
      bio: c.bio,
      avatarUrl: resolveCreatorAvatarUrl(
        c.avatar_url,
        unwrapOne(c.owner)?.avatar_url ?? null,
      ),
      memberCount: c.member_count_cache ?? 0,
      ownerName: unwrapOne(c.owner)?.display_name ?? c.community_name,
      featuredChallengeTitle: null,
    }));

  const { data: challengeRows } = await supabase
    .from("challenges")
    .select(
      `
      id, title, short_description, invite_slug, start_date, end_date,
      start_at, end_at, challenge_timezone, cover_url, created_by,
      community:creator_communities ( slug, community_name, avatar_url ),
      creator:profiles!challenges_created_by_fkey ( display_name, creator_status, avatar_url ),
      participants:challenge_participants ( count )
    `,
    )
    .eq("visibility", "public")
    .in("publish_status", ["published", "scheduled"])
    .ilike("title", ilike)
    .limit(30);

  const ids = (challengeRows ?? []).map((r) => r.id);
  const galleryMap = await fetchChallengeGalleryMap(ids);

  const challenges: DiscoverChallenge[] = (challengeRows ?? [])
    .filter((r) => unwrapOne(r.creator)?.creator_status === "approved")
    .map((r) => {
      const community = unwrapOne(r.community);
      return {
        id: r.id,
        title: r.title,
        shortDescription: r.short_description,
        inviteSlug: r.invite_slug,
        communitySlug: community?.slug ?? "",
        communityName: community?.community_name ?? "",
        creatorName: unwrapOne(r.creator)?.display_name ?? "Creator",
        creatorAvatarUrl: resolveCreatorAvatarUrl(
          community?.avatar_url ?? null,
          unwrapOne(r.creator)?.avatar_url ?? null,
        ),
        createdById: r.created_by,
        startDate: r.start_date,
        endDate: r.end_date,
        startAt: r.start_at ?? null,
        endAt: r.end_at ?? null,
        challengeTimezone: r.challenge_timezone ?? null,
        participants: r.participants?.[0]?.count ?? 0,
        coverUrl: r.cover_url ?? galleryMap[r.id]?.[0] ?? null,
        timeline: timelineForChallenge(r),
      };
    })
    .filter((c) => c.communitySlug);

  return { challenges, creators };
}

export async function fetchDiscoverSections(): Promise<{
  active: DiscoverChallenge[];
  upcoming: DiscoverChallenge[];
  featured: DiscoverChallenge[];
  creators: DiscoverCreator[];
}> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("challenges")
    .select(
      `
      id, title, short_description, invite_slug, start_date, end_date,
      start_at, end_at, challenge_timezone, cover_url, created_by,
      community:creator_communities ( slug, community_name, avatar_url ),
      creator:profiles!challenges_created_by_fkey ( display_name, creator_status, avatar_url ),
      participants:challenge_participants ( count )
    `,
    )
    .eq("visibility", "public")
    .eq("publish_status", "published")
    .order("start_date", { ascending: true })
    .limit(40);

  const ids = (rows ?? []).map((r) => r.id);
  const galleryMap = await fetchChallengeGalleryMap(ids);

  const all: DiscoverChallenge[] = (rows ?? [])
    .filter((r) => unwrapOne(r.creator)?.creator_status === "approved")
    .map((r) => {
      const community = unwrapOne(r.community);
      return {
        id: r.id,
        title: r.title,
        shortDescription: r.short_description,
        inviteSlug: r.invite_slug,
        communitySlug: community?.slug ?? "",
        communityName: community?.community_name ?? "",
        creatorName: unwrapOne(r.creator)?.display_name ?? "Creator",
        creatorAvatarUrl: resolveCreatorAvatarUrl(
          community?.avatar_url ?? null,
          unwrapOne(r.creator)?.avatar_url ?? null,
        ),
        createdById: r.created_by,
        startDate: r.start_date,
        endDate: r.end_date,
        startAt: r.start_at ?? null,
        endAt: r.end_at ?? null,
        challengeTimezone: r.challenge_timezone ?? null,
        participants: r.participants?.[0]?.count ?? 0,
        coverUrl: r.cover_url ?? galleryMap[r.id]?.[0] ?? null,
        timeline: timelineForChallenge(r),
      };
    })
    .filter((c) => c.communitySlug);

  const active = all.filter((c) => c.timeline === "current");
  const upcoming = all.filter((c) => c.timeline === "upcoming");
  const featured = [...active, ...upcoming].slice(0, 6);

  const { data: communityRows } = await supabase
    .from("creator_communities")
    .select(
      `
      id, slug, community_name, bio, avatar_url, member_count_cache,
      owner:profiles!creator_communities_owner_id_fkey ( display_name, creator_status, avatar_url )
    `,
    )
    .order("member_count_cache", { ascending: false })
    .limit(12);

  const creators: DiscoverCreator[] = (communityRows ?? [])
    .filter((c) => unwrapOne(c.owner)?.creator_status === "approved")
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      communityName: c.community_name,
      bio: c.bio,
      avatarUrl: resolveCreatorAvatarUrl(
        c.avatar_url,
        unwrapOne(c.owner)?.avatar_url ?? null,
      ),
      memberCount: c.member_count_cache ?? 0,
      ownerName: unwrapOne(c.owner)?.display_name ?? c.community_name,
      featuredChallengeTitle: null,
    }));

  return { active, upcoming, featured, creators };
}

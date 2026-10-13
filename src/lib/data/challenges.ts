import { createClient } from "@/lib/supabase/server";
import {
  fetchChallengeGalleryDetailsMap,
  fetchChallengeGalleryMap,
} from "@/lib/data/challenge-media";
import { resolveCreatorAvatarUrl } from "@/lib/creator-avatar";
import { CHALLENGE_PARTICIPANTS_EMBED, unwrapOne } from "@/lib/data/relations";
import type { Challenge } from "@/types";

type ChallengeRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_at?: string | null;
  end_at?: string | null;
  challenge_timezone?: string | null;
  invite_slug: string;
  focus_areas?: string[] | null;
  cover_url: string | null;
  created_by: string;
  visibility: string;
  creator?:
    | { display_name: string | null; avatar_url?: string | null }
    | { display_name: string | null; avatar_url?: string | null }[]
    | null;
  community?:
    | { avatar_url: string | null }
    | { avatar_url: string | null }[]
    | null;
  participants?: { count: number }[] | null;
};

function mapChallenge(
  row: ChallengeRow,
  userId: string | null,
  joinedIds: Set<string>,
  progress: Record<string, number>,
  gallery: string[] = [],
): Challenge {
  const count = row.participants?.[0]?.count ?? 0;
  const isOwner = Boolean(userId && userId === row.created_by);
  const joined = userId ? isOwner || joinedIds.has(row.id) : false;
  return {
    id: row.id,
    title: row.title,
    creatorName: unwrapOne(row.creator)?.display_name ?? "Member",
    creatorId: row.created_by,
    creatorAvatarUrl: resolveCreatorAvatarUrl(
      unwrapOne(row.community)?.avatar_url ?? null,
      unwrapOne(row.creator)?.avatar_url ?? null,
    ),
    description: row.description ?? "",
    startDate: row.start_date,
    endDate: row.end_date,
    startAt: row.start_at ?? null,
    endAt: row.end_at ?? null,
    challengeTimezone: row.challenge_timezone ?? null,
    participants: count,
    joined,
    progressPercent: joined ? (progress[row.id] ?? 0) : 0,
    inviteSlug: row.invite_slug,
    focusAreas: row.focus_areas ?? [],
    coverUrl: row.cover_url ?? null,
    galleryPhotos: gallery,
  };
}

export async function fetchChallengesForUser(userId: string | null): Promise<{
  mine: Challenge[];
  discover: Challenge[];
}> {
  const supabase = await createClient();

  const selectFull = `
      id, title, description, start_date, end_date, start_at, end_at, challenge_timezone,
      invite_slug, focus_areas,
      cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name, avatar_url ),
      community:creator_communities ( avatar_url ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
    `;
  const selectLegacy = `
      id, title, description, start_date, end_date, invite_slug,
      cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name, avatar_url ),
      community:creator_communities ( avatar_url ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
    `;

  let rows: ChallengeRow[] | null = null;
  let error: { message: string } | null = null;

  const full = await supabase
    .from("challenges")
    .select(selectFull)
    .order("start_date", { ascending: false });
  rows = (full.data ?? null) as ChallengeRow[] | null;
  error = full.error;

  if (error && /focus_areas|schema cache/i.test(error.message)) {
    const legacy = await supabase
      .from("challenges")
      .select(selectLegacy)
      .order("start_date", { ascending: false });
    rows = (legacy.data ?? null) as ChallengeRow[] | null;
    error = legacy.error;
  }

  if (error || !rows) {
    if (error) console.error("fetchChallengesForUser:", error.message);
    return { mine: [], discover: [] };
  }

  const publicRows = rows.filter((r) => r.visibility === "public");

  let joinedIds = new Set<string>();
  const progress: Record<string, number> = {};

  if (userId) {
    const { data: memberships } = await supabase
      .from("challenge_participants")
      .select("challenge_id, progress_percent")
      .eq("user_id", userId);
    for (const m of memberships ?? []) {
      joinedIds.add(m.challenge_id);
      progress[m.challenge_id] = m.progress_percent ?? 0;
    }
  }

  const galleryMap = await fetchChallengeGalleryMap(publicRows.map((r) => r.id));

  const all = publicRows.map((r) =>
    mapChallenge(
      r as ChallengeRow,
      userId,
      joinedIds,
      progress,
      galleryMap[r.id] ?? [],
    ),
  );

  return {
    mine: all.filter((c) => c.joined),
    discover: all.filter((c) => !c.joined),
  };
}

/** Joined challenges only — for Home (avoids loading every challenge + gallery). */
export async function fetchJoinedChallengesForHome(
  userId: string,
): Promise<Challenge[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("challenge_participants")
    .select("challenge_id, progress_percent")
    .eq("user_id", userId);

  const progress: Record<string, number> = {};
  const joinedIds = new Set<string>();
  for (const m of memberships ?? []) {
    joinedIds.add(m.challenge_id);
    progress[m.challenge_id] = m.progress_percent ?? 0;
  }

  const { data: ownedRows } = await supabase
    .from("challenges")
    .select("id")
    .eq("created_by", userId);

  for (const row of ownedRows ?? []) {
    joinedIds.add(row.id);
  }

  if (!joinedIds.size) return [];

  const ids = [...joinedIds];
  const select = `
      id, title, description, start_date, end_date, start_at, end_at, challenge_timezone,
      invite_slug, cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name, avatar_url ),
      community:creator_communities ( avatar_url ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
    `;

  const { data: rows, error } = await supabase
    .from("challenges")
    .select(select)
    .in("id", ids)
    .eq("visibility", "public")
    .order("start_date", { ascending: false });

  if (error || !rows) {
    if (error) console.error("fetchJoinedChallengesForHome:", error.message);
    return [];
  }

  return rows.map((r) =>
    mapChallenge(
      { ...(r as ChallengeRow), focus_areas: [] },
      userId,
      joinedIds,
      progress,
      [],
    ),
  );
}

export async function fetchChallengeByInviteSlug(
  slug: string,
  userId: string | null,
): Promise<Challenge | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("challenges")
    .select(
      `
      id, title, description, start_date, end_date, start_at, end_at, challenge_timezone,
      invite_slug, focus_areas,
      cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
    `,
    )
    .eq("invite_slug", slug)
    .maybeSingle();

  if (!row || row.visibility !== "public") return null;

  let joinedIds = new Set<string>();
  const progress: Record<string, number> = {};
  if (userId) {
    const { data: membership } = await supabase
      .from("challenge_participants")
      .select("challenge_id, progress_percent")
      .eq("user_id", userId)
      .eq("challenge_id", row.id)
      .maybeSingle();
    if (membership) {
      joinedIds.add(row.id);
      progress[row.id] = membership.progress_percent ?? 0;
    } else if (userId === row.created_by) {
      joinedIds.add(row.id);
    }
  }

  const galleryDetailsMap = await fetchChallengeGalleryDetailsMap([row.id]);
  const galleryItems = galleryDetailsMap[row.id] ?? [];
  const challenge = mapChallenge(
    row as unknown as ChallengeRow,
    userId,
    joinedIds,
    progress,
    galleryItems.map((p) => p.imageUrl),
  );
  challenge.galleryPhotoItems = galleryItems;
  return challenge;
}

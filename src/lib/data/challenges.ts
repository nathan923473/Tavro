import { createClient } from "@/lib/supabase/server";
import { fetchChallengeGalleryMap } from "@/lib/data/challenge-media";
import { unwrapOne } from "@/lib/data/relations";
import type { Challenge } from "@/types";

type ChallengeRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  invite_slug: string;
  focus_areas?: string[] | null;
  cover_url: string | null;
  created_by: string;
  visibility: string;
  creator?: { display_name: string | null } | { display_name: string | null }[] | null;
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
  const joined = userId ? joinedIds.has(row.id) : false;
  return {
    id: row.id,
    title: row.title,
    creatorName: unwrapOne(row.creator)?.display_name ?? "Member",
    creatorId: row.created_by,
    description: row.description ?? "",
    startDate: row.start_date,
    endDate: row.end_date,
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
      id, title, description, start_date, end_date, invite_slug, focus_areas,
      cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      participants:challenge_participants ( count )
    `;
  const selectLegacy = `
      id, title, description, start_date, end_date, invite_slug,
      cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      participants:challenge_participants ( count )
    `;

  let { data: rows, error } = await supabase
    .from("challenges")
    .select(selectFull)
    .order("start_date", { ascending: false });

  if (error && /focus_areas|schema cache/i.test(error.message)) {
    ({ data: rows, error } = await supabase
      .from("challenges")
      .select(selectLegacy)
      .order("start_date", { ascending: false }));
  }

  if (error || !rows) {
    if (error) console.error("fetchChallengesForUser:", error.message);
    return { mine: [], discover: [] };
  }

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

  const galleryMap = await fetchChallengeGalleryMap(rows.map((r) => r.id));

  const all = rows.map((r) =>
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

export async function fetchChallengeByInviteSlug(
  slug: string,
  userId: string | null,
): Promise<Challenge | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("challenges")
    .select(
      `
      id, title, description, start_date, end_date, invite_slug, focus_areas,
      cover_url, created_by, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      participants:challenge_participants ( count )
    `,
    )
    .eq("invite_slug", slug)
    .maybeSingle();

  if (!row) return null;

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
    }
  }

  const galleryMap = await fetchChallengeGalleryMap([row.id]);
  return mapChallenge(
    row as unknown as ChallengeRow,
    userId,
    joinedIds,
    progress,
    galleryMap[row.id] ?? [],
  );
}

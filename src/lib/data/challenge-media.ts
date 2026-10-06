import { createClient } from "@/lib/supabase/server";

export async function fetchChallengeGallery(challengeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_photos")
    .select("image_url")
    .eq("challenge_id", challengeId)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => row.image_url);
}

export async function fetchChallengeGalleryMap(
  challengeIds: string[],
): Promise<Record<string, string[]>> {
  const detailed = await fetchChallengeGalleryDetailsMap(challengeIds);
  const map: Record<string, string[]> = {};
  for (const [id, items] of Object.entries(detailed)) {
    map[id] = items.map((p) => p.imageUrl);
  }
  return map;
}

export async function fetchChallengeGalleryDetailsMap(
  challengeIds: string[],
): Promise<Record<string, { id: string; imageUrl: string }[]>> {
  if (!challengeIds.length) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_photos")
    .select("id, challenge_id, image_url, sort_order")
    .in("challenge_id", challengeIds)
    .order("sort_order", { ascending: true });

  const map: Record<string, { id: string; imageUrl: string }[]> = {};
  for (const row of data ?? []) {
    if (!map[row.challenge_id]) map[row.challenge_id] = [];
    map[row.challenge_id].push({ id: row.id, imageUrl: row.image_url });
  }
  return map;
}

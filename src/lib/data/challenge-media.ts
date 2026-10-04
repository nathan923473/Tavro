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
  if (!challengeIds.length) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_photos")
    .select("challenge_id, image_url, sort_order")
    .in("challenge_id", challengeIds)
    .order("sort_order", { ascending: true });

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    if (!map[row.challenge_id]) map[row.challenge_id] = [];
    map[row.challenge_id].push(row.image_url);
  }
  return map;
}

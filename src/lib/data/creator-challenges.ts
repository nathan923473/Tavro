import { createClient } from "@/lib/supabase/server";

export type CreatorChallengeRow = {
  id: string;
  title: string;
  invite_slug: string;
  visibility: string;
  cover_url: string | null;
};

export async function fetchCreatorChallenges(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("id, title, invite_slug, visibility, cover_url")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CreatorChallengeRow[];
}

export async function fetchCreatorChallengeForPhotos(
  userId: string,
  challengeId: string,
) {
  const supabase = await createClient();
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, title, cover_url, invite_slug, created_by")
    .eq("id", challengeId)
    .eq("created_by", userId)
    .maybeSingle();

  if (!challenge) return null;

  const { data: photos } = await supabase
    .from("challenge_photos")
    .select("id, image_url, sort_order")
    .eq("challenge_id", challengeId)
    .order("sort_order", { ascending: true });

  return {
    challenge,
    photos: photos ?? [],
  };
}

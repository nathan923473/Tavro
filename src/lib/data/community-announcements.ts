import { createClient } from "@/lib/supabase/server";

export type FollowerAnnouncement = {
  id: string;
  communityId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishAt: string;
  createdBy: string;
};

export async function fetchAnnouncementsForFollower(
  userId: string,
  limit = 20,
): Promise<FollowerAnnouncement[]> {
  const supabase = await createClient();
  const { data: follows } = await supabase
    .from("community_follows")
    .select("community_id")
    .eq("user_id", userId);

  const communityIds = (follows ?? []).map((f) => f.community_id);
  if (!communityIds.length) return [];

  const { data, error } = await supabase
    .from("creator_announcements")
    .select("id, community_id, title, body, image_url, publish_at, created_by")
    .in("community_id", communityIds)
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/creator_announcements|schema cache/i.test(error.message)) return [];
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    publishAt: row.publish_at,
    createdBy: row.created_by,
  }));
}

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function fetchNotificationsForUser(userId: string): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_notifications")
    .select("id, kind, title, body, link_path, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (/app_notifications|schema cache/i.test(error.message)) return [];
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from("app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function enqueueNotification(input: {
  userId: string;
  kind: string;
  title: string;
  body: string;
  linkPath?: string;
}) {
  const admin = createAdminClient();
  const client = admin ?? (await createClient());
  const { error } = await client.from("app_notifications").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    link_path: input.linkPath ?? null,
  });
  if (error && !/app_notifications|schema cache/i.test(error.message)) {
    console.error("enqueueNotification", error.message);
  }
}

export async function notifyFollowersAnnouncement(
  communityId: string,
  communityName: string,
  title: string,
  linkPath: string,
) {
  const admin = createAdminClient();
  if (!admin) return;
  const { data: follows } = await admin
    .from("community_follows")
    .select("user_id")
    .eq("community_id", communityId);

  for (const f of follows ?? []) {
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("creator_announcements")
      .eq("user_id", f.user_id)
      .maybeSingle();
    if (prefs && prefs.creator_announcements === false) continue;
    await enqueueNotification({
      userId: f.user_id,
      kind: "announcement",
      title: `${communityName} posted an announcement`,
      body: title,
      linkPath,
    });
  }
}

export async function notifyFollowersNewChallenge(
  communityId: string,
  challengeTitle: string,
  linkPath: string,
) {
  const admin = createAdminClient();
  if (!admin) return;
  const { data: follows } = await admin
    .from("community_follows")
    .select("user_id, notify_new_challenges")
    .eq("community_id", communityId);

  for (const f of follows ?? []) {
    if (f.notify_new_challenges === false) continue;
    await enqueueNotification({
      userId: f.user_id,
      kind: "new_challenge",
      title: "New challenge from a creator you follow",
      body: challengeTitle,
      linkPath,
    });
  }
}

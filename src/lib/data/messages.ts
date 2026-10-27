import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/data/relations";
import type { ChallengeChatMessage } from "@/lib/challenge-chat";

/** One query for all joined challenge cards (avoids N+1 on /challenges). */
export async function fetchChallengeMessagesForChallenges(
  challengeIds: string[],
): Promise<Record<string, ChallengeChatMessage[]>> {
  const out: Record<string, ChallengeChatMessage[]> = {};
  if (!challengeIds.length) return out;

  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_messages")
    .select(
      `
      id, body, author_role, created_at, author_id, challenge_id,
      author:profiles!challenge_messages_author_id_fkey ( display_name )
    `,
    )
    .in("challenge_id", challengeIds)
    .order("created_at", { ascending: true })
    .limit(500);

  for (const row of data ?? []) {
    const cid = row.challenge_id as string;
    if (!out[cid]) out[cid] = [];
    const list = out[cid];
    if (list.length >= 100) continue;
    list.push({
      id: row.id,
      authorId: row.author_id,
      authorName: unwrapOne(row.author)?.display_name ?? "Member",
      role: row.author_role as "creator" | "member",
      text: row.body,
      createdAt: row.created_at,
    });
  }

  return out;
}

export async function fetchChallengeMessages(
  challengeId: string,
): Promise<ChallengeChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_messages")
    .select(
      `
      id, body, author_role, created_at, author_id,
      author:profiles!challenge_messages_author_id_fkey ( display_name )
    `,
    )
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id,
    authorId: row.author_id,
    authorName: unwrapOne(row.author)?.display_name ?? "Member",
    role: row.author_role as "creator" | "member",
    text: row.body,
    createdAt: row.created_at,
  }));
}

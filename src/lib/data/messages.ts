import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/data/relations";
import type { ChallengeChatMessage } from "@/lib/challenge-chat";

export async function fetchChallengeMessages(
  challengeId: string,
): Promise<ChallengeChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_messages")
    .select(
      `
      id, body, author_role, created_at,
      author:profiles!challenge_messages_author_id_fkey ( display_name )
    `,
    )
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id,
    authorName: unwrapOne(row.author)?.display_name ?? "Member",
    role: row.author_role as "creator" | "member",
    text: row.body,
    createdAt: row.created_at,
  }));
}

import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Optional bulk share — not called automatically; users opt in per habit or from group Commitments. */
export async function ensureMemberGoalsSharedWithGroup(
  supabase: ServerSupabase,
  userId: string,
  groupId: string,
): Promise<void> {
  const member = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member.data) return;

  const { data: goals, error: goalsError } = await supabase
    .from("member_goals")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true);

  if (goalsError || !goals?.length) return;

  const rows = goals.map((g) => ({
    member_goal_id: g.id as string,
    group_id: groupId,
    user_id: userId,
  }));

  const { error } = await supabase.from("member_goal_group_shares").upsert(rows, {
    onConflict: "member_goal_id,group_id",
    ignoreDuplicates: true,
  });

  if (error && !/member_goal_group_shares|schema cache|duplicate/i.test(error.message)) {
    console.error("ensureMemberGoalsSharedWithGroup", error.message);
  }
}

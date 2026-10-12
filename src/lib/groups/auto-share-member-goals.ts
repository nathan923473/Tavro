import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const MISSING_SCHEMA = /schema cache|does not exist|member_goal_group_shares/i;

/**
 * Share this member's active Progress habits with their P.A. group.
 * Habits that already have a share row are left alone. Missing schema is a no-op.
 */
export async function autoShareActiveMemberGoals(
  supabase: ServerSupabase,
  userId: string,
  groupId: string,
): Promise<void> {
  try {
    let goals = await supabase
      .from("member_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true);

    if (goals.error && /active|schema cache/i.test(goals.error.message)) {
      goals = await supabase.from("member_goals").select("id").eq("user_id", userId);
    }
    if (goals.error || !goals.data?.length) return;

    const goalIds = goals.data.map((row) => row.id as string);
    const existing = await supabase
      .from("member_goal_group_shares")
      .select("goal_id")
      .eq("user_id", userId)
      .in("goal_id", goalIds);

    if (existing.error) return;

    const shared = new Set((existing.data ?? []).map((row) => row.goal_id as string));
    const missing = goalIds.filter((id) => !shared.has(id));
    if (!missing.length) return;

    const { error } = await supabase.from("member_goal_group_shares").insert(
      missing.map((goalId) => ({
        goal_id: goalId,
        group_id: groupId,
        user_id: userId,
      })),
    );
    if (error && !MISSING_SCHEMA.test(error.message) && !/duplicate|unique/i.test(error.message)) {
      console.error("autoShareActiveMemberGoals", error.message);
    }
  } catch (error) {
    console.error("autoShareActiveMemberGoals", error);
  }
}

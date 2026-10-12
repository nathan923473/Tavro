import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const MISSING_SCHEMA =
  /schema cache|does not exist|member_goal_group_shares|member_goal_celebrations|member_goal_weekly_reflections/i;

export function sharedCommitmentSchemaError(message: string): Error {
  if (MISSING_SCHEMA.test(message)) {
    return new Error(
      "Run migration 047_shared_member_goal_commitments.sql in Supabase, then try again.",
    );
  }
  return new Error(message);
}

export async function fetchHabitShareGroupIds(
  supabase: ServerSupabase,
  userId: string,
  goalIds: string[],
): Promise<Map<string, string>> {
  const shares = new Map<string, string>();
  if (!goalIds.length) return shares;

  const { data, error } = await supabase
    .from("member_goal_group_shares")
    .select("goal_id, group_id")
    .eq("user_id", userId)
    .in("goal_id", goalIds);

  if (error) return shares;
  for (const row of data ?? []) {
    shares.set(row.goal_id, row.group_id);
  }
  return shares;
}

async function displayName(supabase: ServerSupabase, userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  const name = data?.display_name?.trim();
  return name ? name.slice(0, 80) : "A group member";
}

async function enqueueForUsers(
  supabase: ServerSupabase,
  userIds: string[],
  input: { kind: string; title: string; body: string },
) {
  await Promise.all(
    userIds.map(async (userId) => {
      const { error } = await supabase.rpc("enqueue_app_notification", {
        p_user_id: userId,
        p_kind: input.kind,
        p_title: input.title,
        p_body: input.body,
        p_link_path: "/groups",
      });
      if (error && !/enqueue_app_notification|schema cache|does not exist/i.test(error.message)) {
        console.error("enqueue_app_notification", error.message);
      }
    }),
  );
}

/** Tell the rest of the group when a shared habit is completed. No-op if it is private. */
export async function notifySharedHabitCheckIn(
  supabase: ServerSupabase,
  userId: string,
  goalId: string,
) {
  const share = await supabase
    .from("member_goal_group_shares")
    .select("group_id")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (share.error || !share.data) return;

  const [habit, name, members] = await Promise.all([
    supabase.from("member_goals").select("title").eq("id", goalId).eq("user_id", userId).maybeSingle(),
    displayName(supabase, userId),
    supabase.from("group_members").select("user_id").eq("group_id", share.data.group_id),
  ]);

  const title = habit.data?.title?.trim().slice(0, 80) || "a habit";
  const recipients = (members.data ?? [])
    .map((row) => row.user_id as string)
    .filter((id) => id !== userId);

  await enqueueForUsers(supabase, recipients, {
    kind: "group_commitment_check_in",
    title: "Shared habit check-in",
    body: `${name} checked in: ${title}`,
  });
}

export async function notifySharedHabitCelebration(
  supabase: ServerSupabase,
  input: { fromUserId: string; toUserId: string; habitTitle: string },
) {
  const name = await displayName(supabase, input.fromUserId);
  const title = input.habitTitle.trim().slice(0, 80) || "habit";
  await enqueueForUsers(supabase, [input.toUserId], {
    kind: "group_commitment_celebration",
    title: "Your group celebrated you",
    body: `${name} celebrated your ${title}`,
  });
}

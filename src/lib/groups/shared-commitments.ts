import type { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import { scheduledDaysPerWeek } from "@/lib/habits/schedule";
import type { GroupSharedCommitment, GroupSharedReflection, HabitFrequencyType } from "@/types";

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

function weekEndKey(weekStart: string): string {
  const date = new Date(`${weekStart}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
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

async function loadSharedGoals(supabase: ServerSupabase, goalIds: string[]) {
  const withSchedule =
    "id, title, frequency_type, frequency_target, schedule_days_mask, paused_at, active";
  const basic = "id, title, frequency_type, frequency_target, paused_at, active";
  const full = await supabase.from("member_goals").select(withSchedule).in("id", goalIds);
  if (full.error && /schedule_days_mask|schema cache/i.test(full.error.message)) {
    return supabase.from("member_goals").select(basic).in("id", goalIds);
  }
  return full;
}

export async function fetchSharedCommitmentBoard(
  supabase: ServerSupabase,
  groupId: string,
  viewerUserId: string,
  weekStart: string,
  memberNames: Map<string, string>,
): Promise<{
  commitments: GroupSharedCommitment[];
  reflections: GroupSharedReflection[];
}> {
  const empty = { commitments: [], reflections: [] };

  const sharesRes = await supabase
    .from("member_goal_group_shares")
    .select("id, goal_id, user_id")
    .eq("group_id", groupId);

  if (sharesRes.error) return empty;

  const shares = (sharesRes.data ?? []).filter((row) => memberNames.has(row.user_id));
  const goalIds = shares.map((row) => row.goal_id);
  const shareIds = shares.map((row) => row.id);

  const goalsRes = goalIds.length
    ? await loadSharedGoals(supabase, goalIds)
    : { data: [], error: null };

  const [completionsRes, celebrationsRes, reflectionsRes] = await Promise.all([
    goalIds.length
      ? supabase
          .from("goal_completions")
          .select("goal_id, completion_date")
          .in("goal_id", goalIds)
          .gte("completion_date", weekStart)
          .lt("completion_date", weekEndKey(weekStart))
      : Promise.resolve({ data: [], error: null }),
    shareIds.length
      ? supabase
          .from("member_goal_celebrations")
          .select("share_id, from_user_id")
          .eq("group_id", groupId)
          .eq("week_start", weekStart)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("member_goal_weekly_reflections")
      .select("user_id, body")
      .eq("group_id", groupId)
      .eq("week_start", weekStart),
  ]);

  if (goalsRes.error || completionsRes.error) return empty;

  const goals = new Map(
    (goalsRes.data ?? []).map((goal) => [
      goal.id as string,
      goal as {
        id: string;
        title: string;
        frequency_type: string | null;
        frequency_target: number | null;
        schedule_days_mask?: number | null;
        paused_at: string | null;
        active: boolean | null;
      },
    ]),
  );

  const today = todayDateKey();
  const progressByGoal = new Map<string, { count: number; completedToday: boolean }>();
  for (const row of completionsRes.data ?? []) {
    const current = progressByGoal.get(row.goal_id) ?? { count: 0, completedToday: false };
    current.count += 1;
    if (row.completion_date === today) current.completedToday = true;
    progressByGoal.set(row.goal_id, current);
  }

  const celebrationsByShare = new Map<string, { count: number; viewer: boolean }>();
  if (!celebrationsRes.error) {
    for (const row of celebrationsRes.data ?? []) {
      const current = celebrationsByShare.get(row.share_id) ?? { count: 0, viewer: false };
      current.count += 1;
      if (row.from_user_id === viewerUserId) current.viewer = true;
      celebrationsByShare.set(row.share_id, current);
    }
  }

  const commitments: GroupSharedCommitment[] = [];
  for (const share of shares) {
    const goal = goals.get(share.goal_id);
    if (!goal || goal.active === false) continue;
    const progress = progressByGoal.get(share.goal_id);
    const celebrations = celebrationsByShare.get(share.id);
    const frequencyType: HabitFrequencyType =
      goal.frequency_type === "times_per_week" ? "times_per_week" : "daily";
    const target = scheduledDaysPerWeek({
      frequencyType,
      frequencyTarget: goal.frequency_target ?? (frequencyType === "daily" ? 7 : 3),
      scheduleDaysMask: goal.schedule_days_mask ?? 127,
    });
    commitments.push({
      shareId: share.id,
      goalId: share.goal_id,
      userId: share.user_id,
      displayName: memberNames.get(share.user_id) ?? "Member",
      title: goal.title,
      targetCount: target,
      progressCount: progress?.count ?? 0,
      completedToday: progress?.completedToday ?? false,
      paused: Boolean(goal.paused_at),
      isOwn: share.user_id === viewerUserId,
      celebratedByViewer: celebrations?.viewer ?? false,
      celebrationCount: celebrations?.count ?? 0,
    });
  }

  commitments.sort((a, b) => {
    if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
    return a.displayName.localeCompare(b.displayName) || a.title.localeCompare(b.title);
  });

  const reflections: GroupSharedReflection[] = reflectionsRes.error
    ? []
    : (reflectionsRes.data ?? [])
        .map((row) => ({
          userId: row.user_id as string,
          displayName: memberNames.get(row.user_id) ?? "Member",
          body: String(row.body ?? ""),
          isOwn: row.user_id === viewerUserId,
        }))
        .sort((a, b) => {
          if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
          return a.displayName.localeCompare(b.displayName);
        });

  return { commitments, reflections };
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

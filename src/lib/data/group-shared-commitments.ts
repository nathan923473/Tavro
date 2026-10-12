import type { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import { scheduledDaysPerWeek } from "@/lib/habits/schedule";
import type { GroupSharedCommitment, GroupSharedReflection, HabitFrequencyType } from "@/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

function weekEndKey(weekStart: string): string {
  const date = new Date(`${weekStart}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
}

/**
 * Load habit rows after the share rows.
 * Embedding member_goals on the share query drops other members' habits when
 * their goal row is not visible to the embedded join.
 */
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

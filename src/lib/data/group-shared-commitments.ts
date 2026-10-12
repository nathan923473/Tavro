import type { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import {
  sharedHabitFrequencyLabel,
  sharedHabitStatusOnDate,
  type SharedCommitmentDayStatus,
} from "@/lib/groups/shared-habit-status";
import { unwrapOne } from "@/lib/data/relations";
import { ALL_DAYS_MASK, normalizeScheduleMask } from "@/lib/habits/weekdays";
import type { GroupSharedCommitment, PersonalGoal } from "@/types";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  frequency_type?: string | null;
  frequency_target?: number | null;
  schedule_days_mask?: number | null;
  reminder_time?: string | null;
  paused_at?: string | null;
};

function mapShareGoalRow(
  g: GoalRow,
  completedToday: boolean,
  weeklyByGoal: Record<string, number>,
): PersonalGoal {
  const frequencyType =
    g.frequency_type === "times_per_week" ? "times_per_week" : "daily";
  return {
    id: g.id,
    title: g.title,
    category: g.category as PersonalGoal["category"],
    completedToday,
    streakDays: 0,
    weeklyCompletion: weeklyByGoal[g.id] ?? 0,
    templateKey: null,
    frequencyType,
    frequencyTarget:
      typeof g.frequency_target === "number"
        ? g.frequency_target
        : frequencyType === "daily"
          ? 7
          : 3,
    scheduleDaysMask: normalizeScheduleMask(g.schedule_days_mask ?? ALL_DAYS_MASK),
    reminderTimeLocal: g.reminder_time ?? null,
    paused: Boolean(g.paused_at),
    linkedChallengeId: null,
    sharedGroupId: null,
  };
}

export async function fetchGroupSharedCommitments(
  supabase: ServerSupabase,
  groupId: string,
  viewerUserId: string,
): Promise<GroupSharedCommitment[]> {
  const today = todayDateKey();

  const sharesRes = await supabase
    .from("member_goal_group_shares")
    .select(
      `
      id,
      member_goal_id,
      user_id,
      profile:profiles!member_goal_group_shares_user_id_fkey ( display_name, avatar_url )
    `,
    )
    .eq("group_id", groupId);

  if (
    sharesRes.error &&
    /member_goal_group_shares|schema cache/i.test(sharesRes.error.message)
  ) {
    return [];
  }

  const shareRows = sharesRes.data ?? [];
  if (!shareRows.length) return [];

  const goalIds = [...new Set(shareRows.map((r) => r.member_goal_id as string))];

  const goalsRes = await supabase
    .from("member_goals")
    .select(
      "id, user_id, title, category, frequency_type, frequency_target, schedule_days_mask, reminder_time, paused_at, active",
    )
    .in("id", goalIds);

  const goalById = new Map<string, GoalRow & { active?: boolean }>();
  for (const g of goalsRes.data ?? []) {
    if (g.active === false) continue;
    goalById.set(g.id as string, g as GoalRow);
  }

  const rows = shareRows.filter((row) => goalById.has(row.member_goal_id as string));

  if (!rows.length) return [];

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const [todayCompletions, weekCompletions, celebrationsRes] = await Promise.all([
    supabase
      .from("goal_completions")
      .select("goal_id")
      .eq("completion_date", today)
      .in("goal_id", goalIds),
    supabase
      .from("goal_completions")
      .select("goal_id, completion_date")
      .gte("completion_date", weekStartKey)
      .in("goal_id", goalIds),
    supabase
      .from("group_shared_habit_celebrations")
      .select("member_goal_id, from_user_id")
      .eq("group_id", groupId)
      .eq("celebration_date", today),
  ]);

  const completedToday = new Set(
    (todayCompletions.data ?? []).map((c) => c.goal_id as string),
  );

  const weekByGoal = new Map<string, Set<string>>();
  const weeklyByGoal: Record<string, number> = {};
  for (const c of weekCompletions.data ?? []) {
    const gid = c.goal_id as string;
    weeklyByGoal[gid] = (weeklyByGoal[gid] ?? 0) + 1;
    let set = weekByGoal.get(gid);
    if (!set) {
      set = new Set();
      weekByGoal.set(gid, set);
    }
    set.add(c.completion_date as string);
  }

  const celebrationCounts = new Map<string, number>();
  const viewerCelebrated = new Set<string>();
  for (const cel of celebrationsRes.data ?? []) {
    const gid = cel.member_goal_id as string;
    celebrationCounts.set(gid, (celebrationCounts.get(gid) ?? 0) + 1);
    if (cel.from_user_id === viewerUserId) viewerCelebrated.add(gid);
  }

  const byMember = new Map<string, GroupSharedCommitment[]>();

  for (const row of rows) {
    const goalRow = goalById.get(row.member_goal_id as string)!;
    const profile = unwrapOne(row.profile);
    const goal = mapShareGoalRow(
      goalRow,
      completedToday.has(goalRow.id),
      weeklyByGoal,
    );
    const todayStatus: SharedCommitmentDayStatus = sharedHabitStatusOnDate(
      goal,
      today,
      today,
      completedToday.has(goalRow.id),
      weekByGoal,
    );

    const item: GroupSharedCommitment = {
      shareId: row.id as string,
      memberGoalId: goalRow.id,
      userId: row.user_id as string,
      displayName: profile?.display_name ?? "Member",
      avatarUrl:
        profile && "avatar_url" in profile && typeof profile.avatar_url === "string"
          ? profile.avatar_url
          : null,
      title: goal.title,
      frequencyLabel: sharedHabitFrequencyLabel(goal),
      todayStatus,
      celebrationCount: celebrationCounts.get(goalRow.id) ?? 0,
      viewerCelebrated: viewerCelebrated.has(goalRow.id),
      isOwn: row.user_id === viewerUserId,
    };

    const list = byMember.get(item.userId) ?? [];
    list.push(item);
    byMember.set(item.userId, list);
  }

  const ordered: GroupSharedCommitment[] = [];
  for (const [, list] of byMember) {
    list.sort((a, b) => a.title.localeCompare(b.title));
    ordered.push(...list);
  }
  return ordered;
}

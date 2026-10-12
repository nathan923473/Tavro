import { createClient } from "@/lib/supabase/server";
import {
  computeWeeklyConsistency,
  type WeeklyConsistency,
} from "@/lib/progress/consistency";
import { MILESTONE_DEFINITIONS } from "@/lib/progress/milestones";
import { buildWeekDayIndicators } from "@/lib/habits/schedule";
import { todayDateKey } from "@/lib/dates";
import { ALL_DAYS_MASK, normalizeScheduleMask } from "@/lib/habits/weekdays";
import type {
  ConsistencySnapshot,
  DailyCheckInMood,
  MemberMilestone,
  PersonalGoal,
  WeeklyWeighIn,
  WeightProgressSummary,
} from "@/types";

type GoalRow = {
  id: string;
  title: string;
  category: string;
  template_key?: string | null;
  frequency_type?: string | null;
  frequency_target?: number | null;
  schedule_days_mask?: number | null;
  reminder_time?: string | null;
  paused_at?: string | null;
  linked_challenge_id?: string | null;
};

function mapGoalRow(
  g: GoalRow,
  completedToday: Set<string>,
  weeklyByGoal: Record<string, number>,
): PersonalGoal {
  const frequencyType =
    g.frequency_type === "times_per_week" ? "times_per_week" : "daily";
  const frequencyTarget =
    typeof g.frequency_target === "number"
      ? g.frequency_target
      : frequencyType === "daily"
        ? 7
        : 3;

  return {
    id: g.id,
    title: g.title,
    category: g.category as PersonalGoal["category"],
    completedToday: completedToday.has(g.id),
    streakDays: 0,
    weeklyCompletion: weeklyByGoal[g.id] ?? 0,
    templateKey: g.template_key ?? null,
    frequencyType,
    frequencyTarget,
    scheduleDaysMask: normalizeScheduleMask(
      g.schedule_days_mask ?? ALL_DAYS_MASK,
    ),
    reminderTimeLocal: g.reminder_time ?? null,
    paused: Boolean(g.paused_at),
    linkedChallengeId: g.linked_challenge_id ?? null,
  };
}

async function fetchGoalRows(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const fullSelect =
    "id, title, category, template_key, frequency_type, frequency_target, schedule_days_mask, reminder_time, paused_at, linked_challenge_id";
  const legacySelect = "id, title, category";

  let { data, error } = await supabase
    .from("member_goals")
    .select(fullSelect)
    .eq("user_id", userId)
    .eq("active", true)
    .order("sort_order");

  if (
    error &&
    /template_key|frequency_|schedule_days|reminder_time|paused_at|linked_challenge|schema cache/i.test(
      error.message,
    )
  ) {
    const legacy = await supabase
      .from("member_goals")
      .select(legacySelect)
      .eq("user_id", userId)
      .eq("active", true)
      .order("sort_order");
    data = legacy.data as typeof data;
  }

  return (data ?? []) as GoalRow[];
}

export async function fetchMemberGoals(userId: string): Promise<PersonalGoal[]> {
  const supabase = await createClient();
  const today = todayDateKey();
  const goals = await fetchGoalRows(supabase, userId);
  if (!goals.length) return [];

  const ids = goals.map((g) => g.id);
  const { data: completionsToday } = await supabase
    .from("goal_completions")
    .select("goal_id")
    .eq("user_id", userId)
    .eq("completion_date", today)
    .in("goal_id", ids);

  const completedToday = new Set(
    (completionsToday ?? []).map((c) => c.goal_id),
  );

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const { data: weekCompletions } = await supabase
    .from("goal_completions")
    .select("goal_id, completion_date")
    .eq("user_id", userId)
    .gte("completion_date", weekStartKey)
    .in("goal_id", ids);

  const weeklyByGoal: Record<string, number> = {};
  for (const c of weekCompletions ?? []) {
    weeklyByGoal[c.goal_id] = (weeklyByGoal[c.goal_id] ?? 0) + 1;
  }

  return goals.map((g) => mapGoalRow(g, completedToday, weeklyByGoal));
}

function weekStartKeyDaysAgo(daysAgo: number): string {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - daysAgo);
  return weekStart.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildWeekDaysChart(
  activeGoalCount: number,
  completionRows: { completion_date: string }[],
): { day: string; completed: number; total: number }[] {
  const byDate: Record<string, number> = {};
  for (const row of completionRows) {
    byDate[row.completion_date] = (byDate[row.completion_date] ?? 0) + 1;
  }

  const result: { day: string; completed: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayLabel = WEEKDAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
    result.push({
      day: dayLabel,
      completed: activeGoalCount > 0 ? (byDate[key] ?? 0) : 0,
      total: activeGoalCount,
    });
  }
  return result;
}

function mapGoalsFromCompletionRows(
  goalRows: GoalRow[],
  todayCompletionGoalIds: Set<string>,
  weekCompletionRows: { goal_id: string; completion_date?: string }[],
): PersonalGoal[] {
  const weeklyByGoal: Record<string, number> = {};
  for (const c of weekCompletionRows) {
    weeklyByGoal[c.goal_id] = (weeklyByGoal[c.goal_id] ?? 0) + 1;
  }
  return goalRows.map((g) =>
    mapGoalRow(g, todayCompletionGoalIds, weeklyByGoal),
  );
}

export type HomeDashboardData = {
  goals: PersonalGoal[];
  checkIn: {
    checkedIn: boolean;
    mood: DailyCheckInMood | null;
    reflection: string | null;
  };
  consistency: WeeklyConsistency;
  weekDays: { day: string; completed: number; total: number }[];
  weekDayIndicators: {
    day: string;
    dateKey: string;
    status: "none" | "partial" | "complete" | "future";
  }[];
  linkedHabits: PersonalGoal[];
  milestones: MemberMilestone[];
};

export async function fetchHomeDashboardBundle(
  userId: string,
): Promise<HomeDashboardData> {
  const supabase = await createClient();
  const today = todayDateKey();
  const weekStartKey = weekStartKeyDaysAgo(6);

  const goalRows = await fetchGoalRows(supabase, userId);
  const goalIds = goalRows.map((g) => g.id);

  const [checkInRes, milestonesRes, todayCompletionsRes, weekCompletionsRes] =
    await Promise.all([
    supabase
      .from("daily_check_ins")
      .select("mood, reflection")
      .eq("user_id", userId)
      .eq("check_in_date", today)
      .maybeSingle(),
    supabase
      .from("member_milestones")
      .select("milestone_key, unlocked_at")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false }),
    goalIds.length
      ? supabase
          .from("goal_completions")
          .select("goal_id")
          .eq("user_id", userId)
          .eq("completion_date", today)
          .in("goal_id", goalIds)
      : Promise.resolve({ data: [] as { goal_id: string }[], error: null }),
    goalIds.length
      ? supabase
          .from("goal_completions")
          .select("goal_id, completion_date")
          .eq("user_id", userId)
          .gte("completion_date", weekStartKey)
          .in("goal_id", goalIds)
      : Promise.resolve({
          data: [] as { goal_id: string; completion_date: string }[],
          error: null,
        }),
  ]);

  let checkInData = checkInRes.data;
  if (
    checkInRes.error &&
    /mood|reflection|schema cache/i.test(checkInRes.error.message)
  ) {
    const { data: legacy } = await supabase
      .from("daily_check_ins")
      .select("user_id")
      .eq("user_id", userId)
      .eq("check_in_date", today)
      .maybeSingle();
    checkInData = legacy ? ({} as typeof checkInData) : null;
  }

  const todayIds = new Set(
    (todayCompletionsRes.data ?? []).map((c) => c.goal_id),
  );
  const weekRows = weekCompletionsRes.data ?? [];
  const goals = mapGoalsFromCompletionRows(goalRows, todayIds, weekRows);

  const completionsByGoal: Record<string, number> = {};
  for (const g of goals) {
    completionsByGoal[g.id] = g.weeklyCompletion;
  }

  const activeCount = goals.filter((g) => !g.paused).length;
  const weekDays = buildWeekDaysChart(
    activeCount,
    weekRows.map((r) => ({ completion_date: r.completion_date })),
  );
  const weekDayIndicators = buildWeekDayIndicators(
    goals,
    weekRows.filter(
      (r): r is { goal_id: string; completion_date: string } =>
        Boolean(r.goal_id && r.completion_date),
    ),
  );

  const milestones: MemberMilestone[] =
    milestonesRes.error || !milestonesRes.data
      ? []
      : milestonesRes.data.map((row) => ({
          key: row.milestone_key,
          label:
            MILESTONE_DEFINITIONS[row.milestone_key]?.label ??
            row.milestone_key,
          unlockedAt: row.unlocked_at,
        }));

  return {
    goals,
    checkIn: {
      checkedIn: Boolean(checkInData),
      mood: (checkInData?.mood as DailyCheckInMood) ?? null,
      reflection: checkInData?.reflection ?? null,
    },
    consistency: computeWeeklyConsistency(goals, completionsByGoal),
    weekDays,
    weekDayIndicators,
    linkedHabits: goals.filter((g) => g.linkedChallengeId && !g.paused),
    milestones,
  };
}

export async function fetchAllMemberGoals(userId: string): Promise<PersonalGoal[]> {
  const supabase = await createClient();
  const today = todayDateKey();

  const fullSelect =
    "id, title, category, template_key, frequency_type, frequency_target, paused_at, linked_challenge_id, active";
  let { data: rows, error } = await supabase
    .from("member_goals")
    .select(fullSelect)
    .eq("user_id", userId)
    .order("sort_order");

  if (error && /template_key|frequency_|schema cache/i.test(error.message)) {
    const legacy = await supabase
      .from("member_goals")
      .select("id, title, category, active")
      .eq("user_id", userId)
      .order("sort_order");
    rows = legacy.data as typeof rows;
  }

  const goals = ((rows ?? []) as GoalRow[]).filter((r) => (r as { active?: boolean }).active !== false);
  if (!goals.length) return [];

  const ids = goals.map((g) => g.id);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const [{ data: completionsToday }, { data: weekCompletions }] = await Promise.all([
    supabase
      .from("goal_completions")
      .select("goal_id")
      .eq("user_id", userId)
      .eq("completion_date", today)
      .in("goal_id", ids),
    supabase
      .from("goal_completions")
      .select("goal_id")
      .eq("user_id", userId)
      .gte("completion_date", weekStartKey)
      .in("goal_id", ids),
  ]);

  const completedToday = new Set((completionsToday ?? []).map((c) => c.goal_id));
  const weeklyByGoal: Record<string, number> = {};
  for (const c of weekCompletions ?? []) {
    weeklyByGoal[c.goal_id] = (weeklyByGoal[c.goal_id] ?? 0) + 1;
  }

  return goals.map((g) => mapGoalRow(g, completedToday, weeklyByGoal));
}

export async function fetchTodayCheckIn(userId: string): Promise<{
  checkedIn: boolean;
  mood: DailyCheckInMood | null;
  reflection: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_check_ins")
    .select("mood, reflection")
    .eq("user_id", userId)
    .eq("check_in_date", todayDateKey())
    .maybeSingle();

  if (error && /mood|reflection|schema cache/i.test(error.message)) {
    const { data: legacy } = await supabase
      .from("daily_check_ins")
      .select("user_id")
      .eq("user_id", userId)
      .eq("check_in_date", todayDateKey())
      .maybeSingle();
    return { checkedIn: Boolean(legacy), mood: null, reflection: null };
  }

  return {
    checkedIn: Boolean(data),
    mood: (data?.mood as DailyCheckInMood) ?? null,
    reflection: data?.reflection ?? null,
  };
}

export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const { checkedIn } = await fetchTodayCheckIn(userId);
  return checkedIn;
}

export async function fetchWeeklyConsistencySummary(userId: string) {
  const goals = await fetchMemberGoals(userId);
  const completionsByGoal: Record<string, number> = {};
  for (const g of goals) {
    completionsByGoal[g.id] = g.weeklyCompletion;
  }
  return computeWeeklyConsistency(goals, completionsByGoal);
}

export async function fetchConsistencyMetrics(
  userId: string,
): Promise<ConsistencySnapshot[]> {
  const supabase = await createClient();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const { count: checkIns } = await supabase
    .from("daily_check_ins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("check_in_date", weekStartKey);

  const summary = await fetchWeeklyConsistencySummary(userId);

  return [
    {
      label: "Weekly consistency",
      value: summary.completed,
      target: Math.max(summary.planned, 1),
    },
    {
      label: "Check-ins this week",
      value: checkIns ?? 0,
      target: 7,
    },
  ];
}

export async function fetchWeightTrackingEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("weight_tracking_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error && /weight_tracking|schema cache/i.test(error.message)) {
    return true;
  }
  return data?.weight_tracking_enabled ?? true;
}

export async function fetchMilestones(userId: string): Promise<MemberMilestone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_milestones")
    .select("milestone_key, unlocked_at")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((row) => ({
    key: row.milestone_key,
    label: MILESTONE_DEFINITIONS[row.milestone_key]?.label ?? row.milestone_key,
    unlockedAt: row.unlocked_at,
  }));
}

export async function fetchWeighIns(userId: string): Promise<WeeklyWeighIn[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_weigh_ins")
    .select("id, recorded_date, weight_lb")
    .eq("user_id", userId)
    .order("recorded_date", { ascending: true })
    .limit(12);

  return (data ?? []).map((row, i) => ({
    id: row.id,
    date: row.recorded_date,
    label: `Week ${i + 1}`,
    weight: Number(row.weight_lb),
  }));
}

export async function fetchWeightSummary(
  userId: string,
): Promise<WeightProgressSummary | null> {
  const weighIns = await fetchWeighIns(userId);
  if (!weighIns.length) return null;
  return {
    unit: "lb",
    startWeight: weighIns[0].weight,
    currentWeight: weighIns[weighIns.length - 1].weight,
  };
}

export async function fetchWeeklyProgress(userId: string) {
  const supabase = await createClient();
  const goals = await fetchMemberGoals(userId);
  const activeCount = goals.filter((g) => !g.paused).length;
  const weekStartKey = weekStartKeyDaysAgo(6);

  const { data } = await supabase
    .from("goal_completions")
    .select("completion_date")
    .eq("user_id", userId)
    .gte("completion_date", weekStartKey);

  return buildWeekDaysChart(
    activeCount,
    (data ?? []) as { completion_date: string }[],
  );
}

export async function fetchLinkedChallengeHabits(userId: string) {
  const goals = await fetchMemberGoals(userId);
  return goals.filter((g) => g.linkedChallengeId && !g.paused);
}

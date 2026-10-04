import { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import type {
  ConsistencySnapshot,
  PersonalGoal,
  WeeklyWeighIn,
  WeightProgressSummary,
} from "@/types";

export async function fetchMemberGoals(userId: string): Promise<PersonalGoal[]> {
  const supabase = await createClient();
  const today = todayDateKey();

  const { data: goals } = await supabase
    .from("member_goals")
    .select("id, title, category")
    .eq("user_id", userId)
    .eq("active", true)
    .order("sort_order");

  if (!goals?.length) return [];

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

  return goals.map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category as PersonalGoal["category"],
    completedToday: completedToday.has(g.id),
    streakDays: 0,
    weeklyCompletion: weeklyByGoal[g.id] ?? 0,
  }));
}

export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_check_ins")
    .select("user_id")
    .eq("user_id", userId)
    .eq("check_in_date", todayDateKey())
    .maybeSingle();
  return Boolean(data);
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

  const { data: goals } = await supabase
    .from("member_goals")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true);

  const goalIds = (goals ?? []).map((g) => g.id);
  let goalCompletions = 0;
  if (goalIds.length) {
    const { count } = await supabase
      .from("goal_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("completion_date", weekStartKey)
      .in("goal_id", goalIds);
    goalCompletions = count ?? 0;
  }

  const goalTarget = Math.max(goalIds.length * 7, 1);

  return [
    {
      label: "Check-ins this week",
      value: checkIns ?? 0,
      target: 7,
    },
    {
      label: "Goals completed",
      value: goalCompletions,
      target: goalTarget,
    },
  ];
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
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const { data: goals } = await supabase
    .from("member_goals")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true);
  const total = goals?.length ?? 0;

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1];

    let completed = 0;
    if (total > 0) {
      const { count } = await supabase
        .from("goal_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completion_date", key);
      completed = Math.min(count ?? 0, total);
    }
    result.push({ day: dayLabel, completed, total });
  }
  return result;
}

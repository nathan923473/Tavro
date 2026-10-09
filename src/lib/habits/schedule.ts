import type { PersonalGoal } from "@/types";

/** Whether this habit counts toward today's plan (not a weekly rest day). */
export function isHabitScheduledToday(goal: PersonalGoal): boolean {
  if (goal.paused) return false;
  if (goal.frequencyType === "daily") return true;
  return goal.weeklyCompletion < goal.frequencyTarget;
}

export function habitsScheduledToday(goals: PersonalGoal[]): PersonalGoal[] {
  return goals.filter((g) => isHabitScheduledToday(g));
}

/** Scheduled on a calendar date given completions in that ISO week up to and including dateKey. */
export function isHabitScheduledOnDate(
  goal: PersonalGoal,
  dateKey: string,
  weekCompletionsByGoal: Map<string, Set<string>>,
): boolean {
  if (goal.paused) return false;
  if (goal.frequencyType === "daily") return true;

  const weekStart = weekStartForDateKey(dateKey);
  const doneBefore = countCompletionsInRange(
    goal.id,
    weekStart,
    dateKey,
    weekCompletionsByGoal,
    { exclusiveEnd: true },
  );
  return doneBefore < goal.frequencyTarget;
}

function weekStartForDateKey(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function countCompletionsInRange(
  goalId: string,
  startKey: string,
  endKey: string,
  map: Map<string, Set<string>>,
  opts: { exclusiveEnd: boolean },
): number {
  const dates = map.get(goalId);
  if (!dates) return 0;
  let n = 0;
  for (const key of dates) {
    if (key < startKey) continue;
    if (opts.exclusiveEnd ? key >= endKey : key > endKey) continue;
    if (key >= startKey && (opts.exclusiveEnd ? key < endKey : key <= endKey)) n++;
  }
  return n;
}

export function buildWeekDayIndicators(
  goals: PersonalGoal[],
  completionRows: { goal_id: string; completion_date: string }[],
): { day: string; dateKey: string; status: "none" | "partial" | "complete" | "future" }[] {
  const todayKey = new Date().toISOString().slice(0, 10);
  const byGoal = new Map<string, Set<string>>();
  for (const row of completionRows) {
    let set = byGoal.get(row.goal_id);
    if (!set) {
      set = new Set();
      byGoal.set(row.goal_id, set);
    }
    set.add(row.completion_date);
  }

  const active = goals.filter((g) => !g.paused);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const result: {
    day: string;
    dateKey: string;
    status: "none" | "partial" | "complete" | "future";
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const dayLabel = labels[d.getDay() === 0 ? 6 : d.getDay() - 1];

    if (dateKey > todayKey) {
      result.push({ day: dayLabel, dateKey, status: "future" });
      continue;
    }

    if (!active.length) {
      result.push({ day: dayLabel, dateKey, status: "none" });
      continue;
    }

    let scheduled = 0;
    let done = 0;
    for (const g of active) {
      if (!isHabitScheduledOnDate(g, dateKey, byGoal)) continue;
      scheduled++;
      if (byGoal.get(g.id)?.has(dateKey)) done++;
    }

    if (scheduled === 0) {
      result.push({ day: dayLabel, dateKey, status: "none" });
    } else if (done >= scheduled) {
      result.push({ day: dayLabel, dateKey, status: "complete" });
    } else if (done > 0) {
      result.push({ day: dayLabel, dateKey, status: "partial" });
    } else {
      result.push({ day: dayLabel, dateKey, status: "none" });
    }
  }

  return result;
}

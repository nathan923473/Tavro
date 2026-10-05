import type { PersonalGoal } from "@/types";

export type WeeklyConsistency = {
  planned: number;
  completed: number;
  percent: number;
  message: string;
};

export function weeklyPlannedCompletions(goals: PersonalGoal[]): number {
  return goals.reduce((sum, g) => {
    if (g.paused) return sum;
    if (g.frequencyType === "daily") return sum + 7;
    return sum + Math.min(7, Math.max(1, g.frequencyTarget));
  }, 0);
}

export function weeklyCompletedCount(
  goals: PersonalGoal[],
  completionsByGoal: Record<string, number>,
): number {
  return goals.reduce((sum, g) => {
    if (g.paused) return sum;
    return sum + (completionsByGoal[g.id] ?? 0);
  }, 0);
}

export function computeWeeklyConsistency(
  goals: PersonalGoal[],
  completionsByGoal: Record<string, number>,
): WeeklyConsistency {
  const active = goals.filter((g) => !g.paused);
  const planned = weeklyPlannedCompletions(active);
  const completed = weeklyCompletedCount(active, completionsByGoal);
  const percent =
    planned === 0 ? 0 : Math.min(100, Math.round((completed / planned) * 100));

  let message = "Small steps add up — keep going.";
  if (percent >= 80) message = "Strong week — consistency over perfection.";
  else if (percent >= 50) message = "You're building momentum.";
  else if (planned > 0 && completed === 0) {
    message = "Any one habit today is a win.";
  }

  return { planned, completed, percent, message };
}

export function habitsCompletedToday(goals: PersonalGoal[]): {
  done: number;
  total: number;
} {
  const active = goals.filter((g) => !g.paused);
  const done = active.filter((g) => g.completedToday).length;
  return { done, total: active.length };
}

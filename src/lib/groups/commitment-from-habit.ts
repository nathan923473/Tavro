import { popcountDays } from "@/lib/habits/weekdays";
import type { PersonalGoal } from "@/types";

/** Default weekly log target when adding a Progress habit as a group commitment. */
export function weeklyCommitmentTargetFromHabit(habit: PersonalGoal): number {
  if (habit.frequencyType === "times_per_week") {
    return Math.min(99, Math.max(1, habit.frequencyTarget));
  }
  const plannedDays = popcountDays(habit.scheduleDaysMask);
  return Math.min(99, Math.max(1, plannedDays || 7));
}

export function habitAlreadyWeeklyCommitment(
  habit: PersonalGoal,
  ownCommitments: { title: string }[],
): boolean {
  const title = habit.title.trim().toLowerCase();
  return ownCommitments.some((c) => c.title.trim().toLowerCase() === title);
}

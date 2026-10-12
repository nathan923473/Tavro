import { isHabitScheduledOnDate } from "@/lib/habits/schedule";
import {
  formatReminderTimeLocal,
  formatScheduleDaysLabel,
} from "@/lib/habits/weekdays";
import type { PersonalGoal } from "@/types";

export type SharedCommitmentDayStatus =
  | "completed"
  | "pending"
  | "missed"
  | "not_scheduled"
  | "paused";

export function sharedHabitFrequencyLabel(goal: PersonalGoal): string {
  const days = formatScheduleDaysLabel(goal.scheduleDaysMask);
  if (goal.frequencyType === "times_per_week") {
    return `${days} · ${goal.frequencyTarget}×/week`;
  }
  const time = formatReminderTimeLocal(goal.reminderTimeLocal);
  return time ? `${days} · ${time}` : days;
}

/** Status for a calendar day; missed only after that day has passed (UTC date keys). */
export function sharedHabitStatusOnDate(
  goal: PersonalGoal,
  dateKey: string,
  todayKey: string,
  completedOnDate: boolean,
  weekCompletionsByGoal: Map<string, Set<string>>,
): SharedCommitmentDayStatus {
  if (goal.paused) return "paused";
  if (
    !isHabitScheduledOnDate(goal, dateKey, weekCompletionsByGoal)
  ) {
    return "not_scheduled";
  }
  if (completedOnDate) return "completed";
  if (dateKey < todayKey) return "missed";
  return "pending";
}

export function statusLabel(status: SharedCommitmentDayStatus): string {
  switch (status) {
    case "completed":
      return "Done";
    case "pending":
      return "Due today";
    case "missed":
      return "Missed";
    case "not_scheduled":
      return "Rest day";
    case "paused":
      return "Paused";
  }
}

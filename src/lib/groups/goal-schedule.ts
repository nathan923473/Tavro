import type { GroupMemberPersonalGoal, GroupPersonalScheduleType } from "@/types";

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function daysBetween(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey).getTime();
  const end = parseDateKey(endKey).getTime();
  return Math.round((end - start) / 86400000);
}

/** UTC weekday: 0 = Sunday … 6 = Saturday */
export function utcWeekday(dateKey: string): number {
  return parseDateKey(dateKey).getUTCDay();
}

export function isPersonalGoalScheduledToday(
  goal: GroupMemberPersonalGoal,
  dateKey: string,
  weekCompletedCheckIns: number,
): boolean {
  switch (goal.scheduleType) {
    case "daily":
      return true;
    case "every_n_days": {
      const interval = Math.max(1, goal.scheduleInterval);
      const elapsed = daysBetween(goal.scheduleAnchor, dateKey);
      if (elapsed < 0) return false;
      return elapsed % interval === 0;
    }
    case "weekdays": {
      const dow = utcWeekday(dateKey);
      return goal.scheduleWeekdays.includes(dow);
    }
    case "times_per_week":
      return weekCompletedCheckIns < goal.timesPerWeek;
    default:
      return true;
  }
}

export function scheduleLabel(goal: GroupMemberPersonalGoal): string {
  switch (goal.scheduleType) {
    case "daily":
      return "Every day";
    case "every_n_days":
      return goal.scheduleInterval === 2
        ? "Every other day"
        : `Every ${goal.scheduleInterval} days`;
    case "weekdays": {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days = goal.scheduleWeekdays.map((d) => names[d]).join(", ");
      return days ? `On ${days}` : "On selected weekdays";
    }
    case "times_per_week":
      return `${goal.timesPerWeek}× per week (flex days)`;
    default:
      return "Custom schedule";
  }
}

export const PERSONAL_SCHEDULE_OPTIONS: {
  value: GroupPersonalScheduleType;
  label: string;
}[] = [
  { value: "daily", label: "Every day" },
  { value: "every_n_days", label: "Every other day" },
  { value: "weekdays", label: "Specific weekdays (Mon / Wed / Fri)" },
  { value: "times_per_week", label: "A few times per week (flexible days)" },
];

import type { PersonalGoal } from "@/types";

/** Bit 0 = Monday … bit 6 = Sunday. */
export const ALL_WEEKDAYS_MASK = 127;

export const WEEKDAY_OPTIONS = [
  { label: "Mon", full: "Monday", bit: 1 },
  { label: "Tue", full: "Tuesday", bit: 2 },
  { label: "Wed", full: "Wednesday", bit: 4 },
  { label: "Thu", full: "Thursday", bit: 8 },
  { label: "Fri", full: "Friday", bit: 16 },
  { label: "Sat", full: "Saturday", bit: 32 },
  { label: "Sun", full: "Sunday", bit: 64 },
] as const;

export function normalizeDaysMask(mask: number | null | undefined): number {
  if (typeof mask !== "number" || !Number.isInteger(mask) || mask < 1 || mask > ALL_WEEKDAYS_MASK) {
    return ALL_WEEKDAYS_MASK;
  }
  return mask;
}

/** `HH:MM` from a time input or a Postgres `time` value. */
export function normalizeReminderTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${match[1]}:${match[2]}`;
}

export function formatReminderTime(value: string | null | undefined): string | null {
  const normalized = normalizeReminderTime(value);
  if (!normalized) return null;
  const [hourText, minutes] = normalized.split(":");
  const hours = Number(hourText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${suffix}`;
}

export function habitDaysLabel(mask: number | null | undefined): string {
  const normalized = normalizeDaysMask(mask);
  if (normalized === ALL_WEEKDAYS_MASK) return "Every day";
  const selected = WEEKDAY_OPTIONS.filter((day) => (normalized & day.bit) !== 0).map(
    (day) => day.label,
  );
  if (normalized === 31) return "Weekdays";
  if (normalized === 96) return "Weekends";
  return selected.join(", ");
}

export function habitScheduleSummary(
  goal: Pick<PersonalGoal, "scheduleDaysMask" | "reminderTime" | "frequencyType" | "frequencyTarget">,
): string {
  const days = habitDaysLabel(goal.scheduleDaysMask);
  const time = formatReminderTime(goal.reminderTime);
  const times =
    goal.frequencyType === "times_per_week" ? `${goal.frequencyTarget}× per week` : null;
  const parts: string[] = [];
  if (times && days === "Every day") parts.push(times);
  else {
    parts.push(days);
    if (times) parts.push(times);
  }
  if (time) parts.push(time);
  return parts.join(" · ");
}

export function scheduledDaysPerWeek(
  goal: Pick<PersonalGoal, "frequencyType" | "frequencyTarget" | "scheduleDaysMask">,
): number {
  const days = popcount(normalizeDaysMask(goal.scheduleDaysMask));
  if (goal.frequencyType === "times_per_week") {
    const target = Math.min(7, Math.max(1, goal.frequencyTarget));
    return Math.min(days, target);
  }
  return days;
}

function popcount(mask: number): number {
  let count = 0;
  let bits = mask;
  while (bits) {
    count += bits & 1;
    bits >>= 1;
  }
  return count;
}

export function utcWeekdayFromDateKey(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();
}

function weekdayBitForUtcDay(utcDay: number): number {
  if (utcDay === 0) return 64;
  return 1 << (utcDay - 1);
}

export function dateMatchesDaysMask(
  dateKey: string,
  mask: number | null | undefined,
): boolean {
  const bit = weekdayBitForUtcDay(utcWeekdayFromDateKey(dateKey));
  return (normalizeDaysMask(mask) & bit) !== 0;
}

function dateKeyFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Whether this habit counts toward today's plan (not a weekly rest day). */
export function isHabitScheduledToday(goal: PersonalGoal, now: Date = new Date()): boolean {
  if (goal.paused) return false;
  if (!dateMatchesDaysMask(dateKeyFromDate(now), goal.scheduleDaysMask)) return false;
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
  if (!dateMatchesDaysMask(dateKey, goal.scheduleDaysMask)) return false;
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

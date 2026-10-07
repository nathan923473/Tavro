import { addDays, differenceInCalendarDays, parse } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { dateKeyInTimezone } from "@/lib/timezone/instant";
import { normalizeTimezone } from "@/lib/timezone/validate";

const LOCAL_DATE = "yyyy-MM-dd";

/** Current calendar date in the challenge's official timezone. */
export function challengeTodayDateKey(now: Date, challengeTimeZone: string): string {
  return dateKeyInTimezone(now, challengeTimeZone);
}

/** 1-based day index; before start → 0; after end → totalDays+1 handled by caller. */
export function challengeDayIndexInZone(
  startDateKey: string,
  challengeTimeZone: string,
  now: Date = new Date(),
): number {
  const todayKey = challengeTodayDateKey(now, challengeTimeZone);
  const startLocal = parse(startDateKey, LOCAL_DATE, new Date());
  const todayLocal = parse(todayKey, LOCAL_DATE, new Date());
  const diff = differenceInCalendarDays(todayLocal, startLocal);
  return diff + 1;
}

export function challengeTotalDaysFromDates(startDateKey: string, endDateKey: string): number {
  const start = parse(startDateKey, LOCAL_DATE, new Date());
  const end = parse(endDateKey, LOCAL_DATE, new Date());
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

/** Calendar date (yyyy-MM-dd) for 1-based challenge day on the official schedule. */
export function challengeDateKeyForDay(startDateKey: string, dayIndex1: number): string {
  const localStart = parse(startDateKey, LOCAL_DATE, new Date());
  const localDay = addDays(localStart, dayIndex1 - 1);
  const y = localDay.getFullYear();
  const m = String(localDay.getMonth() + 1).padStart(2, "0");
  const d = String(localDay.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Weekday 0=Sun in challenge timezone for 1-based day. */
export function weekdayInChallengeZone(
  startDateKey: string,
  dayIndex1: number,
  challengeTimeZone: string,
): number {
  const key = challengeDateKeyForDay(startDateKey, dayIndex1);
  const tz = normalizeTimezone(challengeTimeZone);
  const [y, m, d] = key.split("-").map(Number);
  const z = new TZDate(y, m - 1, d, 12, 0, 0, tz);
  return z.getDay();
}

export type ChallengePhase = "upcoming" | "active" | "completed";

export function challengePhaseFromInstants(
  startAt: Date,
  endAtExclusive: Date,
  now: Date = new Date(),
): ChallengePhase {
  if (now.getTime() < startAt.getTime()) return "upcoming";
  if (now.getTime() >= endAtExclusive.getTime()) return "completed";
  return "active";
}

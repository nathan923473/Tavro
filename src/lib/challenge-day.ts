/** 1-based challenge day index from start date (UTC date keys). */
export function challengeDayIndex(startDate: string, todayKey: string): number {
  const start = new Date(`${startDate}T12:00:00Z`).getTime();
  const today = new Date(`${todayKey}T12:00:00Z`).getTime();
  const diff = Math.floor((today - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

export function challengeTotalDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00Z`).getTime();
  const end = new Date(`${endDate}T12:00:00Z`).getTime();
  return Math.max(1, Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1);
}

/** UTC date key offset from a start date (day 1 = start, day N = start + N - 1). */
export function addDaysToDateKey(isoDate: string, daysToAdd: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

/** Last calendar day for a challenge that runs exactly `totalDays` days starting on startDate. */
export function challengeEndDateForDayCount(startDate: string, totalDays: number): string {
  const days = Math.max(1, Math.floor(totalDays));
  return addDaysToDateKey(startDate, days - 1);
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** UTC weekday 0=Sun … 6=Sat for 1-based challenge day index. */
export function weekdayUtcForChallengeDay(startDate: string, dayNumber1Based: number): number {
  const key = addDaysToDateKey(startDate, dayNumber1Based - 1);
  return new Date(`${key}T12:00:00Z`).getUTCDay();
}

/** 0-based schedule indices whose calendar weekday is in `weekdays` (within day range). */
export function indicesForWeekdaysInRange(
  startDate: string,
  fromDay: number,
  toDay: number,
  weekdays: Iterable<number>,
): number[] {
  const set = new Set(weekdays);
  if (!startDate || set.size === 0) return [];
  const from = Math.min(fromDay, toDay);
  const to = Math.max(fromDay, toDay);
  const out: number[] = [];
  for (let d = from; d <= to; d++) {
    if (set.has(weekdayUtcForChallengeDay(startDate, d))) out.push(d - 1);
  }
  return out;
}

/** 0-based indices: anchorDay, anchorDay+interval, … up to toDay (within from–to range). */
export function indicesForEveryNthDay(
  fromDay: number,
  toDay: number,
  interval: number,
  anchorDay: number,
): number[] {
  const step = Math.max(1, Math.floor(interval));
  const anchor = Math.max(1, Math.floor(anchorDay));
  const from = Math.min(fromDay, toDay);
  const to = Math.max(fromDay, toDay);
  const out: number[] = [];
  for (let d = from; d <= to; d++) {
    if (d < anchor) continue;
    if ((d - anchor) % step === 0) out.push(d - 1);
  }
  return out;
}

import { addDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { normalizeTimezone } from "@/lib/timezone/validate";

function partsFromDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { y, m: m - 1, d };
}

/** Calendar date key (yyyy-MM-dd) for an instant in the given IANA zone. */
export function dateKeyInTimezone(instant: Date, timeZone: string): string {
  const z = new TZDate(instant.getTime(), normalizeTimezone(timeZone));
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, "0");
  const d = String(z.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local midnight on `dateKey` in `timeZone` → UTC Date. */
export function zonedMidnightToUtc(dateKey: string, timeZone: string): Date {
  const { y, m, d } = partsFromDateKey(dateKey);
  const z = new TZDate(y, m, d, 0, 0, 0, normalizeTimezone(timeZone));
  return new Date(z.getTime());
}

/** Exclusive end: midnight at start of day after `endDateKey` in challenge zone. */
export function zonedExclusiveEndToUtc(endDateKey: string, timeZone: string): Date {
  const { y, m, d } = partsFromDateKey(endDateKey);
  const endLocal = new TZDate(y, m, d, 0, 0, 0, normalizeTimezone(timeZone));
  const next = addDays(endLocal, 1);
  const z = new TZDate(
    next.getFullYear(),
    next.getMonth(),
    next.getDate(),
    0,
    0,
    0,
    normalizeTimezone(timeZone),
  );
  return new Date(z.getTime());
}

/** Fixed-date challenge start from date + local time + challenge timezone. */
export function challengeStartInstantUtc(
  startDateKey: string,
  timeLocal: { hours: number; minutes: number },
  timeZone: string,
): Date {
  const { y, m, d } = partsFromDateKey(startDateKey);
  const z = new TZDate(
    y,
    m,
    d,
    timeLocal.hours,
    timeLocal.minutes,
    0,
    normalizeTimezone(timeZone),
  );
  return new Date(z.getTime());
}

export function parseTimeLocal(value: string): { hours: number; minutes: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatTimeLocal(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Legacy backfill: 00:00 on start_date in zone. */
export function legacyChallengeStartMidnightUtc(startDateKey: string, timeZone: string): Date {
  return zonedMidnightToUtc(startDateKey, timeZone);
}

export function isoUtc(d: Date): string {
  return d.toISOString();
}

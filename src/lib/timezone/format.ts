import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { AU_TIMEZONE_PICKER, COMMON_GLOBAL_TIMEZONES } from "@/lib/timezone/constants";

/** Display-only: calendar keys (yyyy-MM-dd) are labels; noon UTC avoids DST edge cases. */
const CALENDAR_DATE_DISPLAY_TZ = "UTC";

function calendarParts(dateKey: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

/** Unambiguous calendar day from stored date key: 1 Nov 2026 */
export function formatCalendarDateKey(
  dateKey: string,
  timeZone: string = CALENDAR_DATE_DISPLAY_TZ,
): string {
  const parts = calendarParts(dateKey);
  if (!parts) return dateKey;
  const tz = normalizeTimezone(timeZone);
  return format(new TZDate(parts.y, parts.m, parts.d, 12, 0, 0, tz), "d MMM yyyy");
}

/** Shorter calendar day for inline lists: 1 Nov */
export function formatCalendarDateKeyShort(
  dateKey: string,
  timeZone: string = CALENDAR_DATE_DISPLAY_TZ,
): string {
  const parts = calendarParts(dateKey);
  if (!parts) return dateKey;
  const tz = normalizeTimezone(timeZone);
  return format(new TZDate(parts.y, parts.m, parts.d, 12, 0, 0, tz), "d MMM");
}

/** Friendly challenge schedule range from start_date / end_date (display only). */
export function formatChallengeDateRange(
  startDateKey: string,
  endDateKey: string,
  challengeTimezone?: string | null,
): string {
  const tz = challengeTimezone
    ? normalizeTimezone(challengeTimezone)
    : CALENDAR_DATE_DISPLAY_TZ;
  return formatDateRange(startDateKey, endDateKey, tz);
}

/** Unambiguous date: 1 Nov 2026 */
export function formatShortDate(instant: Date, timeZone: string): string {
  const z = new TZDate(instant.getTime(), normalizeTimezone(timeZone));
  return format(z, "d MMM yyyy");
}

/** Unambiguous date + time for participant display. */
export function formatShortDateTime(instant: Date, timeZone: string): string {
  const z = new TZDate(instant.getTime(), normalizeTimezone(timeZone));
  return format(z, "d MMM · h:mm a");
}

export function formatTimeOnly(instant: Date, timeZone: string): string {
  const z = new TZDate(instant.getTime(), normalizeTimezone(timeZone));
  return format(z, "h:mm a");
}

export function formatDateRange(
  startDateKey: string,
  endDateKey: string,
  displayTimeZone: string,
): string {
  const tz = normalizeTimezone(displayTimeZone);
  const startParts = calendarParts(startDateKey);
  const endParts = calendarParts(endDateKey);
  if (!startParts || !endParts) return `${startDateKey} – ${endDateKey}`;

  if (startDateKey === endDateKey) {
    return format(new TZDate(endParts.y, endParts.m, endParts.d, 12, 0, 0, tz), "d MMM yyyy");
  }

  const sameYear = startParts.y === endParts.y;
  const start = format(
    new TZDate(startParts.y, startParts.m, startParts.d, 12, 0, 0, tz),
    sameYear ? "d MMM" : "d MMM yyyy",
  );
  const end = format(new TZDate(endParts.y, endParts.m, endParts.d, 12, 0, 0, tz), "d MMM yyyy");
  return `${start} – ${end}`;
}

export function friendlyTimezoneLabel(iana: string): string {
  const hit =
    AU_TIMEZONE_PICKER.find((z) => z.iana === iana) ??
    COMMON_GLOBAL_TIMEZONES.find((z) => z.iana === iana);
  if (hit) return hit.label;
  const parts = iana.split("/");
  return parts[parts.length - 1]?.replace(/_/g, " ") ?? iana;
}

export function friendlyTimezoneTitle(iana: string): string {
  const label = friendlyTimezoneLabel(iana);
  return `${label} time`;
}

/** Human countdown to start instant (no seconds). */
export function formatHumanCountdownToStart(startAtUtc: Date, nowMs = Date.now()): string {
  const ms = startAtUtc.getTime() - nowMs;
  if (ms <= 0) return "Started";

  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(ms / 3_600_000);
  const totalDays = Math.floor(ms / 86_400_000);

  if (totalDays > 1) {
    return `Starts in ${totalDays} days`;
  }

  if (totalDays === 1) {
    return "Starts tomorrow";
  }

  if (totalHours >= 1) {
    return `Starts in ${totalHours} hour${totalHours === 1 ? "" : "s"}`;
  }

  const mins = Math.max(1, totalMinutes);
  return `Starts in ${mins} minute${mins === 1 ? "" : "s"}`;
}

export function msUntilInstant(instant: Date, nowMs = Date.now()): number {
  return Math.max(0, instant.getTime() - nowMs);
}

export function hasStarted(instant: Date, nowMs = Date.now()): boolean {
  return instant.getTime() <= nowMs;
}

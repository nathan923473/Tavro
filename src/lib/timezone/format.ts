import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { AU_TIMEZONE_PICKER, COMMON_GLOBAL_TIMEZONES } from "@/lib/timezone/constants";

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
  const [sy, sm, sd] = startDateKey.split("-").map(Number);
  const [ey, em, ed] = endDateKey.split("-").map(Number);
  const start = format(new TZDate(sy, sm - 1, sd, 12, 0, 0, tz), "d MMM");
  const end = format(new TZDate(ey, em - 1, ed, 12, 0, 0, tz), "d MMM yyyy");
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

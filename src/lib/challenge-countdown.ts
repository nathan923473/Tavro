import {
  formatCalendarDateKey,
  formatCompactCountdownToStart,
  formatHumanCountdownToStart,
  hasStarted,
  msUntilInstant,
} from "@/lib/timezone/format";
import { resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";

/** @deprecated Use start_at ISO + formatHumanCountdownToStart */
export function challengeStartTimestampMs(startDateKey: string): number {
  return Date.parse(`${startDateKey}T00:00:00.000Z`);
}

export function isChallengeUpcomingByStartAt(startAtIso: string | null | undefined): boolean {
  if (!startAtIso) return false;
  return !hasStarted(new Date(startAtIso));
}

/** Legacy date-only upcoming check (fallback if start_at missing). */
export function isChallengeUpcomingLegacy(startDateKey: string, todayKey: string): boolean {
  return startDateKey > todayKey;
}

export function isChallengeUpcoming(input: {
  startAt?: string | null;
  startDate: string;
  challengeTimezone?: string | null;
}): boolean {
  const start = resolveChallengeStartAt({
    start_date: input.startDate,
    start_at: input.startAt,
    challenge_timezone: input.challengeTimezone,
  });
  return start.getTime() > Date.now();
}

export function msUntilChallengeStartAt(startAtIso: string, nowMs = Date.now()): number {
  return msUntilInstant(new Date(startAtIso), nowMs);
}

export { formatCompactCountdownToStart, formatHumanCountdownToStart, hasStarted };

/** @deprecated use formatCalendarDateKey from timezone/format */
export function formatChallengeStartDate(startDateKey: string): string {
  return formatCalendarDateKey(startDateKey);
}

/** @deprecated use formatHumanCountdownToStart */
export function formatChallengeCountdown(ms: number): string {
  if (ms <= 0) return "Started";
  const start = new Date(Date.now() + ms);
  return formatHumanCountdownToStart(start, Date.now());
}

import {
  formatHumanCountdownToStart,
  hasStarted,
  msUntilInstant,
} from "@/lib/timezone/format";

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
}): boolean {
  if (input.startAt) return isChallengeUpcomingByStartAt(input.startAt);
  return isChallengeUpcomingLegacy(input.startDate, new Date().toISOString().slice(0, 10));
}

export function msUntilChallengeStartAt(startAtIso: string, nowMs = Date.now()): number {
  return msUntilInstant(new Date(startAtIso), nowMs);
}

export { formatHumanCountdownToStart, hasStarted };

/** @deprecated use formatShortDate from timezone/format */
export function formatChallengeStartDate(startDateKey: string): string {
  return new Date(`${startDateKey}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** @deprecated use formatHumanCountdownToStart */
export function formatChallengeCountdown(ms: number): string {
  if (ms <= 0) return "Started";
  const totalDays = Math.floor(ms / 86_400_000);
  if (totalDays > 1) return `Starts in ${totalDays} days`;
  if (totalDays === 1) return "Starts tomorrow";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `Starts in ${hours} hours`;
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return `Starts in ${mins} minutes`;
}

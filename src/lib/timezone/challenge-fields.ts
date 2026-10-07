import {
  challengeStartInstantUtc,
  legacyChallengeStartMidnightUtc,
  parseTimeLocal,
  zonedExclusiveEndToUtc,
} from "@/lib/timezone/instant";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";

export function buildFixedInstantScheduleFields(input: {
  startDate: string;
  endDate: string;
  startTimeLocal: string;
  challengeTimezone: string;
}) {
  const tz = normalizeTimezone(input.challengeTimezone);
  const time = parseTimeLocal(input.startTimeLocal) ?? { hours: 9, minutes: 0 };
  const startAt = challengeStartInstantUtc(input.startDate, time, tz);
  const endAt = zonedExclusiveEndToUtc(input.endDate, tz);
  return {
    challenge_timezone: tz,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    schedule_mode: "fixed_instant" as const,
  };
}

/** When DB row lacks start_at (pre-backfill), synthesize legacy midnight for reads only. */
export function resolveChallengeStartAt(row: {
  start_date: string;
  start_at?: string | null;
  challenge_timezone?: string | null;
}): Date {
  if (row.start_at) return new Date(row.start_at);
  const tz = normalizeTimezone(row.challenge_timezone, DEFAULT_FALLBACK_TIMEZONE);
  return legacyChallengeStartMidnightUtc(row.start_date, tz);
}

export function resolveChallengeEndAt(row: {
  end_date: string;
  end_at?: string | null;
  challenge_timezone?: string | null;
}): Date {
  if (row.end_at) return new Date(row.end_at);
  const tz = normalizeTimezone(row.challenge_timezone, DEFAULT_FALLBACK_TIMEZONE);
  return zonedExclusiveEndToUtc(row.end_date, tz);
}

export function defaultStartTimeLocal(): string {
  return "09:00";
}

import type { CreatorChallengeWindow } from "@/lib/challenge-lifecycle/types";
import { challengePhaseFromInstants } from "@/lib/timezone/challenge-calendar";
import { resolveChallengeEndAt, resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";

type ChallengeRow = {
  id: string;
  title: string;
  publish_status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  start_date: string;
  end_date: string;
  challenge_timezone?: string | null;
};

export function buildCreatorChallengeWindow(
  row: ChallengeRow,
  now: Date = new Date(),
): CreatorChallengeWindow | null {
  const publishStatus = row.publish_status ?? "published";
  if (publishStatus === "draft") return null;

  const tz = normalizeTimezone(row.challenge_timezone, DEFAULT_FALLBACK_TIMEZONE);
  const startAt = resolveChallengeStartAt({
    start_date: row.start_date,
    start_at: row.start_at ?? null,
    challenge_timezone: tz,
  });
  const endAtExclusive = resolveChallengeEndAt({
    end_date: row.end_date,
    end_at: row.end_at ?? null,
    challenge_timezone: tz,
  });

  return {
    id: row.id,
    title: row.title,
    publishStatus,
    startAt,
    endAtExclusive,
    phase: challengePhaseFromInstants(startAt, endAtExclusive, now),
  };
}

export function publishedWindowsFromRows(
  rows: ChallengeRow[],
  now: Date = new Date(),
): CreatorChallengeWindow[] {
  return rows
    .map((r) => buildCreatorChallengeWindow(r, now))
    .filter((w): w is CreatorChallengeWindow => Boolean(w));
}

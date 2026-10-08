import { CREATOR_CHALLENGE_LIMITS } from "@/lib/challenge-lifecycle/config";
import type { CreatorChallengeWindow } from "@/lib/challenge-lifecycle/types";
import { challengePhaseFromInstants } from "@/lib/timezone/challenge-calendar";

export function intervalsOverlap(
  aStart: number,
  aEndExclusive: number,
  bStart: number,
  bEndExclusive: number,
): boolean {
  return aStart < bEndExclusive && bStart < aEndExclusive;
}

export function findScheduleConflict(
  candidate: { startAt: Date; endAtExclusive: Date; id?: string },
  existing: CreatorChallengeWindow[],
): CreatorChallengeWindow | null {
  const cStart = candidate.startAt.getTime();
  const cEnd = candidate.endAtExclusive.getTime();
  for (const other of existing) {
    if (candidate.id && other.id === candidate.id) continue;
    if (
      intervalsOverlap(cStart, cEnd, other.startAt.getTime(), other.endAtExclusive.getTime())
    ) {
      return other;
    }
  }
  return null;
}

export function countPublishedByPhase(windows: CreatorChallengeWindow[]) {
  let upcoming = 0;
  let active = 0;
  let completed = 0;
  for (const w of windows) {
    if (w.phase === "upcoming") upcoming += 1;
    else if (w.phase === "active") active += 1;
    else completed += 1;
  }
  return { upcoming, active, completed };
}

export type PublishValidationResult =
  | { ok: true }
  | { ok: false; code: "overlap" | "upcoming_limit" | "active_limit" | "missing_schedule"; message: string };

export function validatePublishAgainstLimits(
  candidate: { id?: string; startAt: Date | null; endAtExclusive: Date | null },
  publishedWindows: CreatorChallengeWindow[],
  now: Date = new Date(),
): PublishValidationResult {
  if (!candidate.startAt || !candidate.endAtExclusive) {
    return {
      ok: false,
      code: "missing_schedule",
      message: "Set a start date, time, timezone, and end date before publishing.",
    };
  }

  const others = publishedWindows.filter((w) => w.id !== candidate.id);
  const conflict = findScheduleConflict(
    {
      id: candidate.id,
      startAt: candidate.startAt,
      endAtExclusive: candidate.endAtExclusive,
    },
    others,
  );
  if (conflict) {
    return {
      ok: false,
      code: "overlap",
      message: `This schedule overlaps "${conflict.title}". Choose dates that don't overlap your other published challenges, or save as a draft until "${conflict.title}" finishes.`,
    };
  }

  const phase = challengePhaseFromInstants(candidate.startAt, candidate.endAtExclusive, now);
  const counts = countPublishedByPhase(others);

  if (phase === "upcoming" && counts.upcoming >= CREATOR_CHALLENGE_LIMITS.maxUpcomingPublished) {
    return {
      ok: false,
      code: "upcoming_limit",
      message: `You can have up to ${CREATOR_CHALLENGE_LIMITS.maxUpcomingPublished} upcoming published challenges. Complete or unpublish one before opening another registration.`,
    };
  }

  if (phase === "active" && counts.active >= CREATOR_CHALLENGE_LIMITS.maxActivePublished) {
    return {
      ok: false,
      code: "active_limit",
      message: `You can only run ${CREATOR_CHALLENGE_LIMITS.maxActivePublished} active challenge at a time. Finish your current challenge or adjust this start date.`,
    };
  }

  return { ok: true };
}

import {
  canRegisterForChallenge,
  registrationClosedMessage,
} from "@/lib/challenge-lifecycle/registration";
import { challengePhaseFromInstants } from "@/lib/timezone/challenge-calendar";
import { resolveChallengeEndAt, resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";

type ChallengeJoinRow = {
  publish_status?: string | null;
  start_date: string;
  end_date: string;
  start_at?: string | null;
  end_at?: string | null;
  challenge_timezone?: string | null;
  allow_late_join?: boolean | null;
  late_join_until?: string | null;
  created_by: string;
};

export function assertParticipantMayJoinChallenge(
  row: ChallengeJoinRow,
  userId: string,
  now: Date = new Date(),
): void {
  if (row.created_by === userId) return;

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
  const phase = challengePhaseFromInstants(startAt, endAtExclusive, now);
  const publishStatus = row.publish_status ?? "published";

  const decision = canRegisterForChallenge(
    {
      allowLateJoin: Boolean(row.allow_late_join),
      lateJoinUntil: row.late_join_until ? new Date(row.late_join_until) : null,
      startAt,
      endAtExclusive,
      publishStatus,
      phase,
    },
    now,
  );

  if (!decision.allowed) {
    throw new Error(registrationClosedMessage(decision.reason));
  }
}

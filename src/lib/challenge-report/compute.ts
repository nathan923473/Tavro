import { challengeTotalDays } from "../challenge-day";
import {
  CHALLENGE_REPORT_COMPLETION_PERCENT,
  CHALLENGE_REPORT_VERSION,
  type ChallengeReport,
  type ChallengeReportInput,
  type ChallengeReportJoinBreakdown,
  type ChallengeReportJoinSource,
  type ChallengeReportProgressBand,
} from "../../types/challenge-report";

const PROGRESS_BANDS: { label: string; min: number; max: number }[] = [
  { label: "0–19%", min: 0, max: 19 },
  { label: "20–39%", min: 20, max: 39 },
  { label: "40–59%", min: 40, max: 59 },
  { label: "60–79%", min: 60, max: 79 },
  { label: "80–100%", min: 80, max: 100 },
];

const JOIN_SOURCE_LABELS: Record<ChallengeReportJoinSource, string> = {
  challenge_landing: "Challenge page",
  creator_page: "Creator page",
  in_app: "In the app",
  unknown: "Unknown",
  unspecified: "Not recorded",
};

const KNOWN_JOIN_SOURCES: ChallengeReportJoinSource[] = [
  "challenge_landing",
  "creator_page",
  "in_app",
  "unknown",
];

function clampProgress(value: number | null): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid] ?? null;
}

function dateKey(value: string | null): string | null {
  if (!value) return null;
  const key = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

function normalizeJoinSource(value: string | null): ChallengeReportJoinSource {
  if (value && KNOWN_JOIN_SOURCES.includes(value as ChallengeReportJoinSource)) {
    return value as ChallengeReportJoinSource;
  }
  return "unspecified";
}

function buildHighlights(report: {
  participantCount: number;
  completedCount: number;
  completionRatePercent: number | null;
  completionThresholdPercent: number;
  activeParticipantCount: number;
  referralJoinCount: number;
  newPlatformUserCount: number;
  joinedBeforeStartCount: number;
}): string[] {
  if (report.participantCount === 0) {
    return ["No one joined this challenge."];
  }

  const lines = [
    `${report.completedCount} of ${report.participantCount} participants reached ${report.completionThresholdPercent}% progress.`,
  ];

  if (report.completionRatePercent != null && report.completionRatePercent >= 50) {
    lines.push("At least half the group finished.");
  } else if (report.completedCount === 0) {
    lines.push(`No participant reached ${report.completionThresholdPercent}% progress.`);
  }

  if (report.activeParticipantCount > 0) {
    lines.push(
      `${report.activeParticipantCount} participants logged activity at least once.`,
    );
  }
  if (report.referralJoinCount > 0) {
    lines.push(
      `${report.referralJoinCount} ${report.referralJoinCount === 1 ? "join came" : "joins came"} from a participant referral.`,
    );
  }
  if (report.newPlatformUserCount > 0) {
    lines.push(
      `${report.newPlatformUserCount} ${report.newPlatformUserCount === 1 ? "person created" : "people created"} a Tavro account when they joined.`,
    );
  }
  if (report.joinedBeforeStartCount > 0) {
    lines.push(
      `${report.joinedBeforeStartCount} ${report.joinedBeforeStartCount === 1 ? "person registered" : "people registered"} before the start date.`,
    );
  }

  return lines.slice(0, 5);
}

/** Aggregate a finished challenge from rows the creator can already read. */
export function computeChallengeReport(input: ChallengeReportInput): ChallengeReport {
  const threshold = CHALLENGE_REPORT_COMPLETION_PERCENT;
  const progressValues = input.participants.map((participant) =>
    clampProgress(participant.progressPercent),
  );
  const completedCount = progressValues.filter((progress) => progress >= threshold).length;
  const participantCount = progressValues.length;
  const averageProgressPercent =
    participantCount === 0
      ? null
      : Math.round(progressValues.reduce((sum, progress) => sum + progress, 0) / participantCount);

  const progressBands: ChallengeReportProgressBand[] = PROGRESS_BANDS.map((band) => ({
    label: band.label,
    count: progressValues.filter((progress) => progress >= band.min && progress <= band.max)
      .length,
  }));

  const activeIds = new Set<string>();
  for (const completion of input.scheduleCompletions) {
    if (completion.userId) activeIds.add(completion.userId);
  }
  for (const participant of input.participants) {
    if (participant.lastActivityDate && participant.userId) {
      activeIds.add(participant.userId);
    }
  }

  const sourceCounts = new Map<ChallengeReportJoinSource, number>();
  for (const source of KNOWN_JOIN_SOURCES) sourceCounts.set(source, 0);
  let joinedBeforeStartCount = 0;
  let joinedDuringChallengeCount = 0;
  let referralJoinCount = 0;
  let newPlatformUserCount = 0;

  for (const participant of input.participants) {
    const source = normalizeJoinSource(participant.joinSource);
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    if (participant.referrerUserId) referralJoinCount += 1;
    if (participant.isNewPlatformUser === true) newPlatformUserCount += 1;
    const joinedOn = dateKey(participant.joinedAt);
    if (joinedOn && joinedOn < input.startDate) joinedBeforeStartCount += 1;
    else joinedDuringChallengeCount += 1;
  }

  const joinsBySource: ChallengeReportJoinBreakdown[] = KNOWN_JOIN_SOURCES.map((source) => ({
    source,
    label: JOIN_SOURCE_LABELS[source],
    count: sourceCounts.get(source) ?? 0,
  }));
  const unspecified = sourceCounts.get("unspecified") ?? 0;
  if (unspecified > 0) {
    joinsBySource.push({
      source: "unspecified",
      label: JOIN_SOURCE_LABELS.unspecified,
      count: unspecified,
    });
  }

  const completionRatePercent = percent(completedCount, participantCount);
  const summary = {
    participantCount,
    completedCount,
    completionRatePercent,
    completionThresholdPercent: threshold,
    activeParticipantCount: activeIds.size,
    referralJoinCount,
    newPlatformUserCount,
    joinedBeforeStartCount,
  };

  return {
    version: CHALLENGE_REPORT_VERSION,
    challengeId: input.challengeId,
    title: input.title,
    category: input.category,
    startDate: input.startDate,
    endDate: input.endDate,
    durationDays: challengeTotalDays(input.startDate, input.endDate),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    isDemo: input.isDemo === true,
    completionThresholdPercent: threshold,
    participantCount,
    completedCount,
    completionRatePercent,
    averageProgressPercent,
    medianProgressPercent: median(progressValues),
    progressBands,
    activeParticipantCount: activeIds.size,
    activityCompletionCount: input.scheduleCompletions.length,
    plannedActivityCount: input.scheduleItems.filter((item) => !item.isRest).length,
    restDayCount: input.scheduleItems.filter((item) => item.isRest).length,
    referralJoinCount,
    newPlatformUserCount,
    joinedBeforeStartCount,
    joinedDuringChallengeCount,
    joinsBySource,
    announcementCount: Math.max(0, input.announcementCount),
    messageCount: Math.max(0, input.messageCount),
    highlights: buildHighlights(summary),
  };
}

export type StoredChallengeReportPayload = Omit<ChallengeReport, "isDemo">;

export function toStoredPayload(report: ChallengeReport): StoredChallengeReportPayload {
  const payload: StoredChallengeReportPayload & { isDemo?: boolean } = { ...report };
  delete payload.isDemo;
  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): boolean {
  return value === null || isWholeNumber(value);
}

export function reportFromPayload(payload: unknown): ChallengeReport | null {
  if (!isRecord(payload) || payload.version !== CHALLENGE_REPORT_VERSION) return null;
  if (typeof payload.challengeId !== "string" || typeof payload.title !== "string") return null;
  if (typeof payload.startDate !== "string" || typeof payload.endDate !== "string") return null;
  if (typeof payload.generatedAt !== "string") return null;
  if (!isWholeNumber(payload.participantCount) || !isWholeNumber(payload.completedCount)) {
    return null;
  }
  if (
    !isNullableNumber(payload.completionRatePercent) ||
    !isNullableNumber(payload.averageProgressPercent) ||
    !isNullableNumber(payload.medianProgressPercent)
  ) {
    return null;
  }
  if (!Array.isArray(payload.progressBands) || !Array.isArray(payload.joinsBySource)) return null;
  if (!Array.isArray(payload.highlights)) return null;
  if (
    !payload.progressBands.every(
      (band) =>
        isRecord(band) && typeof band.label === "string" && isWholeNumber(band.count),
    )
  ) {
    return null;
  }
  if (
    !payload.joinsBySource.every(
      (row) =>
        isRecord(row) &&
        typeof row.source === "string" &&
        typeof row.label === "string" &&
        isWholeNumber(row.count),
    )
  ) {
    return null;
  }
  if (!payload.highlights.every((line) => typeof line === "string")) return null;

  const numericKeys = [
    "durationDays",
    "completionThresholdPercent",
    "activeParticipantCount",
    "activityCompletionCount",
    "plannedActivityCount",
    "restDayCount",
    "referralJoinCount",
    "newPlatformUserCount",
    "joinedBeforeStartCount",
    "joinedDuringChallengeCount",
    "announcementCount",
    "messageCount",
  ] as const;
  for (const key of numericKeys) {
    if (!isWholeNumber(payload[key])) return null;
  }

  return {
    version: CHALLENGE_REPORT_VERSION,
    challengeId: payload.challengeId,
    title: payload.title,
    category: typeof payload.category === "string" ? payload.category : null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    durationDays: payload.durationDays as number,
    generatedAt: payload.generatedAt,
    isDemo: false,
    completionThresholdPercent: payload.completionThresholdPercent as number,
    participantCount: payload.participantCount,
    completedCount: payload.completedCount,
    completionRatePercent: payload.completionRatePercent as number | null,
    averageProgressPercent: payload.averageProgressPercent as number | null,
    medianProgressPercent: payload.medianProgressPercent as number | null,
    progressBands: payload.progressBands as ChallengeReportProgressBand[],
    activeParticipantCount: payload.activeParticipantCount as number,
    activityCompletionCount: payload.activityCompletionCount as number,
    plannedActivityCount: payload.plannedActivityCount as number,
    restDayCount: payload.restDayCount as number,
    referralJoinCount: payload.referralJoinCount as number,
    newPlatformUserCount: payload.newPlatformUserCount as number,
    joinedBeforeStartCount: payload.joinedBeforeStartCount as number,
    joinedDuringChallengeCount: payload.joinedDuringChallengeCount as number,
    joinsBySource: payload.joinsBySource as ChallengeReportJoinBreakdown[],
    announcementCount: payload.announcementCount as number,
    messageCount: payload.messageCount as number,
    highlights: payload.highlights as string[],
  };
}

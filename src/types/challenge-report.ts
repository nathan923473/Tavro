/** Matches founder metric M9: progress_percent >= this value counts as completed. */
export const CHALLENGE_REPORT_COMPLETION_PERCENT = 80;

export const CHALLENGE_REPORT_VERSION = 1;

export type ChallengeReportJoinSource =
  | "challenge_landing"
  | "creator_page"
  | "in_app"
  | "unknown"
  | "unspecified";

export type ChallengeReportJoinBreakdown = {
  source: ChallengeReportJoinSource;
  label: string;
  count: number;
};

export type ChallengeReportProgressBand = {
  label: string;
  count: number;
};

export type ChallengeReport = {
  version: typeof CHALLENGE_REPORT_VERSION;
  challengeId: string;
  title: string;
  category: string | null;
  startDate: string;
  endDate: string;
  durationDays: number;
  generatedAt: string;
  isDemo: boolean;
  completionThresholdPercent: number;
  participantCount: number;
  completedCount: number;
  completionRatePercent: number | null;
  averageProgressPercent: number | null;
  medianProgressPercent: number | null;
  progressBands: ChallengeReportProgressBand[];
  activeParticipantCount: number;
  activityCompletionCount: number;
  plannedActivityCount: number;
  restDayCount: number;
  referralJoinCount: number;
  newPlatformUserCount: number;
  joinedBeforeStartCount: number;
  joinedDuringChallengeCount: number;
  joinsBySource: ChallengeReportJoinBreakdown[];
  announcementCount: number;
  messageCount: number;
  highlights: string[];
};

export type ChallengeReportParticipantInput = {
  userId: string;
  progressPercent: number | null;
  joinedAt: string | null;
  lastActivityDate: string | null;
  joinSource: string | null;
  referrerUserId: string | null;
  isNewPlatformUser: boolean | null;
};

export type ChallengeReportScheduleItemInput = {
  id: string;
  isRest: boolean;
};

export type ChallengeReportCompletionInput = {
  userId: string;
  scheduleItemId: string;
  completedOn: string;
};

export type ChallengeReportInput = {
  challengeId: string;
  title: string;
  category: string | null;
  startDate: string;
  endDate: string;
  participants: ChallengeReportParticipantInput[];
  scheduleItems: ChallengeReportScheduleItemInput[];
  scheduleCompletions: ChallengeReportCompletionInput[];
  announcementCount: number;
  messageCount: number;
  generatedAt?: string;
  isDemo?: boolean;
};

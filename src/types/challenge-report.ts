export type ChallengeReportDailyEngagement = {
  dateKey: string;
  label: string;
  activeParticipants: number;
  checkIns: number;
};

export type ChallengeReportComparison = {
  previousChallengeId: string;
  previousChallengeTitle: string;
  previousStartDate: string;
  previousEndDate: string;
  previousDurationDays: number;
  participantsChangePercent: number | null;
  completionRateChangePoints: number | null;
  avgProgressChangePoints: number | null;
  avgDailyActiveChangePercent: number | null;
  totalCheckInsChangePercent: number | null;
  coachingClicksChangePercent: number | null;
  comparisonNote: string | null;
};

export type ChallengeReportMetricDef = {
  value: string;
  hint: string;
};

/** Legacy frozen reports (still rendered). */
export type ChallengeReportPayload = {
  version: 1;
  challengeId: string;
  generatedAt: string;
  overview: {
    challengeTitle: string;
    creatorName: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    challengeTimezone: string;
    totalJoined: number;
    startedParticipating: number;
    completedParticipants: number;
    completionRatePercent: number | null;
    completionDefinition: string;
    totalCheckIns: number;
    totalScheduleActivityCompletions: number;
  };
  engagement: {
    daily: ChallengeReportDailyEngagement[];
    averageCheckInsPerParticipant: number | null;
    peakDayLabel: string | null;
    peakDayActive: number;
  };
  community: {
    challengeAnnouncements: number;
    communityAnnouncementsDuringChallenge: number;
    note: string;
  };
  coaching: {
    status: "unavailable" | "community_aggregate";
    totalCommunityLinkClicksDuringChallenge: number | null;
    uniqueCommunityLinkClickDays: number | null;
    message: string;
  };
  insights: string[];
  recommendations: string[];
  comparison: ChallengeReportComparison | null;
};

export type ChallengeReportAcquisitionSource = {
  key: "challenge_page" | "creator_page" | "in_app_discovery" | "participant_referral" | "unknown";
  label: string;
  count: number;
};

export type ChallengeReportPayloadV2 = {
  version: 2;
  challengeId: string;
  generatedAt: string;
  snapshotNote: string;
  overview: {
    challengeTitle: string;
    creatorName: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    challengeTimezone: string;
    totalJoined: ChallengeReportMetricDef;
    startedParticipating: ChallengeReportMetricDef;
  };
  progress: {
    completionThresholdPercent: number;
    reached80Count: number;
    completedParticipants: ChallengeReportMetricDef;
    completionRatePercent: number | null;
    completionRateHint: string;
    averageProgressPercent: number | null;
    medianProgressPercent: number | null;
    distribution: { label: string; count: number }[];
  };
  activity: {
    totalCheckIns: ChallengeReportMetricDef;
    scheduleCompletions: ChallengeReportMetricDef;
    plannedActivityDays: number;
    restDaysInSchedule: number;
    averageCheckInsPerActiveParticipant: number | null;
  };
  dailyEngagement: {
    daily: ChallengeReportDailyEngagement[];
    chartLabel: string;
    trendSummary: string | null;
    peakDayLabel: string | null;
    peakDayActive: number;
  };
  community: {
    challengeAnnouncements: number;
    communityAnnouncementsDuringChallenge: number;
    chatMessagesDuringChallenge: number;
    note: string;
  };
  coaching: {
    programLinkClicks: number | null;
    completionOfferClicks: number | null;
    uniqueClickers: null;
    trackingNote: string;
    disclaimer: string;
  };
  acquisition: {
    classifiedParticipants: number;
    unclassifiedCount: number;
    sources: ChallengeReportAcquisitionSource[];
    note: string;
  };
  growth: {
    referralAttributedJoins: number;
    newPlatformAccountsAtJoin: number;
    note: string;
  };
  feedback: {
    responseCount: number;
    averageRating: number | null;
    ratingDisplaySafe: boolean;
    consentedWrittenSamples: string[];
    emptyMessage: string;
  };
  insights: string[];
  recommendations: string[];
  comparison: ChallengeReportComparison | null;
};

export type AnyChallengeReportPayload = ChallengeReportPayload | ChallengeReportPayloadV2;

export function isReportV2(report: AnyChallengeReportPayload): report is ChallengeReportPayloadV2 {
  return report.version === 2;
}

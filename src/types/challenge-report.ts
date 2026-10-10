export type ChallengeReportDailyEngagement = {
  dateKey: string;
  label: string;
  activeParticipants: number;
  checkIns: number;
};

export type ChallengeReportComparison = {
  previousChallengeId: string;
  previousChallengeTitle: string;
  participantsChangePercent: number | null;
  completionRateChangePoints: number | null;
  avgDailyActiveChangePercent: number | null;
  totalCheckInsChangePercent: number | null;
  coachingClicksChangePercent: number | null;
};

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

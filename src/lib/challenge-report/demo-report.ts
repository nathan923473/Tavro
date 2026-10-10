import type { ChallengeReportPayload } from "@/types/challenge-report";

/** Illustrative post-challenge report for Studio preview (not tied to real challenge data). */
export function buildDemoChallengeReport(creatorName: string): ChallengeReportPayload {
  const startDate = "2026-03-01";
  const endDate = "2026-03-21";
  const durationDays = 21;

  const dailyPattern = [
    18, 22, 24, 23, 21, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 8, 7, 6, 6, 5,
  ];

  const daily = dailyPattern.map((activeParticipants, i) => {
    const day = i + 1;
    const d = new Date(`${startDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    const checkIns = Math.round(activeParticipants * 1.35);
    return {
      dateKey,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      activeParticipants,
      checkIns,
    };
  });

  const totalCheckIns = daily.reduce((s, d) => s + d.checkIns, 0);
  const totalJoined = 47;
  const startedParticipating = 38;
  const completedParticipants = 19;

  return {
    version: 1,
    challengeId: "00000000-0000-4000-8000-000000000demo",
    generatedAt: new Date().toISOString(),
    overview: {
      challengeTitle: "21-Day Strength & Steps Reset (sample)",
      creatorName: creatorName.trim() || "You",
      startDate,
      endDate,
      durationDays,
      challengeTimezone: "Australia/Sydney",
      totalJoined,
      startedParticipating,
      completedParticipants,
      completionRatePercent: Math.round((completedParticipants / totalJoined) * 100),
      completionDefinition:
        "Completed = activity progress ≥ 80% (Tavro participant progress, not enrollment alone).",
      totalCheckIns,
      totalScheduleActivityCompletions: 312,
    },
    engagement: {
      daily,
      averageCheckInsPerParticipant: Math.round((totalCheckIns / startedParticipating) * 10) / 10,
      peakDayLabel: daily[2]?.label ?? null,
      peakDayActive: daily[2]?.activeParticipants ?? 0,
    },
    community: {
      challengeAnnouncements: 6,
      communityAnnouncementsDuringChallenge: 4,
      note: "Aggregate announcement counts only — no private group chats or personal reflections.",
    },
    coaching: {
      status: "community_aggregate",
      totalCommunityLinkClicksDuringChallenge: 14,
      uniqueCommunityLinkClickDays: 9,
      message:
        "Community-wide link clicks during this challenge window (not verified sales or per-offer attribution).",
    },
    insights: [
      "Daily participation was stronger in the first half of the challenge than in the second half.",
      "Participants were most consistent during the opening week.",
      "Peak daily participation was 24 active participants on Mar 3.",
      "9 participants joined but never logged a check-in or activity completion.",
    ],
    recommendations: [
      "Try a midpoint milestone or creator update around the halfway mark to re-engage participants.",
      "Improve first-day onboarding: welcome message, clear Day 1 actions, and a reminder to complete the first check-in.",
      "Experiment with more community updates during the challenge to spark discussion between check-ins.",
    ],
    comparison: {
      previousChallengeId: "00000000-0000-4000-8000-000000000prev",
      previousChallengeTitle: "14-Day Morning Movement (sample previous)",
      participantsChangePercent: 24,
      completionRateChangePoints: 5,
      avgDailyActiveChangePercent: 12,
      totalCheckInsChangePercent: 18,
      coachingClicksChangePercent: 40,
    },
  };
}

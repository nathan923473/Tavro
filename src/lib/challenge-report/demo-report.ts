import type { ChallengeReportPayloadV2 } from "@/types/challenge-report";

/** Illustrative v2 report for Studio preview (not tied to real challenge data). */
export function buildDemoChallengeReport(creatorName: string): ChallengeReportPayloadV2 {
  const startDate = "2026-03-01";
  const endDate = "2026-03-21";
  const durationDays = 21;
  const dailyPattern = [
    18, 22, 24, 23, 21, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 8, 7, 6, 6, 5,
  ];
  const daily = dailyPattern.map((activeParticipants, i) => {
    const d = new Date(`${startDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return {
      dateKey: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      activeParticipants,
      checkIns: Math.round(activeParticipants * 1.35),
    };
  });
  const totalJoined = 47;
  const started = 38;
  const reached80 = 19;

  return {
    version: 2,
    challengeId: "00000000-0000-4000-8000-000000000demo",
    generatedAt: new Date().toISOString(),
    snapshotNote: "Demo data only — illustrative snapshot for layout preview.",
    overview: {
      challengeTitle: "21-Day Strength & Steps Reset (sample)",
      creatorName: creatorName.trim() || "You",
      startDate,
      endDate,
      durationDays,
      challengeTimezone: "Australia/Sydney",
      totalJoined: { value: String(totalJoined), hint: "Members who joined this challenge." },
      startedParticipating: {
        value: String(started),
        hint: "Distinct participants with qualifying check-in or activity.",
      },
    },
    progress: {
      completionThresholdPercent: 80,
      reached80Count: reached80,
      completedParticipants: {
        value: String(reached80),
        hint: "Participants with progress ≥ 80%.",
      },
      completionRatePercent: Math.round((reached80 / totalJoined) * 100),
      completionRateHint: "% of joined who reached ≥ 80% progress.",
      averageProgressPercent: 62,
      medianProgressPercent: 71,
      distribution: [
        { label: "0–25%", count: 6 },
        { label: "26–50%", count: 9 },
        { label: "51–79%", count: 13 },
        { label: "80–100%", count: 19 },
      ],
    },
    activity: {
      totalCheckIns: { value: "512", hint: "Daily check-in rows." },
      scheduleCompletions: { value: "312", hint: "Scheduled activity check-offs." },
      plannedActivityDays: 18,
      restDaysInSchedule: 3,
      averageCheckInsPerActiveParticipant: 13.5,
    },
    dailyEngagement: {
      daily,
      chartLabel: "Daily active participants",
      trendSummary:
        "Daily activity was highest during the first week and declined toward the end of the challenge.",
      peakDayLabel: daily[2]?.label ?? null,
      peakDayActive: 24,
    },
    community: {
      challengeAnnouncements: 6,
      communityAnnouncementsDuringChallenge: 4,
      chatMessagesDuringChallenge: 28,
      note: "Public challenge chat only.",
    },
    coaching: {
      programLinkClicks: 14,
      completionOfferClicks: 6,
      uniqueClickers: null,
      trackingNote: "Sample click counts during the challenge window.",
      disclaimer: "Clicks are interest signals, not verified sales.",
    },
    acquisition: {
      classifiedParticipants: totalJoined,
      unclassifiedCount: 0,
      sources: [
        { key: "challenge_page", label: "Challenge page", count: 22 },
        { key: "creator_page", label: "Creator page", count: 8 },
        { key: "in_app_discovery", label: "In-app discovery", count: 7 },
        { key: "participant_referral", label: "Participant referral", count: 6 },
      ],
      note: "Each participant counted once.",
    },
    growth: {
      referralAttributedJoins: 6,
      newPlatformAccountsAtJoin: 11,
      note: "May overlap with acquisition — do not add to source totals.",
    },
    feedback: {
      responseCount: 12,
      averageRating: 4.2,
      ratingDisplaySafe: true,
      consentedWrittenSamples: ["Daily reminders helped · More midpoint check-ins"],
      emptyMessage: "",
    },
    insights: [
      "19 of 47 participants reached at least 80% progress.",
      "Participation was highest during the first four days.",
      "Daily activity was highest during the first week and declined toward the end of the challenge.",
    ],
    recommendations: [
      "Activity dipped later in the run — test a midpoint milestone around the halfway mark.",
      "Your completion offer received clicks — try a clearer coaching CTA on the final day.",
    ],
    comparison: {
      previousChallengeId: "00000000-0000-4000-8000-000000000prev",
      previousChallengeTitle: "14-Day Morning Movement (sample)",
      previousStartDate: "2026-01-05",
      previousEndDate: "2026-01-18",
      previousDurationDays: 14,
      participantsChangePercent: 24,
      completionRateChangePoints: 5,
      avgProgressChangePoints: 8,
      avgDailyActiveChangePercent: 12,
      totalCheckInsChangePercent: 18,
      coachingClicksChangePercent: 40,
      comparisonNote:
        "Previous challenge was 14 days; this one was 21 days — compare daily active participants rather than totals alone.",
    },
  };
}

import { computeChallengeReport } from "./compute";
import type { ChallengeReport, ChallengeReportInput } from "../../types/challenge-report";

export const DEMO_CHALLENGE_REPORT_GENERATED_AT = "2026-04-01T00:00:00.000Z";

/** Fixed sample so the studio preview matches the live report layout. */
export function demoChallengeReportInput(): ChallengeReportInput {
  const participants: ChallengeReportInput["participants"] = [
    ...Array.from({ length: 10 }, (_, index) => ({
      userId: `demo-complete-${index}`,
      progressPercent: 100,
      joinedAt: "2026-02-01T15:00:00.000Z",
      lastActivityDate: "2026-02-15",
      joinSource: "challenge_landing",
      referrerUserId: index < 3 ? "demo-referrer" : null,
      isNewPlatformUser: index < 4,
    })),
    ...Array.from({ length: 5 }, (_, index) => ({
      userId: `demo-threshold-${index}`,
      progressPercent: 80,
      joinedAt: "2026-02-02T15:00:00.000Z",
      lastActivityDate: "2026-02-14",
      joinSource: "creator_page",
      referrerUserId: null,
      isNewPlatformUser: false,
    })),
    ...Array.from({ length: 4 }, (_, index) => ({
      userId: `demo-near-${index}`,
      progressPercent: 79,
      joinedAt: "2026-02-03T15:00:00.000Z",
      lastActivityDate: "2026-02-10",
      joinSource: "in_app",
      referrerUserId: null,
      isNewPlatformUser: false,
    })),
    {
      userId: "demo-mid",
      progressPercent: 40,
      joinedAt: "2026-02-04T15:00:00.000Z",
      lastActivityDate: null,
      joinSource: null,
      referrerUserId: null,
      isNewPlatformUser: null,
    },
    {
      userId: "demo-start",
      progressPercent: 0,
      joinedAt: "2026-02-05T15:00:00.000Z",
      lastActivityDate: null,
      joinSource: "unknown",
      referrerUserId: null,
      isNewPlatformUser: false,
    },
  ];

  const scheduleCompletions: ChallengeReportInput["scheduleCompletions"] = [];
  for (let index = 0; index < 12; index += 1) {
    const userId = participants[index]?.userId;
    if (!userId) continue;
    scheduleCompletions.push({
      userId,
      scheduleItemId: "demo-day-1",
      completedOn: "2026-02-02",
    });
    if (index < 8) {
      scheduleCompletions.push({
        userId,
        scheduleItemId: "demo-day-2",
        completedOn: "2026-02-03",
      });
    }
  }

  return {
    challengeId: "demo",
    title: "Morning Walk Reset",
    category: "walking",
    startDate: "2026-02-02",
    endDate: "2026-02-15",
    participants,
    scheduleItems: [
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `demo-day-${index + 1}`,
        isRest: false,
      })),
      { id: "demo-rest-1", isRest: true },
      { id: "demo-rest-2", isRest: true },
    ],
    scheduleCompletions,
    announcementCount: 3,
    messageCount: 18,
    generatedAt: DEMO_CHALLENGE_REPORT_GENERATED_AT,
    isDemo: true,
  };
}

export function buildDemoChallengeReport(): ChallengeReport {
  return computeChallengeReport(demoChallengeReportInput());
}

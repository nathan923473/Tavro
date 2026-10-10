#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeChallengeReport,
  reportFromPayload,
  toStoredPayload,
} from "../src/lib/challenge-report/compute.ts";
import {
  buildDemoChallengeReport,
  demoChallengeReportInput,
} from "../src/lib/challenge-report/demo-report.ts";
import { CHALLENGE_REPORT_COMPLETION_PERCENT } from "../src/types/challenge-report.ts";

test("completion starts at 80% progress", () => {
  assert.equal(CHALLENGE_REPORT_COMPLETION_PERCENT, 80);
  const report = computeChallengeReport({
    challengeId: "c1",
    title: "Walk",
    category: null,
    startDate: "2026-02-02",
    endDate: "2026-02-03",
    participants: [
      {
        userId: "a",
        progressPercent: 80,
        joinedAt: "2026-02-02T00:00:00.000Z",
        lastActivityDate: null,
        joinSource: null,
        referrerUserId: null,
        isNewPlatformUser: null,
      },
      {
        userId: "b",
        progressPercent: 79,
        joinedAt: "2026-02-02T00:00:00.000Z",
        lastActivityDate: null,
        joinSource: null,
        referrerUserId: null,
        isNewPlatformUser: null,
      },
    ],
    scheduleItems: [],
    scheduleCompletions: [],
    announcementCount: 0,
    messageCount: 0,
    generatedAt: "2026-03-01T00:00:00.000Z",
  });

  assert.equal(report.completedCount, 1);
  assert.equal(report.completionRatePercent, 50);
  assert.equal(report.progressBands.reduce((sum, band) => sum + band.count, 0), 2);
  assert.equal(report.durationDays, 2);
});

test("empty challenges have no rate and do not invent participants", () => {
  const report = computeChallengeReport({
    challengeId: "empty",
    title: "Empty",
    category: null,
    startDate: "2026-01-01",
    endDate: "2026-01-07",
    participants: [],
    scheduleItems: [{ id: "rest", isRest: true }],
    scheduleCompletions: [],
    announcementCount: 0,
    messageCount: 0,
    generatedAt: "2026-01-08T00:00:00.000Z",
  });

  assert.equal(report.participantCount, 0);
  assert.equal(report.completionRatePercent, null);
  assert.equal(report.averageProgressPercent, null);
  assert.equal(report.medianProgressPercent, null);
  assert.deepEqual(report.highlights, ["No one joined this challenge."]);
  assert.equal(report.restDayCount, 1);
});

test("activity, referrals, and joins use existing rows without storing user ids", () => {
  const report = computeChallengeReport({
    challengeId: "c2",
    title: "Habits",
    category: "healthy_habits",
    startDate: "2026-03-01",
    endDate: "2026-03-07",
    participants: [
      {
        userId: "secret-user",
        progressPercent: 100,
        joinedAt: "2026-02-20T12:00:00.000Z",
        lastActivityDate: "2026-03-02",
        joinSource: "creator_page",
        referrerUserId: "secret-referrer",
        isNewPlatformUser: true,
      },
      {
        userId: "other",
        progressPercent: 10,
        joinedAt: "2026-03-02T12:00:00.000Z",
        lastActivityDate: null,
        joinSource: "not-a-real-source",
        referrerUserId: null,
        isNewPlatformUser: false,
      },
    ],
    scheduleItems: [
      { id: "day", isRest: false },
      { id: "rest", isRest: true },
    ],
    scheduleCompletions: [
      { userId: "secret-user", scheduleItemId: "day", completedOn: "2026-03-01" },
      { userId: "secret-user", scheduleItemId: "day", completedOn: "2026-03-02" },
    ],
    announcementCount: 2,
    messageCount: 4,
    generatedAt: "2026-03-08T00:00:00.000Z",
  });

  assert.equal(report.activeParticipantCount, 1);
  assert.equal(report.activityCompletionCount, 2);
  assert.equal(report.referralJoinCount, 1);
  assert.equal(report.newPlatformUserCount, 1);
  assert.equal(report.joinedBeforeStartCount, 1);
  assert.equal(report.joinedDuringChallengeCount, 1);
  assert.equal(report.joinsBySource.find((row) => row.source === "unspecified")?.count, 1);
  const stored = JSON.stringify(toStoredPayload(report));
  assert.equal(stored.includes("secret-user"), false);
  assert.equal(stored.includes("secret-referrer"), false);
  assert.equal(stored.includes("isDemo"), false);
  const roundTrip = reportFromPayload(toStoredPayload(report));
  assert.equal(roundTrip?.isDemo, false);
  assert.equal(roundTrip?.completedCount, 1);
  assert.equal(reportFromPayload({ version: 2 }), null);
});

test("the same inputs always produce the same snapshot", () => {
  const input = demoChallengeReportInput();
  const first = computeChallengeReport(input);
  const second = computeChallengeReport(input);
  assert.deepEqual(first, second);
  const demo = buildDemoChallengeReport();
  assert.equal(demo.isDemo, true);
  assert.equal(demo.participantCount, 21);
  assert.equal(demo.completedCount, 15);
  assert.equal(demo.completionThresholdPercent, 80);
  assert.equal(demo.durationDays, 14);
});

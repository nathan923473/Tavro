#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDemoChallengeReport } from "../src/lib/challenge-report/demo-report.ts";
import {
  buildInsightsV2,
  buildRecommendationsV2,
} from "../src/lib/challenge-report/insights.ts";
import { FOUNDER_CHALLENGE_COMPLETION_PERCENT } from "../src/lib/analytics/constants.ts";

test("sample report is a v2 snapshot with an 80% completion threshold", () => {
  assert.equal(FOUNDER_CHALLENGE_COMPLETION_PERCENT, 80);
  const report = buildDemoChallengeReport("Avery");
  assert.equal(report.version, 2);
  assert.equal(report.overview.creatorName, "Avery");
  assert.equal(report.progress.completionThresholdPercent, 80);
  assert.equal(report.progress.reached80Count, 19);
  assert.equal(report.comparison?.coachingClicksChangePercent, 40);
  assert.ok(report.dailyEngagement.daily.length > 0);
  assert.match(report.snapshotNote, /Demo data only/);
});

test("insights call out early participation and a later drop", () => {
  const report = buildDemoChallengeReport("Avery");
  const { insights, recommendations, comparison, ...core } = report;
  assert.ok(insights);
  assert.ok(recommendations);
  assert.ok(comparison);
  const nextInsights = buildInsightsV2(core);
  assert.ok(nextInsights.some((line) => line.includes("reached at least 80%")));
  assert.ok(nextInsights.some((line) => line.includes("first week")));
  const recs = buildRecommendationsV2(core, nextInsights);
  assert.ok(recs.some((line) => line.includes("midpoint")));
});

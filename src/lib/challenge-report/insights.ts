import type { ChallengeReportPayloadV2 } from "@/types/challenge-report";

export function buildDailyEngagementTrend(daily: ChallengeReportPayloadV2["dailyEngagement"]["daily"]): string | null {
  if (daily.length < 4) return null;
  const firstWeek = daily.slice(0, Math.min(7, daily.length));
  const rest = daily.slice(7);
  if (!rest.length) return null;
  const avg = (rows: typeof daily) =>
    rows.length ? rows.reduce((s, d) => s + d.activeParticipants, 0) / rows.length : 0;
  const w1 = avg(firstWeek);
  const wr = avg(rest);
  if (w1 > wr * 1.15 && w1 > 0) {
    return "Daily activity was highest during the first week and declined toward the end of the challenge.";
  }
  if (wr > w1 * 1.15) {
    return "Daily activity picked up after the first week.";
  }
  return null;
}

type ReportCore = Omit<ChallengeReportPayloadV2, "insights" | "recommendations" | "comparison">;

export function buildInsightsV2(data: ReportCore): string[] {
  const insights: string[] = [];
  const { progress, dailyEngagement, acquisition, overview } = data;
  const totalJoined = Number(overview.totalJoined.value);
  const started = Number(overview.startedParticipating.value);

  if (totalJoined > 0 && progress.reached80Count > 0) {
    insights.push(
      `${progress.reached80Count} of ${totalJoined} participants reached at least ${progress.completionThresholdPercent}% progress.`,
    );
  }

  if (dailyEngagement.daily.length >= 4) {
    let peakIdx = 0;
    let peak = 0;
    dailyEngagement.daily.forEach((d, i) => {
      if (d.activeParticipants > peak) {
        peak = d.activeParticipants;
        peakIdx = i;
      }
    });
    if (peak > 0 && peakIdx < 4) {
      insights.push("Participation was highest during the first four days.");
    }
  }

  const trend = buildDailyEngagementTrend(dailyEngagement.daily);
  if (trend) insights.push(trend);

  const topSource = acquisition.sources
    .filter((s) => s.key !== "unknown")
    .sort((a, b) => b.count - a.count)[0];
  if (topSource && topSource.count >= 3 && acquisition.classifiedParticipants >= 5) {
    insights.push(`Most classified joins came from ${topSource.label.toLowerCase()}.`);
  }

  if (totalJoined > 0 && started < totalJoined && totalJoined - started >= 2) {
    insights.push(
      `${totalJoined - started} participants joined but never logged a qualifying check-in or scheduled activity.`,
    );
  }

  return insights.slice(0, 5);
}

export function buildRecommendationsV2(data: ReportCore, insights: string[]): string[] {
  const recs: string[] = [];
  const { overview, community, coaching, progress, dailyEngagement, feedback } = data;
  const totalJoined = Number(overview.totalJoined.value);
  const started = Number(overview.startedParticipating.value);

  if (totalJoined > started + 2) {
    recs.push(
      "Many people joined without starting — strengthen first-day onboarding with a welcome message and a clear Day 1 action.",
    );
  }

  if (insights.some((i) => i.includes("declined toward the end") || i.includes("first week"))) {
    recs.push(
      "Activity dipped later in the run — test a midpoint milestone or encouragement announcement around the halfway mark.",
    );
  }

  if (community.chatMessagesDuringChallenge < 5 && started >= 5) {
    recs.push(
      "Community chat was quiet — experiment with discussion prompts or short creator updates between check-ins.",
    );
  }

  if (progress.completionRatePercent != null && progress.completionRatePercent >= 45) {
    recs.push("Participation stayed relatively strong — consider reusing this challenge structure for your next run.");
  }

  if (
    coaching.completionOfferClicks != null &&
    coaching.completionOfferClicks >= 3
  ) {
    recs.push(
      "Your completion offer received clicks — try a clearer coaching CTA on the final day while interest is high.",
    );
  }

  if (feedback.responseCount === 0 && totalJoined >= 5) {
    recs.push(
      "No feedback responses yet — mention the optional survey in your thank-you announcement after the next challenge.",
    );
  }

  if (!recs.length && dailyEngagement.daily.some((d) => d.activeParticipants > 0)) {
    recs.push(
      "Pick one metric from this report (e.g. daily active participants in week one) and set a concrete target for your next challenge.",
    );
  }

  return recs.slice(0, 4);
}

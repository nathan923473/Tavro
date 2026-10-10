import { FOUNDER_CHALLENGE_COMPLETION_PERCENT } from "@/lib/analytics/constants";
import {
  challengeDateKeyForDay,
  challengeTotalDaysFromDates,
} from "@/lib/timezone/challenge-calendar";
import { buildCreatorChallengeWindow } from "@/lib/challenge-lifecycle/creator-windows";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ChallengeReportComparison,
  ChallengeReportPayload,
} from "@/types/challenge-report";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";

type ChallengeRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_at: string | null;
  end_at: string | null;
  challenge_timezone: string | null;
  created_by: string;
  community_id: string | null;
  publish_status: string | null;
  visibility: string;
  creator: { display_name: string | null } | { display_name: string | null }[] | null;
};

function unwrapCreator(
  creator: ChallengeRow["creator"],
): { display_name: string | null } | null {
  if (!creator) return null;
  return Array.isArray(creator) ? creator[0] ?? null : creator;
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function buildInsights(payload: Omit<ChallengeReportPayload, "insights" | "recommendations" | "comparison">): string[] {
  const insights: string[] = [];
  const { daily } = payload.engagement;
  const { overview } = payload;

  if (daily.length >= 4) {
    const mid = Math.floor(daily.length / 2);
    const firstHalf = daily.slice(0, mid);
    const secondHalf = daily.slice(mid);
    const avg = (rows: typeof daily) =>
      rows.length
        ? rows.reduce((s, r) => s + r.activeParticipants, 0) / rows.length
        : 0;
    const a1 = avg(firstHalf);
    const a2 = avg(secondHalf);
    if (a1 > 0 && a2 < a1 * 0.75) {
      insights.push(
        "Daily participation was stronger in the first half of the challenge than in the second half.",
      );
    } else if (a2 > a1 * 1.25 && a1 > 0) {
      insights.push("Participation picked up during the second half of the challenge.");
    }
  }

  if (daily.length >= 7) {
    const firstWeek = daily.slice(0, Math.min(7, daily.length));
    const rest = daily.slice(7);
    if (rest.length) {
      const w1 =
        firstWeek.reduce((s, d) => s + d.activeParticipants, 0) / firstWeek.length;
      const wr = rest.reduce((s, d) => s + d.activeParticipants, 0) / rest.length;
      if (w1 > wr * 1.2 && wr >= 0) {
        insights.push("Participants were most consistent during the opening week.");
      }
    }
  }

  if (payload.engagement.peakDayLabel && payload.engagement.peakDayActive > 0) {
    insights.push(
      `Peak daily participation was ${payload.engagement.peakDayActive} active participants on ${payload.engagement.peakDayLabel}.`,
    );
  }

  if (overview.totalJoined > 0 && overview.startedParticipating < overview.totalJoined * 0.5) {
    insights.push(
      `${overview.totalJoined - overview.startedParticipating} participants joined but never logged a check-in or activity completion.`,
    );
  }

  return insights.slice(0, 4);
}

function buildRecommendations(
  overview: ChallengeReportPayload["overview"],
  insights: string[],
  community: ChallengeReportPayload["community"],
): string[] {
  const recs: string[] = [];

  if (insights.some((i) => i.includes("first half"))) {
    recs.push(
      "Try a midpoint milestone or creator update around the halfway mark to re-engage participants.",
    );
  }
  if (overview.totalJoined > overview.startedParticipating + 2) {
    recs.push(
      "Improve first-day onboarding: welcome message, clear Day 1 actions, and a reminder to complete the first check-in.",
    );
  }
  if (overview.completionRatePercent != null && overview.completionRatePercent >= 50) {
    recs.push(
      "Engagement stayed relatively strong — consider duplicating this challenge structure for your next run.",
    );
  }
  if (community.challengeAnnouncements + community.communityAnnouncementsDuringChallenge < 2) {
    recs.push(
      "Experiment with more community updates during the challenge to spark discussion between check-ins.",
    );
  }
  if (!recs.length) {
    recs.push(
      "Review daily participation in the chart above and set one concrete goal for your next challenge (e.g. first-week check-ins).",
    );
  }
  return recs.slice(0, 4);
}

export async function computeChallengeReport(
  challengeId: string,
  previousReport: ChallengeReportPayload | null,
): Promise<ChallengeReportPayload> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Report generation unavailable (server configuration).");
  }

  const { data: ch, error } = await admin
    .from("challenges")
    .select(
      `
      id, title, start_date, end_date, start_at, end_at, challenge_timezone,
      created_by, community_id, publish_status, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name )
    `,
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !ch) throw new Error("Challenge not found.");

  const row = ch as unknown as ChallengeRow;
  const window = buildCreatorChallengeWindow({
    id: row.id,
    title: row.title,
    publish_status: row.publish_status,
    start_date: row.start_date,
    end_date: row.end_date,
    start_at: row.start_at,
    end_at: row.end_at,
    challenge_timezone: row.challenge_timezone,
  });

  if (!window || window.phase !== "completed") {
    throw new Error("Report is only available after the challenge ends.");
  }

  if (row.visibility !== "public") {
    throw new Error("Reports are for public creator challenges.");
  }

  const tz = normalizeTimezone(row.challenge_timezone, DEFAULT_FALLBACK_TIMEZONE);
  const durationDays = challengeTotalDaysFromDates(row.start_date, row.end_date);
  const creatorName = unwrapCreator(row.creator)?.display_name?.trim() || "Creator";

  const { data: participants } = await admin
    .from("challenge_participants")
    .select("user_id, progress_percent, joined_at")
    .eq("challenge_id", challengeId);

  const participantRows = participants ?? [];
  const totalJoined = participantRows.length;
  const completedParticipants = participantRows.filter(
    (p) => (p.progress_percent ?? 0) >= FOUNDER_CHALLENGE_COMPLETION_PERCENT,
  ).length;
  const completionRatePercent =
    totalJoined > 0
      ? Math.round((completedParticipants / totalJoined) * 100)
      : null;

  const { data: checkInRows } = await admin
    .from("challenge_daily_check_ins")
    .select("user_id, check_in_date")
    .eq("challenge_id", challengeId);

  const { data: scheduleRows } = await admin
    .from("challenge_schedule_completions")
    .select("user_id, completed_on")
    .eq("challenge_id", challengeId);

  const startedSet = new Set<string>();
  for (const r of checkInRows ?? []) startedSet.add(r.user_id);
  for (const r of scheduleRows ?? []) startedSet.add(r.user_id);

  const totalCheckIns = checkInRows?.length ?? 0;
  const totalScheduleActivityCompletions = scheduleRows?.length ?? 0;

  const daily: ChallengeReportPayload["engagement"]["daily"] = [];
  for (let day = 1; day <= durationDays; day++) {
    const dateKey = challengeDateKeyForDay(row.start_date, day);
    const active = new Set<string>();
    for (const r of checkInRows ?? []) {
      if (r.check_in_date === dateKey) active.add(r.user_id);
    }
    for (const r of scheduleRows ?? []) {
      if (r.completed_on === dateKey) active.add(r.user_id);
    }
    const checkIns = (checkInRows ?? []).filter((r) => r.check_in_date === dateKey).length;
    const d = new Date(`${dateKey}T12:00:00Z`);
    daily.push({
      dateKey,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      activeParticipants: active.size,
      checkIns,
    });
  }

  let peakDayLabel: string | null = null;
  let peakDayActive = 0;
  for (const d of daily) {
    if (d.activeParticipants > peakDayActive) {
      peakDayActive = d.activeParticipants;
      peakDayLabel = d.label;
    }
  }

  const averageCheckInsPerParticipant =
    startedSet.size > 0 ? Math.round((totalCheckIns / startedSet.size) * 10) / 10 : null;

  const challengeStart = window.startAt.toISOString();
  const challengeEnd = window.endAtExclusive.toISOString();

  let challengeAnnouncements = 0;
  let communityAnnouncementsDuringChallenge = 0;
  if (row.community_id) {
    const { count: chAnn } = await admin
      .from("creator_announcements")
      .select("*", { count: "exact", head: true })
      .eq("challenge_id", challengeId);
    challengeAnnouncements = chAnn ?? 0;

    const { count: commAnn } = await admin
      .from("creator_announcements")
      .select("*", { count: "exact", head: true })
      .eq("community_id", row.community_id)
      .gte("publish_at", challengeStart)
      .lt("publish_at", challengeEnd);
    communityAnnouncementsDuringChallenge = commAnn ?? 0;
  }

  let coaching: ChallengeReportPayload["coaching"] = {
    status: "unavailable",
    totalCommunityLinkClicksDuringChallenge: null,
    uniqueCommunityLinkClickDays: null,
    message:
      "Coaching link clicks are tracked at the creator community level, not per challenge. Use Studio → Analytics for all-time link clicks.",
  };

  if (row.community_id) {
    const { data: links } = await admin
      .from("creator_links")
      .select("id")
      .eq("community_id", row.community_id);
    const linkIds = (links ?? []).map((l) => l.id);
    if (linkIds.length) {
      const { data: clicks } = await admin
        .from("creator_link_click_events")
        .select("clicked_at")
        .in("link_id", linkIds)
        .gte("clicked_at", challengeStart)
        .lt("clicked_at", challengeEnd);
      if (clicks?.length) {
        coaching = {
          status: "community_aggregate",
          totalCommunityLinkClicksDuringChallenge: clicks.length,
          uniqueCommunityLinkClickDays: new Set(
            clicks.map((c) => (c.clicked_at as string).slice(0, 10)),
          ).size,
          message:
            "Community-wide link clicks during this challenge window (not verified sales or per-offer attribution).",
        };
      }
    }
  }

  const base: Omit<ChallengeReportPayload, "insights" | "recommendations" | "comparison"> = {
    version: 1,
    challengeId,
    generatedAt: new Date().toISOString(),
    overview: {
      challengeTitle: row.title,
      creatorName,
      startDate: row.start_date,
      endDate: row.end_date,
      durationDays,
      challengeTimezone: tz,
      totalJoined,
      startedParticipating: startedSet.size,
      completedParticipants,
      completionRatePercent,
      completionDefinition: `Completed = activity progress ≥ ${FOUNDER_CHALLENGE_COMPLETION_PERCENT}% (Tavro participant progress, not enrollment alone).`,
      totalCheckIns,
      totalScheduleActivityCompletions,
    },
    engagement: {
      daily,
      averageCheckInsPerParticipant,
      peakDayLabel,
      peakDayActive,
    },
    community: {
      challengeAnnouncements,
      communityAnnouncementsDuringChallenge,
      note: "Aggregate announcement counts only — no private group chats or personal reflections.",
    },
    coaching,
  };

  const insights = buildInsights(base);
  const recommendations = buildRecommendations(base.overview, insights, base.community);

  let comparison: ChallengeReportComparison | null = null;
  if (previousReport) {
    const prev = previousReport.overview;
    const cur = base.overview;
    comparison = {
      previousChallengeId: previousReport.challengeId,
      previousChallengeTitle: prev.challengeTitle,
      participantsChangePercent: pctChange(cur.totalJoined, prev.totalJoined),
      completionRateChangePoints:
        cur.completionRatePercent != null && prev.completionRatePercent != null
          ? cur.completionRatePercent - prev.completionRatePercent
          : null,
      avgDailyActiveChangePercent: (() => {
        const avg = (dailyRows: typeof daily) =>
          dailyRows.length
            ? dailyRows.reduce((s, d) => s + d.activeParticipants, 0) / dailyRows.length
            : 0;
        const cAvg = avg(base.engagement.daily);
        const pAvg = avg(previousReport.engagement.daily);
        return pctChange(cAvg, pAvg);
      })(),
      totalCheckInsChangePercent: pctChange(cur.totalCheckIns, prev.totalCheckIns),
    };
  }

  return {
    ...base,
    insights,
    recommendations,
    comparison,
  };
}

export async function findPreviousCompletedReport(
  creatorId: string,
  beforeEndDate: string,
  excludeChallengeId: string,
): Promise<ChallengeReportPayload | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: prevCh } = await admin
    .from("challenges")
    .select("id, end_date")
    .eq("created_by", creatorId)
    .eq("visibility", "public")
    .neq("publish_status", "draft")
    .neq("id", excludeChallengeId)
    .lt("end_date", beforeEndDate)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prevCh) return null;

  const { data: reportRow } = await admin
    .from("creator_challenge_reports")
    .select("report")
    .eq("challenge_id", prevCh.id)
    .maybeSingle();

  if (reportRow?.report) {
    return reportRow.report as ChallengeReportPayload;
  }

  try {
    return await computeChallengeReport(prevCh.id, null);
  } catch {
    return null;
  }
}

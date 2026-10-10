import { FOUNDER_CHALLENGE_COMPLETION_PERCENT } from "@/lib/analytics/constants";
import {
  challengeDateKeyForDay,
  challengeTotalDaysFromDates,
} from "@/lib/timezone/challenge-calendar";
import { buildCreatorChallengeWindow } from "@/lib/challenge-lifecycle/creator-windows";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildDailyEngagementTrend,
  buildInsightsV2,
  buildRecommendationsV2,
} from "@/lib/challenge-report/insights";
import type {
  AnyChallengeReportPayload,
  ChallengeReportAcquisitionSource,
  ChallengeReportComparison,
  ChallengeReportPayloadV2,
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

type ParticipantRow = {
  user_id: string;
  progress_percent: number | null;
  join_source: string | null;
  referrer_user_id: string | null;
  is_new_platform_user_at_join: boolean | null;
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

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function classifyAcquisition(p: ParticipantRow): ChallengeReportAcquisitionSource["key"] {
  if (p.referrer_user_id) return "participant_referral";
  switch (p.join_source) {
    case "challenge_landing":
      return "challenge_page";
    case "creator_page":
      return "creator_page";
    case "in_app":
      return "in_app_discovery";
    default:
      return "unknown";
  }
}

const SOURCE_LABELS: Record<ChallengeReportAcquisitionSource["key"], string> = {
  challenge_page: "Challenge page",
  creator_page: "Creator page",
  in_app_discovery: "In-app discovery",
  participant_referral: "Participant referral",
  unknown: "Unknown / not recorded",
};

function buildDailySeries(
  startDate: string,
  durationDays: number,
  checkInRows: { user_id: string; check_in_date: string }[],
  scheduleRows: { user_id: string; completed_on: string }[],
): ChallengeReportPayloadV2["dailyEngagement"]["daily"] {
  const daily: ChallengeReportPayloadV2["dailyEngagement"]["daily"] = [];
  for (let day = 1; day <= durationDays; day++) {
    const dateKey = challengeDateKeyForDay(startDate, day);
    const active = new Set<string>();
    for (const r of checkInRows) {
      if (r.check_in_date === dateKey) active.add(r.user_id);
    }
    for (const r of scheduleRows) {
      if (r.completed_on === dateKey) active.add(r.user_id);
    }
    const checkIns = checkInRows.filter((r) => r.check_in_date === dateKey).length;
    const d = new Date(`${dateKey}T12:00:00Z`);
    daily.push({
      dateKey,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      activeParticipants: active.size,
      checkIns,
    });
  }
  return daily;
}

function comparisonFromPrevious(
  current: ChallengeReportPayloadV2,
  previous: AnyChallengeReportPayload,
): ChallengeReportComparison {
  const prevOverview =
    previous.version === 2
      ? {
          title: previous.overview.challengeTitle,
          start: previous.overview.startDate,
          end: previous.overview.endDate,
          duration: previous.overview.durationDays,
          joined: Number(previous.overview.totalJoined.value),
          completionRate: previous.progress.completionRatePercent,
          avgProgress: previous.progress.averageProgressPercent,
          daily: previous.dailyEngagement.daily,
          checkIns: Number(previous.activity.totalCheckIns.value),
          coachingClicks: previous.coaching.programLinkClicks,
        }
      : {
          title: previous.overview.challengeTitle,
          start: previous.overview.startDate,
          end: previous.overview.endDate,
          duration: previous.overview.durationDays,
          joined: previous.overview.totalJoined,
          completionRate: previous.overview.completionRatePercent,
          avgProgress: null,
          daily: previous.engagement.daily,
          checkIns: previous.overview.totalCheckIns,
          coachingClicks: previous.coaching.totalCommunityLinkClicksDuringChallenge,
        };

  const cur = current;
  const curJoined = Number(cur.overview.totalJoined.value);
  const avgDaily = (daily: { activeParticipants: number }[]) =>
    daily.length
      ? daily.reduce((s, d) => s + d.activeParticipants, 0) / daily.length
      : 0;

  let comparisonNote: string | null = null;
  if (cur.overview.durationDays !== prevOverview.duration) {
    comparisonNote = `Previous challenge was ${prevOverview.duration} days; this one was ${cur.overview.durationDays} days — compare daily active participants rather than totals alone.`;
  }

  return {
    previousChallengeId: previous.challengeId,
    previousChallengeTitle: prevOverview.title,
    previousStartDate: prevOverview.start,
    previousEndDate: prevOverview.end,
    previousDurationDays: prevOverview.duration,
    participantsChangePercent: pctChange(curJoined, prevOverview.joined),
    completionRateChangePoints:
      cur.progress.completionRatePercent != null && prevOverview.completionRate != null
        ? cur.progress.completionRatePercent - prevOverview.completionRate
        : null,
    avgProgressChangePoints:
      cur.progress.averageProgressPercent != null && prevOverview.avgProgress != null
        ? Math.round(cur.progress.averageProgressPercent - prevOverview.avgProgress)
        : null,
    avgDailyActiveChangePercent: pctChange(
      avgDaily(cur.dailyEngagement.daily),
      avgDaily(prevOverview.daily),
    ),
    totalCheckInsChangePercent: pctChange(
      Number(cur.activity.totalCheckIns.value),
      prevOverview.checkIns,
    ),
    coachingClicksChangePercent: (() => {
      const curC = cur.coaching.programLinkClicks;
      const prevC = prevOverview.coachingClicks;
      if (curC == null || prevC == null) return null;
      return pctChange(curC, prevC);
    })(),
    comparisonNote,
  };
}

export async function computeChallengeReport(
  challengeId: string,
  previousReport: AnyChallengeReportPayload | null,
): Promise<ChallengeReportPayloadV2> {
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

  const { data: participantsRaw } = await admin
    .from("challenge_participants")
    .select(
      "user_id, progress_percent, join_source, referrer_user_id, is_new_platform_user_at_join",
    )
    .eq("challenge_id", challengeId);

  const participantRows = (participantsRaw ?? []) as ParticipantRow[];
  const totalJoined = participantRows.length;
  const progressValues = participantRows.map((p) => p.progress_percent ?? 0);
  const reached80Count = progressValues.filter(
    (p) => p >= FOUNDER_CHALLENGE_COMPLETION_PERCENT,
  ).length;
  const completionRatePercent =
    totalJoined > 0 ? Math.round((reached80Count / totalJoined) * 100) : null;

  const { data: checkInRows } = await admin
    .from("challenge_daily_check_ins")
    .select("user_id, check_in_date")
    .eq("challenge_id", challengeId);

  const { data: scheduleRows } = await admin
    .from("challenge_schedule_completions")
    .select("user_id, completed_on")
    .eq("challenge_id", challengeId);

  const checkIns = checkInRows ?? [];
  const schedules = scheduleRows ?? [];

  const startedSet = new Set<string>();
  for (const r of checkIns) startedSet.add(r.user_id);
  for (const r of schedules) startedSet.add(r.user_id);

  const totalCheckIns = checkIns.length;
  const totalScheduleCompletions = schedules.length;

  const daily = buildDailySeries(row.start_date, durationDays, checkIns, schedules);

  let peakDayLabel: string | null = null;
  let peakDayActive = 0;
  for (const d of daily) {
    if (d.activeParticipants > peakDayActive) {
      peakDayActive = d.activeParticipants;
      peakDayLabel = d.label;
    }
  }

  const { data: scheduleItems } = await admin
    .from("challenge_schedule_items")
    .select("is_rest")
    .eq("challenge_id", challengeId);

  const plannedActivityDays = (scheduleItems ?? []).filter((i) => !i.is_rest).length;
  const restDaysInSchedule = (scheduleItems ?? []).filter((i) => i.is_rest).length;

  const challengeStart = window.startAt.toISOString();
  const challengeEnd = window.endAtExclusive.toISOString();

  let challengeAnnouncements = 0;
  let communityAnnouncementsDuringChallenge = 0;
  let chatMessagesDuringChallenge = 0;

  if (row.community_id) {
    const [{ count: chAnn }, { count: commAnn }, { count: chatCount }] = await Promise.all([
      admin
        .from("creator_announcements")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId),
      admin
        .from("creator_announcements")
        .select("*", { count: "exact", head: true })
        .eq("community_id", row.community_id)
        .gte("publish_at", challengeStart)
        .lt("publish_at", challengeEnd),
      admin
        .from("challenge_messages")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId)
        .gte("created_at", challengeStart)
        .lt("created_at", challengeEnd),
    ]);
    challengeAnnouncements = chAnn ?? 0;
    communityAnnouncementsDuringChallenge = commAnn ?? 0;
    chatMessagesDuringChallenge = chatCount ?? 0;
  }

  const acquisitionCounts: Record<ChallengeReportAcquisitionSource["key"], number> = {
    challenge_page: 0,
    creator_page: 0,
    in_app_discovery: 0,
    participant_referral: 0,
    unknown: 0,
  };
  for (const p of participantRows) {
    acquisitionCounts[classifyAcquisition(p)] += 1;
  }
  const classifiedParticipants = totalJoined;
  const sources: ChallengeReportAcquisitionSource[] = (
    Object.keys(acquisitionCounts) as ChallengeReportAcquisitionSource["key"][]
  ).map((key) => ({
    key,
    label: SOURCE_LABELS[key],
    count: acquisitionCounts[key],
  }));

  const referralAttributedJoins = participantRows.filter((p) => p.referrer_user_id).length;
  const newPlatformAccountsAtJoin = participantRows.filter(
    (p) => p.is_new_platform_user_at_join === true,
  ).length;

  let programLinkClicks: number | null = null;
  let completionOfferClicks: number | null = null;
  let trackingNote =
    "Link clicks are first-party counts during this challenge window — not verified coaching sales or enquiries.";

  if (row.community_id) {
    const { data: communityRow } = await admin
      .from("creator_communities")
      .select("completion_offer_link_id")
      .eq("id", row.community_id)
      .maybeSingle();

    const { data: links } = await admin
      .from("creator_links")
      .select("id, link_type")
      .eq("community_id", row.community_id);

    const linkList = links ?? [];
    if (linkList.length) {
      const linkIds = linkList.map((l) => l.id);
      const { data: clicks } = await admin
        .from("creator_link_click_events")
        .select("link_id")
        .in("link_id", linkIds)
        .gte("clicked_at", challengeStart)
        .lt("clicked_at", challengeEnd);

      const events = clicks ?? [];
      programLinkClicks = events.length;

      const offerLinkId = communityRow?.completion_offer_link_id as string | null;
      if (offerLinkId) {
        completionOfferClicks = events.filter((e) => e.link_id === offerLinkId).length;
      } else {
        completionOfferClicks = null;
      }
    } else {
      trackingNote = "Not tracked — no creator links configured for this community.";
      programLinkClicks = null;
      completionOfferClicks = null;
    }
  } else {
    trackingNote = "Not tracked — no creator community linked to this challenge.";
  }

  let feedbackList: {
    rating: number;
    what_helped: string | null;
    what_improve: string | null;
    share_written_feedback: boolean;
  }[] = [];
  const { data: feedbackRows, error: feedbackErr } = await admin
    .from("challenge_participant_feedback")
    .select("rating, what_helped, what_improve, share_written_feedback")
    .eq("challenge_id", challengeId);

  if (!feedbackErr) {
    feedbackList = (feedbackRows ?? []) as typeof feedbackList;
  }
  const responseCount = feedbackList.length;
  const ratingDisplaySafe = responseCount >= 3;
  const averageRating = ratingDisplaySafe
    ? Math.round(
        (feedbackList.reduce((s, f) => s + (f.rating as number), 0) / responseCount) * 10,
      ) / 10
    : null;
  const consentedWrittenSamples = feedbackList
    .filter((f) => f.share_written_feedback)
    .map((f) => [f.what_helped, f.what_improve].filter(Boolean).join(" · "))
    .filter((s) => s.length > 0)
    .slice(0, 5);

  const distribution = [
    { label: "0–25%", count: progressValues.filter((p) => p <= 25).length },
    { label: "26–50%", count: progressValues.filter((p) => p > 25 && p <= 50).length },
    { label: "51–79%", count: progressValues.filter((p) => p > 50 && p < FOUNDER_CHALLENGE_COMPLETION_PERCENT).length },
    {
      label: `${FOUNDER_CHALLENGE_COMPLETION_PERCENT}–100%`,
      count: progressValues.filter((p) => p >= FOUNDER_CHALLENGE_COMPLETION_PERCENT).length,
    },
  ];

  const base: Omit<ChallengeReportPayloadV2, "insights" | "recommendations" | "comparison"> = {
    version: 2,
    challengeId,
    generatedAt: new Date().toISOString(),
    snapshotNote:
      "Final snapshot at generation time. Live Studio analytics may differ. Metrics marked “Not tracked” were never measured for this challenge.",
    overview: {
      challengeTitle: row.title,
      creatorName,
      startDate: row.start_date,
      endDate: row.end_date,
      durationDays,
      challengeTimezone: tz,
      totalJoined: {
        value: String(totalJoined),
        hint: "Members who joined this challenge (includes inactive).",
      },
      startedParticipating: {
        value: String(startedSet.size),
        hint: "Distinct participants with at least one daily check-in or scheduled activity completion in this challenge.",
      },
    },
    progress: {
      completionThresholdPercent: FOUNDER_CHALLENGE_COMPLETION_PERCENT,
      reached80Count,
      completedParticipants: {
        value: String(reached80Count),
        hint: `Participants with stored progress_percent ≥ ${FOUNDER_CHALLENGE_COMPLETION_PERCENT}% (Tavro activity progress, not enrollment alone).`,
      },
      completionRatePercent,
      completionRateHint: `% of joined participants who reached ≥ ${FOUNDER_CHALLENGE_COMPLETION_PERCENT}% progress (denominator: all joined).`,
      averageProgressPercent: progressValues.length
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : null,
      medianProgressPercent: median(progressValues),
      distribution,
    },
    activity: {
      totalCheckIns: {
        value: String(totalCheckIns),
        hint: "Rows in challenge daily check-ins (can exceed one per participant per day if retried).",
      },
      scheduleCompletions: {
        value: String(totalScheduleCompletions),
        hint: "Scheduled activity check-offs in this challenge (excludes private accountability habits).",
      },
      plannedActivityDays,
      restDaysInSchedule,
      averageCheckInsPerActiveParticipant:
        startedSet.size > 0 ? Math.round((totalCheckIns / startedSet.size) * 10) / 10 : null,
    },
    dailyEngagement: {
      daily,
      chartLabel: "Daily active participants",
      trendSummary: buildDailyEngagementTrend(daily),
      peakDayLabel,
      peakDayActive,
    },
    community: {
      challengeAnnouncements,
      communityAnnouncementsDuringChallenge,
      chatMessagesDuringChallenge,
      note: "Public challenge chat and announcements only — not private accountability groups.",
    },
    coaching: {
      programLinkClicks,
      completionOfferClicks,
      uniqueClickers: null,
      trackingNote,
      disclaimer: "Clicks are interest signals, not confirmed coaching purchases or enquiries.",
    },
    acquisition: {
      classifiedParticipants,
      unclassifiedCount: acquisitionCounts.unknown,
      sources,
      note: "Each participant is counted in exactly one source. Referral overrides join page source.",
    },
    growth: {
      referralAttributedJoins,
      newPlatformAccountsAtJoin,
      note: "Growth metrics may overlap with acquisition sources — do not add these to source totals.",
    },
    feedback: {
      responseCount,
      averageRating,
      ratingDisplaySafe,
      consentedWrittenSamples,
      emptyMessage:
        responseCount === 0
          ? "No feedback yet. Participants can optionally rate the challenge after it ends."
          : responseCount < 3
            ? `${responseCount} response(s) — averages hidden until at least 3 responses to protect privacy.`
            : "",
    },
  };

  const insights = buildInsightsV2(base);
  const recommendations = buildRecommendationsV2(base, insights);

  let comparison: ChallengeReportComparison | null = null;
  if (previousReport) {
    comparison = comparisonFromPrevious({ ...base, insights, recommendations, comparison: null }, previousReport);
  }

  return { ...base, insights, recommendations, comparison };
}

export async function findPreviousCompletedReport(
  creatorId: string,
  beforeEndDate: string,
  excludeChallengeId: string,
): Promise<AnyChallengeReportPayload | null> {
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
    .select("payload")
    .eq("challenge_id", prevCh.id)
    .maybeSingle();

  if (reportRow?.payload) {
    return reportRow.payload as AnyChallengeReportPayload;
  }

  try {
    return await computeChallengeReport(prevCh.id, null);
  } catch {
    return null;
  }
}

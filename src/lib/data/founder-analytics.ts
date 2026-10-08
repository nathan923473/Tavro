import {
  FOUNDER_CHALLENGE_COMPLETION_PERCENT,
  ORGANIC_ACQUISITION_SOURCES,
} from "@/lib/analytics/constants";
import {
  type FounderDateRange,
  parseFounderDateRange,
  percentChange,
  safeRate,
} from "@/lib/analytics/date-range";
import { resolveMetricDisplayState } from "@/lib/analytics/founder-metric-display";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  FounderAnalyticsSnapshot,
  FounderEventHealth,
  FounderMetric,
} from "@/types/founder-analytics";

function metric(
  partial: Omit<FounderMetric, "id" | "displayState"> & { id: string },
): FounderMetric {
  return {
    ...partial,
    displayState: resolveMetricDisplayState({
      value: partial.value,
      status: partial.status,
      unavailableReason: partial.unavailableReason,
    }),
  };
}

function bucketCountByUtcDay(
  timestamps: string[],
  rangeStart: Date,
  rangeEnd: Date,
): { date: string; value: number }[] {
  const startKey = rangeStart.toISOString().slice(0, 10);
  const endKey = rangeEnd.toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    if (key < startKey || key > endKey) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: { date: string; value: number }[] = [];
  const cursor = new Date(rangeStart);
  cursor.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(rangeEnd);
  endDay.setUTCHours(0, 0, 0, 0);
  while (cursor <= endDay) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ date: key, value: counts.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

async function fetchEventHealth(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderEventHealth> {
  const start = iso(range.start);
  const end = iso(range.end);

  const { count: totalEvents } = await admin
    .from("platform_analytics_events")
    .select("*", { count: "exact", head: true });

  const { count: eventsInRange } = await admin
    .from("platform_analytics_events")
    .select("*", { count: "exact", head: true })
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  const { data: lastRow } = await admin
    .from("platform_analytics_events")
    .select("occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: typeRows } = await admin
    .from("platform_analytics_events")
    .select("event_type")
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .limit(5000);

  const typeCounts = new Map<string, number>();
  for (const row of typeRows ?? []) {
    typeCounts.set(row.event_type, (typeCounts.get(row.event_type) ?? 0) + 1);
  }
  const topTypes = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([eventType, count]) => ({ eventType, count }));

  return {
    totalEvents: totalEvents ?? 0,
    eventsInRange: eventsInRange ?? 0,
    lastEventAt: lastRow?.occurred_at ?? null,
    topTypes,
  };
}

function iso(d: Date) {
  return d.toISOString();
}

async function schemaReady(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  const { error } = await admin.from("platform_analytics_events").select("id").limit(1);
  return !error;
}

export async function fetchFounderAnalyticsSnapshot(input: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): Promise<FounderAnalyticsSnapshot> {
  const { requireAdmin } = await import("@/lib/auth/require-admin");
  await requireAdmin();

  const range = parseFounderDateRange(input);
  const admin = createAdminClient();
  const emptyRevenue = revenueUnavailableMetrics();

  if (!admin) {
    return {
      schemaReady: false,
      trackingStartedAt: null,
      eventHealth: null,
      range,
      overview: unavailableOverview("Service role not configured."),
      growth: [],
      retention: [],
      defensibility: [],
      revenue: emptyRevenue,
    };
  }

  const ready = await schemaReady(admin);
  if (!ready) {
    return {
      schemaReady: false,
      trackingStartedAt: null,
      eventHealth: null,
      range,
      overview: unavailableOverview("Run migration 023_founder_analytics.sql in Supabase."),
      growth: [],
      retention: [],
      defensibility: [],
      revenue: emptyRevenue,
    };
  }

  const { data: trackingRow } = await admin
    .from("platform_analytics_events")
    .select("occurred_at")
    .order("occurred_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const trackingStartedAt = trackingRow?.occurred_at ?? null;

  const [eventHealth, growth, retention, defensibility, revenue] = await Promise.all([
    fetchEventHealth(admin, range),
    computeGrowthMetrics(admin, range),
    computeRetentionMetrics(admin, range),
    computeDefensibilityMetrics(admin, range),
    computeRevenueMetrics(admin, range),
  ]);

  const overview = pickOverview(growth, retention, defensibility);

  return {
    schemaReady: true,
    trackingStartedAt,
    eventHealth,
    range,
    overview,
    growth,
    retention,
    defensibility,
    revenue,
  };
}

function unavailableOverview(reason: string): FounderMetric[] {
  const base = (id: string, label: string) =>
    metric({
      id,
      label,
      definition: label,
      status: "unavailable",
      value: null,
      previousValue: null,
      changePercent: null,
      unavailableReason: reason,
    });
  return [
    base("new_users_per_creator", "New participants per creator"),
    base("day_7_retention", "Day 7 retention"),
    base("creator_repeat_challenge", "Creator repeat challenge rate"),
    base("participant_referral_rate", "Participant referral rate"),
    base("repeat_challenge_participation", "Repeat challenge participation"),
  ];
}

function pickOverview(
  growth: FounderMetric[],
  retention: FounderMetric[],
  defensibility: FounderMetric[],
): FounderMetric[] {
  const byId = (list: FounderMetric[], id: string) =>
    list.find((m) => m.id === id)!;
  return [
    byId(growth, "new_users_per_creator"),
    byId(retention, "day_7_retention"),
    byId(defensibility, "creator_repeat_challenge"),
    byId(growth, "participant_referral_rate"),
    byId(retention, "repeat_challenge_participation"),
  ];
}

async function computeGrowthMetrics(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric[]> {
  const start = iso(range.start);
  const end = iso(range.end);
  const pStart = iso(range.previousStart);
  const pEnd = iso(range.previousEnd);

  const { data: newAttributed } = await admin
    .from("profiles")
    .select("id, attributed_creator_id")
    .gte("created_at", start)
    .lte("created_at", end)
    .not("attributed_creator_id", "is", null)
    .eq("is_test_account", false)
    .eq("is_admin", false);

  const { data: prevAttributed } = await admin
    .from("profiles")
    .select("id, attributed_creator_id")
    .gte("created_at", pStart)
    .lte("created_at", pEnd)
    .not("attributed_creator_id", "is", null)
    .eq("is_test_account", false)
    .eq("is_admin", false);

  const creatorCounts = new Map<string, number>();
  for (const row of newAttributed ?? []) {
    if (!row.attributed_creator_id) continue;
    creatorCounts.set(
      row.attributed_creator_id,
      (creatorCounts.get(row.attributed_creator_id) ?? 0) + 1,
    );
  }
  const totalAttributed = newAttributed?.length ?? 0;
  const creatorsWithSignups = creatorCounts.size;
  const avgPerCreator =
    creatorsWithSignups > 0 ? totalAttributed / creatorsWithSignups : null;

  const prevTotal = prevAttributed?.length ?? 0;

  const { data: signups } = await admin
    .from("profiles")
    .select("id, signup_acquisition_source, referrer_user_id, created_at")
    .gte("created_at", start)
    .lte("created_at", end)
    .eq("is_test_account", false)
    .eq("is_admin", false);

  const { data: landingEventRows } = await admin
    .from("platform_analytics_events")
    .select("occurred_at")
    .eq("event_type", "challenge_page_viewed")
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .limit(4000);

  const signupSeries = bucketCountByUtcDay(
    (signups ?? []).map((s) => s.created_at as string),
    range.start,
    range.end,
  );
  const landingSeries = bucketCountByUtcDay(
    (landingEventRows ?? []).map((r) => r.occurred_at as string),
    range.start,
    range.end,
  );

  const eligibleParticipants = await countEligibleReferrers(admin, end);
  const referrersWithSuccess = new Set(
    (signups ?? [])
      .filter((s) => s.referrer_user_id)
      .map((s) => s.referrer_user_id as string),
  ).size;
  const referralSignups = (signups ?? []).filter((s) => s.referrer_user_id).length;

  const { count: landingViews } = await admin
    .from("platform_analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "challenge_page_viewed")
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  const { count: signupsFromLanding } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start)
    .lte("created_at", end)
    .not("attributed_challenge_id", "is", null)
    .eq("is_test_account", false);

  const organicCount = (signups ?? []).filter((s) =>
    ORGANIC_ACQUISITION_SOURCES.includes(
      (s.signup_acquisition_source ?? "unknown") as (typeof ORGANIC_ACQUISITION_SOURCES)[number],
    ),
  ).length;
  const knownNonPaid = (signups ?? []).filter(
    (s) => s.signup_acquisition_source && s.signup_acquisition_source !== "paid",
  ).length;

  const invitationOpens = await admin
    .from("platform_analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "referral_link_opened")
    .gte("occurred_at", start)
    .lte("occurred_at", end);

  const kValid = (invitationOpens.count ?? 0) > 0 && eligibleParticipants > 0;
  const kFactor = kValid
    ? (referralSignups / eligibleParticipants) *
      (referralSignups / (invitationOpens.count ?? 1))
    : null;

  return [
    metric({
      id: "new_users_per_creator",
      label: "New users per creator (avg)",
      definition:
        "New registrations with first-touch creator attribution in period, divided by creators who acquired at least one.",
      status: totalAttributed > 0 || creatorsWithSignups > 0 ? "ok" : "partial",
      value: avgPerCreator,
      previousValue: prevTotal > 0 ? prevTotal / Math.max(1, creatorsWithSignups) : 0,
      changePercent: percentChange(avgPerCreator ?? 0, prevTotal / Math.max(1, creatorsWithSignups)),
      unit: "count",
      extra: {
        totalCreatorAttributedSignups: totalAttributed,
        creatorsWithSignups,
      },
      series: signupSeries.some((d) => d.value > 0) ? signupSeries : undefined,
      seriesEmptyReason:
        signupSeries.every((d) => d.value === 0) ? "No new signups in this period." : undefined,
    }),
    metric({
      id: "participant_referral_rate",
      label: "Participant referral rate",
      definition:
        "Participants who referred at least one new signup ÷ eligible participants (joined before period end).",
      status: "partial",
      value: safeRate(referrersWithSuccess, eligibleParticipants),
      previousValue: null,
      changePercent: null,
      unit: "%",
      extra: {
        successfulReferrals: referralSignups,
        referrersWithSuccess,
        eligibleParticipants,
      },
    }),
    metric({
      id: "viral_coefficient",
      label: kValid ? "Viral coefficient (K)" : "Referrals per eligible user",
      definition: kValid
        ? "Avg invitations × conversion to new user (attributed signups)."
        : "Invitation exposure is incomplete — showing successful referral signups per eligible participant instead.",
      status: kValid ? "partial" : "partial",
      value: kValid ? kFactor : safeRate(referralSignups, eligibleParticipants),
      previousValue: null,
      changePercent: null,
      unit: kValid ? "ratio" : "%",
    }),
    metric({
      id: "signup_conversion",
      label: "Challenge landing → signup conversion",
      definition:
        "New accounts with attributed challenge ÷ deduped challenge landing views (daily per visitor). Tracking from migration 023 onward.",
      status: (landingViews ?? 0) > 0 ? "partial" : "unavailable",
      value: safeRate(signupsFromLanding ?? 0, landingViews ?? 0),
      previousValue: null,
      changePercent: null,
      unit: "%",
      unavailableReason:
        (landingViews ?? 0) === 0 ? "No landing views recorded yet for this period." : undefined,
      extra: { landingViews: landingViews ?? 0, signupsFromLanding: signupsFromLanding ?? 0 },
      series: landingSeries.some((d) => d.value > 0) ? landingSeries : undefined,
      seriesEmptyReason:
        (landingViews ?? 0) === 0
          ? "No challenge landing views recorded in this period."
          : undefined,
    }),
    metric({
      id: "organic_acquisition_pct",
      label: "Organic acquisition %",
      definition:
        "Share of new users from known non-paid sources (creator link, referral, direct, organic search). Unknown is excluded from organic.",
      status: (signups?.length ?? 0) > 0 ? "partial" : "unavailable",
      value: safeRate(organicCount, signups?.length ?? 0),
      previousValue: null,
      changePercent: null,
      unit: "%",
      extra: { knownNonPaid, totalSignups: signups?.length ?? 0 },
    }),
  ];
}

async function countEligibleReferrers(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  endIso: string,
) {
  const { count } = await admin
    .from("challenge_participants")
    .select("*", { count: "exact", head: true })
    .lte("joined_at", endIso);
  return count ?? 0;
}

async function computeRetentionMetrics(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric[]> {
  const day7 = await cohortRetention(admin, range, 7);
  const day30 = await cohortRetention(admin, range, 30);
  const dauMau = await computeDauMau(admin, range);
  const completion = await computeChallengeCompletion(admin, range);
  const repeat = await computeRepeatParticipation(admin, range);

  return [day7, day30, dauMau, completion, repeat];
}

async function cohortRetention(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
  dayN: number,
): Promise<FounderMetric> {
  const periodEnd = new Date(range.end);
  const now = new Date();
  if (periodEnd.getTime() > now.getTime()) periodEnd.setTime(now.getTime());

  /** Latest signup date that has had a full day-N window before period end. */
  const matureSignupEnd = new Date(periodEnd);
  matureSignupEnd.setUTCDate(matureSignupEnd.getUTCDate() - dayN);

  if (matureSignupEnd < range.start) {
    return metric({
      id: dayN === 7 ? "day_7_retention" : "day_30_retention",
      label: `Day ${dayN} retention`,
      definition: `Share of users who signed up in the selected period and reached day ${dayN} with meaningful activity on that day.`,
      status: "partial",
      value: null,
      previousValue: null,
      changePercent: null,
      unit: "%",
      unavailableReason: `No signups in ${range.label} are ${dayN}+ days old yet — day-${dayN} retention needs older cohorts. Try 30 or 90 days.`,
      seriesEmptyReason: "Cohort not mature for this date range.",
    });
  }

  const { data: cohort } = await admin
    .from("profiles")
    .select("id, created_at")
    .gte("created_at", iso(range.start))
    .lte("created_at", iso(matureSignupEnd))
    .eq("is_test_account", false)
    .eq("is_admin", false);

  if (!cohort?.length) {
    return metric({
      id: dayN === 7 ? "day_7_retention" : "day_30_retention",
      label: `Day ${dayN} retention`,
      definition: `Share of users who signed up in the selected period and reached day ${dayN} with meaningful activity on that day.`,
      status: "partial",
      value: null,
      previousValue: null,
      changePercent: null,
      unit: "%",
      unavailableReason: "No signups in the mature portion of this period.",
      seriesEmptyReason: "No cohort members to chart.",
    });
  }

  let retained = 0;
  for (const user of cohort) {
    const created = new Date(user.created_at);
    const target = new Date(created);
    target.setUTCDate(target.getUTCDate() + dayN);
    const key = target.toISOString().slice(0, 10);
    if (await userActiveOnDay(admin, user.id, key)) retained += 1;
  }

  const rate = safeRate(retained, cohort.length);
  return metric({
    id: dayN === 7 ? "day_7_retention" : "day_30_retention",
    label: `Day ${dayN} retention`,
    definition: `Users who signed up in range (matured ${dayN}+ days) with meaningful activity on signup day +${dayN}.`,
    status: "partial",
    value: rate,
    previousValue: null,
    changePercent: null,
    unit: "%",
    extra: { cohortSize: cohort.length, retained },
    seriesEmptyReason: "Daily cohort trend coming in a later release.",
  });
}

async function userActiveOnDay(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  dayKey: string,
) {
  const checks = await Promise.all([
    admin
      .from("goal_completions")
      .select("id")
      .eq("user_id", userId)
      .eq("completion_date", dayKey)
      .limit(1),
    admin
      .from("challenge_schedule_completions")
      .select("id")
      .eq("user_id", userId)
      .eq("completed_on", dayKey)
      .limit(1),
    admin
      .from("challenge_daily_check_ins")
      .select("id")
      .eq("user_id", userId)
      .eq("check_in_date", dayKey)
      .limit(1),
  ]);
  return checks.some((c) => (c.data?.length ?? 0) > 0);
}

async function computeDauMau(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric> {
  const startKey = range.start.toISOString().slice(0, 10);
  const endKey = range.end.toISOString().slice(0, 10);

  const { data: goals } = await admin
    .from("goal_completions")
    .select("user_id, completion_date")
    .gte("completion_date", startKey)
    .lte("completion_date", endKey);

  const byDay = new Map<string, Set<string>>();
  for (const row of goals ?? []) {
    const set = byDay.get(row.completion_date) ?? new Set();
    set.add(row.user_id);
    byDay.set(row.completion_date, set);
  }

  const dauValues = [...byDay.values()].map((s) => s.size);
  const avgDau = dauValues.length ? dauValues.reduce((a, b) => a + b, 0) / dauValues.length : 0;
  const mau = new Set((goals ?? []).map((g) => g.user_id)).size;
  const ratio = mau > 0 ? avgDau / mau : null;

  const series = bucketCountByUtcDay(
    (goals ?? []).map((g) => `${g.completion_date}T12:00:00.000Z`),
    range.start,
    range.end,
  );

  return metric({
    id: "dau_mau",
    label: "DAU / MAU (habit completions proxy)",
    definition:
      "Distinct users with habit completions per day (avg) ÷ distinct users in period. Chart: daily active users (habits).",
    status: "partial",
    value: ratio != null ? ratio * 100 : null,
    previousValue: null,
    changePercent: null,
    unit: "%",
    extra: { avgDau: Math.round(avgDau), mau },
    series: series.some((d) => d.value > 0) ? series : undefined,
    seriesEmptyReason: mau === 0 ? "No habit completions in this period." : undefined,
  });
}

async function computeChallengeCompletion(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric> {
  const { data: participants } = await admin
    .from("challenge_participants")
    .select("progress_percent, joined_at, challenge:challenges ( end_at, end_date )")
    .gte("joined_at", iso(range.start))
    .lte("joined_at", iso(range.end));

  let eligible = 0;
  let completed = 0;
  const now = Date.now();
  for (const row of participants ?? []) {
    const ch = Array.isArray(row.challenge) ? row.challenge[0] : row.challenge;
    const endAt = ch?.end_at ? new Date(ch.end_at).getTime() : null;
    const ended =
      endAt != null
        ? endAt <= now
        : ch?.end_date
          ? ch.end_date < new Date().toISOString().slice(0, 10)
          : false;
    if (!ended) continue;
    eligible += 1;
    if ((row.progress_percent ?? 0) >= FOUNDER_CHALLENGE_COMPLETION_PERCENT) completed += 1;
  }

  return metric({
    id: "challenge_completion_rate",
    label: "Challenge completion rate",
    definition: `Ended challenges joined in period: participants with progress ≥ ${FOUNDER_CHALLENGE_COMPLETION_PERCENT}%.`,
    status: eligible > 0 ? "ok" : "partial",
    value: safeRate(completed, eligible),
    previousValue: null,
    changePercent: null,
    unit: "%",
    extra: { eligible, completed },
  });
}

async function computeRepeatParticipation(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric> {
  const matureCutoff = new Date(range.end);
  matureCutoff.setUTCDate(matureCutoff.getUTCDate() - 14);

  const { data: rows } = await admin
    .from("challenge_participants")
    .select("user_id, joined_at")
    .lte("joined_at", iso(matureCutoff));

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  }
  const eligible = [...counts.values()].filter((c) => c >= 1).length;
  const second = [...counts.values()].filter((c) => c >= 2).length;
  const third = [...counts.values()].filter((c) => c >= 3).length;
  const avg =
    eligible > 0
      ? [...counts.values()].reduce((a, b) => a + b, 0) / eligible
      : null;

  return metric({
    id: "repeat_challenge_participation",
    label: "Repeat challenge participation",
    definition:
      "Among participants whose first join was 14+ days before period end: % joining ≥2 challenges (and ≥3).",
    status: eligible > 0 ? "ok" : "partial",
    value: safeRate(second, eligible),
    previousValue: safeRate(third, eligible),
    changePercent: null,
    unit: "%",
    extra: {
      pctSecond: safeRate(second, eligible),
      pctThird: safeRate(third, eligible),
      avgChallengesPerParticipant: avg,
    },
  });
}

async function computeDefensibilityMetrics(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric[]> {
  const { data: published } = await admin
    .from("challenges")
    .select("created_by, published_at, publish_status")
    .eq("publish_status", "published");

  const byCreator = new Map<string, number>();
  for (const ch of published ?? []) {
    byCreator.set(ch.created_by, (byCreator.get(ch.created_by) ?? 0) + 1);
  }
  const creators = byCreator.size;
  const second = [...byCreator.values()].filter((n) => n >= 2).length;
  const third = [...byCreator.values()].filter((n) => n >= 3).length;

  const crossCreator = await computeCrossCreator(admin);
  const engagement = await computeCommunityEngagement(admin, range);
  const audience = await computeAudienceGrowth(admin, range);

  return [
    metric({
      id: "creator_repeat_challenge",
      label: "Creator repeat challenge rate",
      definition: "Approved creators with ≥2 published challenges (and ≥3).",
      status: creators > 0 ? "ok" : "partial",
      value: safeRate(second, creators),
      previousValue: safeRate(third, creators),
      changePercent: null,
      unit: "%",
      extra: { pctSecond: safeRate(second, creators), pctThird: safeRate(third, creators) },
    }),
    metric({
      id: "creator_retention",
      label: "Creator activity (30d)",
      definition:
        "Creators with publish, announcement, or follow-driving event in last 30 days ÷ creators with a published challenge.",
      status: "partial",
      value: null,
      previousValue: null,
      changePercent: null,
      unit: "%",
      unavailableReason: "Use Studio actions + events; refine with monthly cohort chart in v2.",
    }),
    crossCreator,
    engagement,
    audience,
  ];
}

async function computeCrossCreator(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<FounderMetric> {
  const { data: joins } = await admin
    .from("challenge_participants")
    .select("user_id, challenge:challenges ( created_by )");

  const map = new Map<string, Set<string>>();
  for (const j of joins ?? []) {
    const ch = Array.isArray(j.challenge) ? j.challenge[0] : j.challenge;
    if (!ch?.created_by) continue;
    const set = map.get(j.user_id) ?? new Set();
    set.add(ch.created_by);
    map.set(j.user_id, set);
  }
  const participants = map.size;
  const multi = [...map.values()].filter((s) => s.size >= 2).length;
  const avgCreators =
    participants > 0
      ? [...map.values()].reduce((a, s) => a + s.size, 0) / participants
      : null;

  return metric({
    id: "cross_creator_participation",
    label: "Cross-creator participation",
    definition: "Participants who joined challenges from ≥2 distinct creators.",
    status: participants > 0 ? "ok" : "partial",
    value: safeRate(multi, participants),
    previousValue: null,
    changePercent: null,
    unit: "%",
    extra: { avgDistinctCreators: avgCreators },
  });
}

async function computeCommunityEngagement(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric> {
  const start = iso(range.start);
  const end = iso(range.end);
  const startKey = range.start.toISOString().slice(0, 10);
  const endKey = range.end.toISOString().slice(0, 10);
  const { count: checkins } = await admin
    .from("challenge_schedule_completions")
    .select("*", { count: "exact", head: true })
    .gte("completed_on", startKey)
    .lte("completed_on", endKey);

  const { count: habits } = await admin
    .from("goal_completions")
    .select("*", { count: "exact", head: true })
    .gte("completion_date", range.start.toISOString().slice(0, 10))
    .lte("completion_date", range.end.toISOString().slice(0, 10));

  return metric({
    id: "community_engagement",
    label: "Community engagement index",
    definition:
      "Aggregate habit + challenge activity check-ins in period (no private messages or health fields).",
    status: "ok",
    value: (checkins ?? 0) + (habits ?? 0),
    previousValue: null,
    changePercent: null,
    unit: "count",
    extra: { scheduleCheckins: checkins ?? 0, habitCompletions: habits ?? 0 },
  });
}

async function computeAudienceGrowth(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric> {
  const { data: followRows } = await admin
    .from("community_follows")
    .select("created_at")
    .gte("created_at", iso(range.start))
    .lte("created_at", iso(range.end))
    .limit(4000);

  const followSeries = bucketCountByUtcDay(
    (followRows ?? []).map((r) => r.created_at as string),
    range.start,
    range.end,
  );

  return metric({
    id: "creator_audience_growth",
    label: "New creator follows",
    definition: "Net new community follows in period.",
    status: "ok",
    value: followRows?.length ?? 0,
    previousValue: null,
    changePercent: null,
    unit: "count",
    series: followSeries.some((d) => d.value > 0) ? followSeries : undefined,
    seriesEmptyReason:
      (followRows?.length ?? 0) === 0 ? "No new follows in this period." : undefined,
  });
}

function revenueUnavailableMetrics(): FounderMetric[] {
  const reason = "Not yet available — no subscription or billing records.";
  return [
    "mrr",
    "revenue_per_active_creator",
    "creator_paid_conversion",
    "revenue_retention",
    "cac",
  ].map((id) =>
    metric({
      id,
      label: id.replace(/_/g, " "),
      definition: reason,
      status: "unavailable",
      value: null,
      previousValue: null,
      changePercent: null,
      unavailableReason: reason,
    }),
  );
}

async function computeRevenueMetrics(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  range: FounderDateRange,
): Promise<FounderMetric[]> {
  const base = revenueUnavailableMetrics();
  const { data: expenses } = await admin
    .from("founder_acquisition_expenses")
    .select("amount_cents")
    .lte("period_start", range.end.toISOString().slice(0, 10))
    .gte("period_end", range.start.toISOString().slice(0, 10));

  const spendCents = (expenses ?? []).reduce((a, e) => a + e.amount_cents, 0);
  const { count: newUsers } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", iso(range.start))
    .lte("created_at", iso(range.end))
    .eq("is_test_account", false)
    .eq("is_admin", false);

  const cac = newUsers && newUsers > 0 && spendCents > 0 ? spendCents / 100 / newUsers : null;

  return base.map((m) => {
    if (m.id === "cac") {
      return metric({
        id: "cac",
        label: "Customer acquisition cost (CAC)",
        definition:
          "Recorded acquisition expenses ÷ new users in period. Excludes organic time cost; add expenses in founder_acquisition_expenses.",
        status: cac != null ? "partial" : "unavailable",
        value: cac,
        unavailableReason:
          cac == null ? "Add acquisition expenses or wait for signups in range." : undefined,
        unit: "currency",
        previousValue: null,
        changePercent: null,
      });
    }
    const labels: Record<string, string> = {
      mrr: "Monthly recurring revenue (MRR)",
      revenue_per_active_creator: "Revenue per active creator",
      creator_paid_conversion: "Creator paid conversion",
      revenue_retention: "Revenue retention (GRR / NRR)",
    };
    return metric({
      ...m,
      label: labels[m.id] ?? m.label,
    });
  });
}

import { buildCreatorChallengeWindow } from "@/lib/challenge-lifecycle/creator-windows";
import { CREATOR_CHALLENGE_LIMITS } from "@/lib/challenge-lifecycle/config";
import { CHALLENGE_PARTICIPANTS_EMBED } from "@/lib/data/relations";
import { createClient } from "@/lib/supabase/server";
import type {
  ChallengePublishStatus,
  CreatorAnnouncement,
  CreatorLinkAnalytics,
  CreatorLinkRow,
  CreatorStudioChallenge,
  CreatorStudioOverview,
  StudioChallengeBucket,
} from "@/types/creator-studio";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function bucketChallenge(
  publishStatus: ChallengePublishStatus,
  row: {
    start_date: string;
    end_date: string;
    start_at?: string | null;
    end_at?: string | null;
    challenge_timezone?: string | null;
  },
): StudioChallengeBucket {
  if (publishStatus === "draft") return "drafts";
  if (publishStatus === "archived") return "completed";
  const window = buildCreatorChallengeWindow({
    id: "",
    title: "",
    publish_status: publishStatus,
    ...row,
  });
  if (!window) return "drafts";
  if (window.phase === "completed") return "completed";
  if (window.phase === "upcoming") return "upcoming";
  return "active";
}

export function creatorChallengeLimitSummary(windows: ReturnType<typeof buildCreatorChallengeWindow>[]) {
  const published = windows.filter(Boolean) as NonNullable<ReturnType<typeof buildCreatorChallengeWindow>>[];
  let upcoming = 0;
  let active = 0;
  for (const w of published) {
    if (w.phase === "upcoming") upcoming += 1;
    if (w.phase === "active") active += 1;
  }
  return {
    upcoming,
    active,
    maxUpcoming: CREATOR_CHALLENGE_LIMITS.maxUpcomingPublished,
    maxActive: CREATOR_CHALLENGE_LIMITS.maxActivePublished,
  };
}

async function activeParticipantsThisWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
): Promise<number> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const { data: goals } = await supabase
    .from("member_goals")
    .select("id")
    .eq("linked_challenge_id", challengeId);

  const goalIds = (goals ?? []).map((g) => g.id);
  if (!goalIds.length) return 0;

  const { data: completions } = await supabase
    .from("goal_completions")
    .select("user_id")
    .in("goal_id", goalIds)
    .gte("completion_date", weekStartKey);

  return new Set((completions ?? []).map((c) => c.user_id)).size;
}

function mapChallengeRow(
  row: {
    id: string;
    title: string;
    short_description?: string | null;
    invite_slug: string;
    cover_url: string | null;
    start_date: string;
    end_date: string;
    start_at?: string | null;
    end_at?: string | null;
    challenge_timezone?: string | null;
    publish_status?: ChallengePublishStatus | null;
    category?: string | null;
    participants?: { count: number }[] | null;
  },
  activeThisWeek: number,
): CreatorStudioChallenge {
  const publishStatus = (row.publish_status ?? "published") as ChallengePublishStatus;
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description ?? null,
    inviteSlug: row.invite_slug,
    coverUrl: row.cover_url,
    startDate: row.start_date,
    endDate: row.end_date,
    startAt: row.start_at ?? null,
    endAt: row.end_at ?? null,
    challengeTimezone: row.challenge_timezone ?? null,
    publishStatus,
    category: (row.category as CreatorStudioChallenge["category"]) ?? null,
    participantCount: row.participants?.[0]?.count ?? 0,
    activeThisWeek,
    bucket: bucketChallenge(publishStatus, row),
  };
}

export async function fetchCreatorStudioChallenges(
  userId: string,
): Promise<CreatorStudioChallenge[]> {
  const supabase = await createClient();

  const fullSelect = `
    id, title, short_description, invite_slug, cover_url, start_date, end_date,
    start_at, end_at, challenge_timezone, publish_status, category,
    participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
  `;
  const legacySelect = `
    id, title, invite_slug, cover_url, start_date, end_date,
    start_at, end_at, challenge_timezone,
    participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
  `;

  let { data: rows, error } = await supabase
    .from("challenges")
    .select(fullSelect)
    .eq("created_by", userId)
    .eq("visibility", "public")
    .order("start_date", { ascending: false });

  if (error && /publish_status|short_description|category|schema cache/i.test(error.message)) {
    const legacy = await supabase
      .from("challenges")
      .select(legacySelect)
      .eq("created_by", userId)
      .eq("visibility", "public")
      .order("start_date", { ascending: false });
    rows = (legacy.data ?? null) as typeof rows;
  }

  const list = rows ?? [];
  const mapped = await Promise.all(
    list.map(async (row) => {
      const activeThisWeek = await activeParticipantsThisWeek(supabase, row.id);
      return mapChallengeRow(row as Parameters<typeof mapChallengeRow>[0], activeThisWeek);
    }),
  );
  return mapped;
}

export async function fetchCreatorStudioOverview(
  userId: string,
): Promise<CreatorStudioOverview> {
  const supabase = await createClient();
  const empty: CreatorStudioOverview = {
    communityName: null,
    communitySlug: null,
    totalFollowers: 0,
    newFollowersThisMonth: 0,
    newFollowersThisWeek: 0,
    activeChallengeCount: 0,
    totalRegistrations: 0,
    activeParticipantsTotal: 0,
    totalLinkClicks: null,
    currentChallenge: null,
    upcomingChallenge: null,
    otherActiveChallenges: [],
    growthByWeek: [],
    recentActivity: [],
  };

  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, slug, community_name")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!community) return empty;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [{ count: totalFollowers }, { count: monthFollows }, { count: weekFollows }] =
    await Promise.all([
      supabase
        .from("community_follows")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community.id),
      supabase
        .from("community_follows")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community.id)
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("community_follows")
        .select("*", { count: "exact", head: true })
        .eq("community_id", community.id)
        .gte("created_at", weekStart.toISOString()),
    ]);

  const challenges = await fetchCreatorStudioChallenges(userId);
  const active = challenges.filter((c) => c.bucket === "active");
  const [current, ...rest] = active;
  const upcomingSorted = challenges
    .filter((c) => c.bucket === "upcoming")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const upcomingChallenge = upcomingSorted[0] ?? null;
  const totalRegistrations = challenges.reduce((s, c) => s + c.participantCount, 0);
  const activeParticipantsTotal = active.reduce((s, c) => s + c.participantCount, 0);

  let totalLinkClicks: number | null = null;
  try {
    const linkAnalytics = await fetchCreatorLinkAnalytics(userId);
    if (linkAnalytics) totalLinkClicks = linkAnalytics.totalClicks;
  } catch {
    totalLinkClicks = null;
  }

  const growthByWeek: CreatorStudioOverview["growthByWeek"] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const { count } = await supabase
      .from("community_follows")
      .select("*", { count: "exact", head: true })
      .eq("community_id", community.id)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    growthByWeek.push({
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: count ?? 0,
    });
  }

  const { data: recentJoins } = await supabase
    .from("challenges")
    .select(`id, title, ${CHALLENGE_PARTICIPANTS_EMBED} ( joined_at )`)
    .eq("community_id", community.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(3);

  const recentActivity: CreatorStudioOverview["recentActivity"] = [];
  for (const ch of recentJoins ?? []) {
    const parts = (ch as { challenge_participants?: { joined_at: string }[] })
      .challenge_participants;
    const latest = parts?.sort(
      (a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
    )[0];
    if (latest) {
      recentActivity.push({
        id: `${ch.id}-join`,
        label: `New participant joined “${(ch as { title: string }).title}”`,
        at: latest.joined_at,
      });
    }
  }

  if ((monthFollows ?? 0) > 0) {
    recentActivity.unshift({
      id: "growth-month",
      label: `${monthFollows} new followers this month`,
      at: new Date().toISOString(),
    });
  }

  return {
    communityName: community.community_name,
    communitySlug: community.slug,
    totalFollowers: totalFollowers ?? 0,
    newFollowersThisMonth: monthFollows ?? 0,
    newFollowersThisWeek: weekFollows ?? 0,
    activeChallengeCount: active.length,
    totalRegistrations,
    activeParticipantsTotal,
    totalLinkClicks,
    currentChallenge: current ?? null,
    upcomingChallenge,
    otherActiveChallenges: rest,
    growthByWeek,
    recentActivity: recentActivity.slice(0, 6),
  };
}

export type CommunityCompletionOfferSettings = {
  enabled: boolean;
  linkId: string | null;
  headline: string;
  message: string;
};

export async function fetchCommunityCompletionOfferSettings(
  communityId: string,
): Promise<CommunityCompletionOfferSettings> {
  const defaults: CommunityCompletionOfferSettings = {
    enabled: false,
    linkId: null,
    headline: "Want more personalised support?",
    message: "Explore my coaching or program for your next goal.",
  };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_communities")
    .select(
      "completion_offer_enabled, completion_offer_link_id, completion_offer_headline, completion_offer_message",
    )
    .eq("id", communityId)
    .maybeSingle();

  if (error || !data) {
    if (error && !/completion_offer|schema cache/i.test(error.message)) {
      console.error("fetchCommunityCompletionOfferSettings:", error.message);
    }
    return defaults;
  }

  return {
    enabled: Boolean(data.completion_offer_enabled),
    linkId: (data.completion_offer_link_id as string | null) ?? null,
    headline:
      (data.completion_offer_headline as string | null)?.trim() || defaults.headline,
    message:
      (data.completion_offer_message as string | null)?.trim() || defaults.message,
  };
}

export async function fetchChallengeCompletionOfferForParticipant(
  communityId: string,
): Promise<{
  headline: string;
  message: string;
  linkLabel: string;
  linkHref: string;
} | null> {
  const supabase = await createClient();
  const { data: community, error } = await supabase
    .from("creator_communities")
    .select(
      "completion_offer_enabled, completion_offer_link_id, completion_offer_headline, completion_offer_message",
    )
    .eq("id", communityId)
    .maybeSingle();

  if (error || !community?.completion_offer_enabled || !community.completion_offer_link_id) {
    return null;
  }

  const { data: link } = await supabase
    .from("creator_links")
    .select("id, label, is_public")
    .eq("id", community.completion_offer_link_id as string)
    .eq("community_id", communityId)
    .maybeSingle();

  if (!link?.is_public) return null;

  const settings = await fetchCommunityCompletionOfferSettings(communityId);

  return {
    headline: settings.headline,
    message: settings.message,
    linkLabel: link.label?.trim() || "Explore offer",
    linkHref: `/out/link/${link.id}`,
  };
}

export async function fetchChallengeReferralJoinAnalytics(ownerId: string): Promise<{
  referralJoins: number;
  referralJoinsLast30Days: number;
}> {
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!community) {
    return { referralJoins: 0, referralJoinsLast30Days: 0 };
  }

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id")
    .eq("community_id", community.id)
    .eq("visibility", "public");

  const ids = (challenges ?? []).map((c) => c.id);
  if (!ids.length) {
    return { referralJoins: 0, referralJoinsLast30Days: 0 };
  }

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);

  const [allTime, last30] = await Promise.all([
    supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .in("challenge_id", ids)
      .not("referrer_user_id", "is", null),
    supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .in("challenge_id", ids)
      .not("referrer_user_id", "is", null)
      .gte("joined_at", monthStart.toISOString()),
  ]);

  if (allTime.error && /referrer_user_id|schema cache/i.test(allTime.error.message)) {
    return { referralJoins: 0, referralJoinsLast30Days: 0 };
  }

  return {
    referralJoins: allTime.count ?? 0,
    referralJoinsLast30Days: last30.count ?? 0,
  };
}

export async function fetchCreatorAnnouncements(
  communityId: string,
): Promise<CreatorAnnouncement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_announcements")
    .select(
      `
      id, title, body, image_url, publish_at, challenge_id,
      challenge:challenges ( title )
    `,
    )
    .eq("community_id", communityId)
    .order("publish_at", { ascending: false })
    .limit(50);

  if (error) return [];

  return (data ?? []).map((row) => {
    const ch = row.challenge as { title: string } | { title: string }[] | null;
    const title = Array.isArray(ch) ? ch[0]?.title : ch?.title;
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      imageUrl: row.image_url,
      publishAt: row.publish_at,
      challengeId: row.challenge_id,
      challengeTitle: title ?? null,
    };
  });
}

export async function fetchCreatorLinks(communityId: string): Promise<CreatorLinkRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_links")
    .select("id, link_type, label, url, sort_order, is_public")
    .eq("community_id", communityId)
    .order("sort_order");

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id,
    linkType: row.link_type,
    label: row.label,
    url: row.url,
    sortOrder: row.sort_order,
    isPublic: row.is_public,
  }));
}

export async function fetchChallengeSchedule(
  challengeId: string,
): Promise<import("@/types/creator-studio").ChallengeScheduleItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenge_schedule_items")
    .select("id, sort_order, day_label, title, body, is_rest, week_theme")
    .eq("challenge_id", challengeId)
    .order("sort_order");

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id,
    sortOrder: row.sort_order,
    dayLabel: row.day_label,
    title: row.title,
    body: row.body,
    isRest: row.is_rest,
    weekTheme: row.week_theme,
  }));
}

export function creatorChallengePath(communitySlug: string, inviteSlug: string) {
  return `/creator/${communitySlug}/challenges/${inviteSlug}`;
}

export async function fetchCreatorLinkAnalytics(
  ownerId: string,
): Promise<CreatorLinkAnalytics | null> {
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!community) return null;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const { data: links, error } = await supabase
    .from("creator_links")
    .select("id, link_type, label, url, sort_order, is_public, click_count")
    .eq("community_id", community.id)
    .order("sort_order");

  if (error) {
    if (/click_count|schema cache/i.test(error.message)) {
      const fallback = await fetchCreatorLinks(community.id);
      return {
        totalClicks: 0,
        clicksLast7Days: 0,
        links: fallback.map((l) => ({
          ...l,
          clickCount: 0,
          clicksLast7Days: 0,
        })),
      };
    }
    return null;
  }

  const linkIds = (links ?? []).map((l) => l.id);
  const clicks7dByLink: Record<string, number> = {};

  if (linkIds.length) {
    const { data: events } = await supabase
      .from("creator_link_click_events")
      .select("link_id")
      .in("link_id", linkIds)
      .gte("clicked_at", weekStart.toISOString());

    for (const e of events ?? []) {
      clicks7dByLink[e.link_id] = (clicks7dByLink[e.link_id] ?? 0) + 1;
    }
  }

  const mapped = (links ?? []).map((row) => ({
    id: row.id,
    linkType: row.link_type,
    label: row.label,
    url: row.url,
    sortOrder: row.sort_order,
    isPublic: row.is_public,
    clickCount: row.click_count ?? 0,
    clicksLast7Days: clicks7dByLink[row.id] ?? 0,
  }));

  return {
    totalClicks: mapped.reduce((s, l) => s + l.clickCount, 0),
    clicksLast7Days: mapped.reduce((s, l) => s + l.clicksLast7Days, 0),
    links: mapped,
  };
}

export async function fetchChallengeJoinAnalytics(ownerId: string): Promise<{
  joinsLast7Days: number;
  joinsLast30Days: number;
  totalJoins: number;
}> {
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!community) {
    return { joinsLast7Days: 0, joinsLast30Days: 0, totalJoins: 0 };
  }

  const { data: challenges } = await supabase
    .from("challenges")
    .select("id")
    .eq("community_id", community.id)
    .eq("visibility", "public");

  const ids = (challenges ?? []).map((c) => c.id);
  if (!ids.length) {
    return { joinsLast7Days: 0, joinsLast30Days: 0, totalJoins: 0 };
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);

  const [total, week, month] = await Promise.all([
    supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .in("challenge_id", ids),
    supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .in("challenge_id", ids)
      .gte("joined_at", weekStart.toISOString()),
    supabase
      .from("challenge_participants")
      .select("*", { count: "exact", head: true })
      .in("challenge_id", ids)
      .gte("joined_at", monthStart.toISOString()),
  ]);

  return {
    totalJoins: total.count ?? 0,
    joinsLast7Days: week.count ?? 0,
    joinsLast30Days: month.count ?? 0,
  };
}

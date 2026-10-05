import { createClient } from "@/lib/supabase/server";
import type {
  ChallengePublishStatus,
  CreatorAnnouncement,
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
  start: string,
  end: string,
): StudioChallengeBucket {
  const today = todayKey();
  if (publishStatus === "draft") return "drafts";
  if (end < today || publishStatus === "archived") return "completed";
  if (start > today) return "upcoming";
  return "active";
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
    publishStatus,
    category: (row.category as CreatorStudioChallenge["category"]) ?? null,
    participantCount: row.participants?.[0]?.count ?? 0,
    activeThisWeek,
    bucket: bucketChallenge(publishStatus, row.start_date, row.end_date),
  };
}

export async function fetchCreatorStudioChallenges(
  userId: string,
): Promise<CreatorStudioChallenge[]> {
  const supabase = await createClient();

  const fullSelect = `
    id, title, short_description, invite_slug, cover_url, start_date, end_date,
    publish_status, category,
    participants:challenge_participants ( count )
  `;
  const legacySelect = `
    id, title, invite_slug, cover_url, start_date, end_date,
    participants:challenge_participants ( count )
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
    currentChallenge: null,
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
    .select("id, title, challenge_participants ( joined_at )")
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
    currentChallenge: current ?? null,
    otherActiveChallenges: rest,
    growthByWeek,
    recentActivity: recentActivity.slice(0, 6),
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

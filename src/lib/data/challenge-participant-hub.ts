import { challengeTotalDays } from "@/lib/challenge-day";
import { parseScheduleItemActivities, type ParsedDailyActivity } from "@/lib/challenge-activities";
import {
  fetchChallengeCompletionOfferForParticipant,
  fetchChallengeSchedule,
} from "@/lib/data/creator-studio";
import { fetchChallengeGalleryDetailsMap } from "@/lib/data/challenge-media";
import { CHALLENGE_PARTICIPANTS_EMBED, unwrapOne } from "@/lib/data/relations";
import { createClient } from "@/lib/supabase/server";
import {
  challengeDateKeyForDay,
  challengeDayIndexInZone,
  challengePhaseFromInstants,
  challengeTodayDateKey,
} from "@/lib/timezone/challenge-calendar";
import { resolveChallengeEndAt, resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import type { ChallengeCategory } from "@/types/creator-studio";

export type HubActivityState = ParsedDailyActivity & {
  completed: boolean;
  progressNumber: number | null;
};

export type HubScheduleDay = {
  dayIndex: number;
  scheduleItemId: string;
  dayLabel: string;
  /** Calendar date (UTC key) this plan day maps to. */
  completedOn: string;
  isRest: boolean;
  activities: HubActivityState[];
  allComplete: boolean;
};

export type ChallengeMemberRow = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string | null;
  progressPercent: number | null;
  checkedInToday: boolean;
  role: "host" | "member";
};

export type ChallengeParticipantHub = {
  challengeId: string;
  inviteSlug: string;
  title: string;
  description: string;
  shortDescription: string | null;
  goalDescription: string | null;
  category: ChallengeCategory | null;
  coverUrl: string | null;
  creatorName: string;
  creatorId: string;
  communitySlug: string | null;
  communityName: string | null;
  communityAvatarUrl: string | null;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  challengeTimezone: string;
  participantTimezone: string;
  participants: number;
  dayIndex: number;
  totalDays: number;
  progressPercent: number;
  streakDays: number;
  phase: "upcoming" | "active" | "completed";
  daysUntilStart: number;
  todayKey: string;
  todayActivities: HubActivityState[];
  todayLabel: string;
  scheduleItemId: string | null;
  isRestDay: boolean;
  creatorMessage: { title: string; body: string } | null;
  todayMood: string | null;
  todayNote: string | null;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    publishAt: string;
  }>;
  schedule: Array<{
    id: string;
    sortOrder: number;
    dayLabel: string;
    title: string;
    body: string | null;
    isRest: boolean;
    weekTheme: string | null;
  }>;
  dayCompletionMap: Record<number, boolean>;
  /** One entry per challenge day with check-off state for each habit. */
  scheduleDays: HubScheduleDay[];
  milestones: Array<{ key: string; label: string; earned: boolean }>;
  completedDaysCount: number;
  bestStreak: number;
  canonicalPath: string;
  /** Logged-in user created this challenge (may not be in challenge_participants). */
  isOwner: boolean;
  members: ChallengeMemberRow[];
  /** Optional creator coaching offer after challenge completion. */
  completionOffer: {
    headline: string;
    message: string;
    linkLabel: string;
    linkHref: string;
  } | null;
};

function scheduleItemForDay(
  schedule: Awaited<ReturnType<typeof fetchChallengeSchedule>>,
  dayIndex: number,
) {
  return (
    schedule.find((s, i) => i + 1 === dayIndex || s.sortOrder + 1 === dayIndex) ??
    schedule[Math.min(dayIndex - 1, schedule.length - 1)] ??
    null
  );
}

export async function fetchChallengeParticipantHub(
  challengeId: string,
  userId: string,
): Promise<ChallengeParticipantHub | null> {
  const supabase = await createClient();
  const now = new Date();

  type HubChallengeRow = {
    id: string;
    title: string;
    description: string | null;
    short_description: string | null;
    goal_description: string | null;
    category: string | null;
    start_date: string;
    end_date: string;
    start_at?: string | null;
    end_at?: string | null;
    challenge_timezone?: string | null;
    invite_slug: string;
    cover_url: string | null;
    created_by: string;
    community_id: string | null;
    creator:
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    community:
      | {
          slug: string;
          community_name: string;
          avatar_url: string | null;
          owner_id: string;
        }
      | {
          slug: string;
          community_name: string;
          avatar_url: string | null;
          owner_id: string;
        }[]
      | null;
    participants: { count: number }[] | null;
  };

  let ch: HubChallengeRow | null = null;
  const fullSelect = `
      id, title, description, short_description, goal_description, category,
      start_date, end_date, start_at, end_at, challenge_timezone, schedule_mode,
      invite_slug, cover_url, created_by, community_id, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      community:creator_communities ( slug, community_name, avatar_url, owner_id ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
    `;
  const legacySelect = `
      id, title, description, short_description, goal_description, category,
      start_date, end_date, invite_slug, cover_url, created_by, community_id, visibility,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      community:creator_communities ( slug, community_name, avatar_url, owner_id ),
      participants:${CHALLENGE_PARTICIPANTS_EMBED} ( count )
    `;
  const first = await supabase.from("challenges").select(fullSelect).eq("id", challengeId).maybeSingle();
  if (
    first.error &&
    /start_at|challenge_timezone|schedule_mode|schema cache/i.test(first.error.message)
  ) {
    const legacy = await supabase.from("challenges").select(legacySelect).eq("id", challengeId).maybeSingle();
    ch = legacy.data as HubChallengeRow | null;
  } else {
    if (first.error) throw new Error(first.error.message);
    ch = first.data as HubChallengeRow | null;
  }
  if (!ch) return null;

  const startDate = ch.start_date;
  const endDate = ch.end_date;
  const challengeTimezone = normalizeTimezone(
    (ch.challenge_timezone as string | null) ?? null,
    DEFAULT_FALLBACK_TIMEZONE,
  );
  const startAt = resolveChallengeStartAt({
    start_date: startDate,
    start_at: ch.start_at as string | null,
    challenge_timezone: challengeTimezone,
  });
  const endAt = resolveChallengeEndAt({
    end_date: endDate,
    end_at: ch.end_at as string | null,
    challenge_timezone: challengeTimezone,
  });

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const participantTimezone = normalizeTimezone(viewerProfile?.timezone, DEFAULT_FALLBACK_TIMEZONE);

  const today = challengeTodayDateKey(now, challengeTimezone);

  const community = unwrapOne(ch.community);
  const createdBy = ch.created_by;
  const isOwner =
    createdBy === userId ||
    (community?.owner_id != null && community.owner_id === userId);

  const { data: membership } = await supabase
    .from("challenge_participants")
    .select("progress_percent")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();
  if ((ch as { visibility?: string }).visibility === "private" && !membership && !isOwner) {
    return null;
  }
  if (!membership && !isOwner) return null;

  const schedule = await fetchChallengeSchedule(challengeId);
  const totalDays = challengeTotalDays(startDate, endDate);
  const rawDayIndex = challengeDayIndexInZone(startDate, challengeTimezone, now);
  const dayIndex = Math.min(Math.max(rawDayIndex, 1), totalDays);

  const phase = challengePhaseFromInstants(startAt, endAt, now);
  const daysUntilStart =
    phase === "upcoming"
      ? Math.max(0, Math.ceil((startAt.getTime() - now.getTime()) / 86_400_000))
      : 0;

  const effectiveDayIndex = phase === "upcoming" ? 1 : dayIndex;
  const scheduleItem =
    phase === "completed"
      ? null
      : scheduleItemForDay(schedule, phase === "active" ? dayIndex : effectiveDayIndex);
  const activityDateKey =
    phase === "upcoming"
      ? challengeDateKeyForDay(startDate, effectiveDayIndex)
      : today;

  const { data: completionRows } = await supabase
    .from("challenge_schedule_completions")
    .select("schedule_item_id, completed_on, activity_key, progress_number")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId);

  const { data: checkIn } = await supabase
    .from("challenge_daily_check_ins")
    .select("mood, note")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .eq("check_in_date", today)
    .maybeSingle();

  const category = (ch.category as ChallengeCategory | null) ?? null;
  const parsed = scheduleItem
    ? parseScheduleItemActivities(
        scheduleItem.id,
        scheduleItem.title,
        scheduleItem.body,
        scheduleItem.isRest,
        category,
      )
    : [];

  const todayActivities: HubActivityState[] = parsed.map((a) => {
    const row = (completionRows ?? []).find(
      (c) =>
        c.schedule_item_id === scheduleItem?.id &&
        c.completed_on === activityDateKey &&
        (c.activity_key ?? "primary") === a.key,
    );
    return {
      ...a,
      completed: Boolean(row),
      progressNumber: row?.progress_number != null ? Number(row.progress_number) : null,
    };
  });

  function activitiesForScheduleItem(
    item: NonNullable<ReturnType<typeof scheduleItemForDay>>,
    dayDate: string,
  ): HubActivityState[] {
    const acts = parseScheduleItemActivities(
      item.id,
      item.title,
      item.body,
      item.isRest,
      category,
    );
    return acts.map((a) => {
      const row = (completionRows ?? []).find(
        (c) =>
          c.schedule_item_id === item.id &&
          c.completed_on === dayDate &&
          (c.activity_key ?? "primary") === a.key,
      );
      return {
        ...a,
        completed: Boolean(row),
        progressNumber: row?.progress_number != null ? Number(row.progress_number) : null,
      };
    });
  }

  function isDayAllComplete(
    item: NonNullable<ReturnType<typeof scheduleItemForDay>>,
    activities: HubActivityState[],
  ) {
    if (item.isRest) return false;
    const required = activities.filter((a) => a.kind !== "custom" || a.key === "primary");
    return required.length > 0 && required.every((a) => a.completed);
  }

  const dayCompletionMap: Record<number, boolean> = {};
  const scheduleDays: HubScheduleDay[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const item = scheduleItemForDay(schedule, d);
    if (!item) {
      dayCompletionMap[d] = false;
      continue;
    }
    const dayDate = challengeDateKeyForDay(startDate, d);
    const activities = activitiesForScheduleItem(item, dayDate);
    const allComplete = isDayAllComplete(item, activities);
    dayCompletionMap[d] = allComplete;
    scheduleDays.push({
      dayIndex: d,
      scheduleItemId: item.id,
      dayLabel: item.dayLabel,
      completedOn: dayDate,
      isRest: item.isRest,
      activities,
      allComplete,
    });
  }

  const completedDaysCount = Object.values(dayCompletionMap).filter(Boolean).length;
  const { streakDays, bestStreak } = streakFromCompletions(completionRows ?? [], today);

  let creatorMessage: { title: string; body: string } | null = null;
  const announcements: ChallengeParticipantHub["announcements"] = [];
  if (ch.community_id) {
    const { data: anns } = await supabase
      .from("creator_announcements")
      .select("id, title, body, publish_at")
      .eq("community_id", ch.community_id)
      .or(`challenge_id.eq.${challengeId},challenge_id.is.null`)
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false })
      .limit(20);
    for (const a of anns ?? []) {
      announcements.push({
        id: a.id,
        title: a.title,
        body: a.body,
        publishAt: a.publish_at,
      });
    }
    creatorMessage = announcements[0]
      ? { title: announcements[0].title, body: announcements[0].body }
      : null;
  }

  const gallery = await fetchChallengeGalleryDetailsMap([challengeId]);
  const coverUrl = ch.cover_url ?? gallery[challengeId]?.[0]?.imageUrl ?? null;

  const milestones = [
    { key: "first_day", label: "🏆 First day completed", earned: completedDaysCount >= 1 },
    { key: "streak_7", label: "🔥 7 consistent days", earned: bestStreak >= 7 },
    { key: "halfway", label: "⭐ Halfway there", earned: completedDaysCount >= Math.floor(totalDays / 2) },
    {
      key: "complete",
      label: "🏁 Challenge completed",
      earned: phase === "completed" && completedDaysCount >= Math.floor(totalDays * 0.5),
    },
  ];

  const canonicalPath = community?.slug
    ? `/creator/${community.slug}/challenges/${ch.invite_slug}`
    : `/join/${ch.invite_slug}`;

  const creatorDisplayName = unwrapOne(ch.creator)?.display_name ?? "Creator";
  const members = await fetchChallengeMemberRows(
    supabase,
    challengeId,
    createdBy,
    creatorDisplayName,
    today,
  );

  if (phase === "completed" && (membership?.progress_percent ?? 0) >= 50) {
    await supabase.from("member_milestones").upsert(
      { user_id: userId, milestone_key: "first_challenge" },
      { onConflict: "user_id,milestone_key", ignoreDuplicates: true },
    );
  }

  let completionOffer: ChallengeParticipantHub["completionOffer"] = null;
  if (phase === "completed" && ch.community_id) {
    try {
      completionOffer = await fetchChallengeCompletionOfferForParticipant(ch.community_id);
    } catch {
      completionOffer = null;
    }
  }

  return {
    challengeId,
    inviteSlug: ch.invite_slug,
    title: ch.title,
    description: ch.description ?? "",
    shortDescription: ch.short_description,
    goalDescription: ch.goal_description,
    category,
    coverUrl,
    creatorName: unwrapOne(ch.creator)?.display_name ?? "Creator",
    creatorId: createdBy,
    communitySlug: community?.slug ?? null,
    communityName: community?.community_name ?? null,
    communityAvatarUrl: community?.avatar_url ?? null,
    startDate,
    endDate,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    challengeTimezone,
    participantTimezone,
    participants: ch.participants?.[0]?.count ?? 0,
    dayIndex: effectiveDayIndex,
    totalDays,
    progressPercent: membership?.progress_percent ?? 0,
    streakDays,
    phase,
    daysUntilStart,
    todayKey: activityDateKey,
    todayActivities,
    todayLabel:
      phase === "upcoming"
        ? `DAY 1 PREVIEW · ${new Date(`${activityDateKey}T12:00:00Z`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}`
        : new Date(`${today}T12:00:00Z`).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
          }).toUpperCase(),
    scheduleItemId: scheduleItem?.id ?? null,
    isRestDay: scheduleItem?.isRest ?? false,
    creatorMessage,
    todayMood: checkIn?.mood ?? null,
    todayNote: checkIn?.note ?? null,
    announcements,
    schedule: schedule.map((s) => ({
      id: s.id,
      sortOrder: s.sortOrder,
      dayLabel: s.dayLabel,
      title: s.title,
      body: s.body,
      isRest: s.isRest,
      weekTheme: s.weekTheme,
    })),
    dayCompletionMap,
    scheduleDays,
    milestones,
    completedDaysCount,
    bestStreak,
    canonicalPath,
    isOwner,
    members,
    completionOffer,
  };
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function fetchChallengeMemberRows(
  supabase: SupabaseServer,
  challengeId: string,
  creatorId: string,
  creatorDisplayName: string,
  today: string,
): Promise<ChallengeMemberRow[]> {
  type ParticipantRow = {
    user_id: string;
    joined_at: string;
    progress_percent: number | null;
    profile:
      | { display_name: string | null; avatar_url?: string | null }
      | { display_name: string | null; avatar_url?: string | null }[]
      | null;
  };

  let participantRows: ParticipantRow[] | null = null;
  const withAvatar = await supabase
    .from("challenge_participants")
    .select(
      `
      user_id,
      joined_at,
      progress_percent,
      profile:profiles!challenge_participants_user_id_fkey ( display_name, avatar_url )
    `,
    )
    .eq("challenge_id", challengeId)
    .order("joined_at", { ascending: true })
    .limit(200);

  participantRows = (withAvatar.data ?? null) as ParticipantRow[] | null;
  if (withAvatar.error && /avatar_url|schema cache|challenge_participants_user_id_fkey/i.test(withAvatar.error.message)) {
    const fallback = await supabase
      .from("challenge_participants")
      .select(
        `
        user_id,
        joined_at,
        progress_percent,
        profile:profiles!challenge_participants_user_id_fkey ( display_name )
      `,
      )
      .eq("challenge_id", challengeId)
      .order("joined_at", { ascending: true })
      .limit(200);
    participantRows = (fallback.data ?? null) as ParticipantRow[] | null;
  }

  const { data: checkIns } = await supabase
    .from("challenge_daily_check_ins")
    .select("user_id")
    .eq("challenge_id", challengeId)
    .eq("check_in_date", today);

  const checkedInToday = new Set((checkIns ?? []).map((c) => c.user_id));

  const members: ChallengeMemberRow[] = (participantRows ?? []).map((row) => {
    const profile = unwrapOne(row.profile);
    const isHost = row.user_id === creatorId;
    return {
      id: row.user_id,
      displayName: profile?.display_name?.trim() || "Member",
      avatarUrl: profile?.avatar_url ?? null,
      joinedAt: row.joined_at,
      progressPercent: row.progress_percent ?? null,
      checkedInToday: checkedInToday.has(row.user_id),
      role: isHost ? "host" : "member",
    };
  });

  if (!members.some((m) => m.id === creatorId)) {
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", creatorId)
      .maybeSingle();
    members.unshift({
      id: creatorId,
      displayName: hostProfile?.display_name?.trim() || creatorDisplayName,
      avatarUrl: hostProfile?.avatar_url ?? null,
      joinedAt: null,
      progressPercent: null,
      checkedInToday: checkedInToday.has(creatorId),
      role: "host",
    });
  } else {
    for (const m of members) {
      if (m.id === creatorId) m.role = "host";
    }
    members.sort((a, b) => {
      if (a.role === "host") return -1;
      if (b.role === "host") return 1;
      return (a.joinedAt ?? "").localeCompare(b.joinedAt ?? "");
    });
  }

  return members;
}

function streakFromCompletions(
  rows: Array<{ completed_on: string }>,
  today: string,
): { streakDays: number; bestStreak: number } {
  const dates = [...new Set(rows.map((r) => r.completed_on))].sort();
  if (!dates.length) return { streakDays: 0, bestStreak: 0 };

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    if (prev) {
      const diff =
        (new Date(`${d}T12:00:00Z`).getTime() - new Date(`${prev}T12:00:00Z`).getTime()) /
        86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }

  let streak = 0;
  let cursor = new Date(`${today}T12:00:00Z`);
  const set = new Set(dates);
  for (let i = 0; i < 60; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { streakDays: streak, bestStreak: best };
}

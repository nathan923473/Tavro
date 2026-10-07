import { challengeDayIndex, challengeTotalDays } from "@/lib/challenge-day";
import { parseScheduleItemActivities, type ParsedDailyActivity } from "@/lib/challenge-activities";
import { fetchChallengeSchedule } from "@/lib/data/creator-studio";
import { fetchChallengeGalleryDetailsMap } from "@/lib/data/challenge-media";
import { unwrapOne } from "@/lib/data/relations";
import { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import type { ChallengeCategory } from "@/types/creator-studio";

export type HubActivityState = ParsedDailyActivity & {
  completed: boolean;
  progressNumber: number | null;
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
  milestones: Array<{ key: string; label: string; earned: boolean }>;
  completedDaysCount: number;
  bestStreak: number;
  canonicalPath: string;
  /** Logged-in user created this challenge (may not be in challenge_participants). */
  isOwner: boolean;
  members: ChallengeMemberRow[];
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
  const today = todayDateKey();

  const { data: ch } = await supabase
    .from("challenges")
    .select(
      `
      id, title, description, short_description, goal_description, category,
      start_date, end_date, invite_slug, cover_url, created_by, community_id,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      community:creator_communities ( slug, community_name, avatar_url, owner_id ),
      participants:challenge_participants ( count )
    `,
    )
    .eq("id", challengeId)
    .maybeSingle();
  if (!ch) return null;

  const community = unwrapOne(ch.community);
  const isOwner =
    ch.created_by === userId ||
    (community?.owner_id != null && community.owner_id === userId);

  const { data: membership } = await supabase
    .from("challenge_participants")
    .select("progress_percent")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership && !isOwner) return null;

  const schedule = await fetchChallengeSchedule(challengeId);
  const totalDays = challengeTotalDays(ch.start_date, ch.end_date);
  const rawDayIndex = challengeDayIndex(ch.start_date, today);
  const dayIndex = Math.min(Math.max(rawDayIndex, 1), totalDays);

  let phase: ChallengeParticipantHub["phase"] = "active";
  let daysUntilStart = 0;
  if (today < ch.start_date) {
    phase = "upcoming";
    daysUntilStart = Math.ceil(
      (new Date(`${ch.start_date}T12:00:00Z`).getTime() -
        new Date(`${today}T12:00:00Z`).getTime()) /
        (86400000),
    );
  } else if (today > ch.end_date) {
    phase = "completed";
  }

  const effectiveDayIndex = phase === "upcoming" ? 1 : dayIndex;
  const scheduleItem = phase === "active" ? scheduleItemForDay(schedule, effectiveDayIndex) : null;

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
        c.completed_on === today &&
        (c.activity_key ?? "primary") === a.key,
    );
    return {
      ...a,
      completed: Boolean(row),
      progressNumber: row?.progress_number != null ? Number(row.progress_number) : null,
    };
  });

  const dayCompletionMap: Record<number, boolean> = {};
  for (let d = 1; d <= totalDays; d++) {
    const item = scheduleItemForDay(schedule, d);
    if (!item || item.isRest) {
      dayCompletionMap[d] = false;
      continue;
    }
    const dayDate = addDays(ch.start_date, d - 1);
    const acts = parseScheduleItemActivities(item.id, item.title, item.body, item.isRest, category);
    const required = acts.filter((a) => a.kind !== "custom" || a.key === "primary");
    dayCompletionMap[d] = required.every((a) =>
      (completionRows ?? []).some(
        (c) =>
          c.schedule_item_id === item.id &&
          c.completed_on === dayDate &&
          (c.activity_key ?? "primary") === a.key,
      ),
    );
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
    ch.created_by,
    creatorDisplayName,
    today,
  );

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
    creatorId: ch.created_by,
    communitySlug: community?.slug ?? null,
    communityName: community?.community_name ?? null,
    communityAvatarUrl: community?.avatar_url ?? null,
    startDate: ch.start_date,
    endDate: ch.end_date,
    participants: ch.participants?.[0]?.count ?? 0,
    dayIndex: effectiveDayIndex,
    totalDays,
    progressPercent: membership?.progress_percent ?? 0,
    streakDays,
    phase,
    daysUntilStart,
    todayKey: today,
    todayActivities,
    todayLabel: new Date(`${today}T12:00:00Z`).toLocaleDateString(undefined, {
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
    milestones,
    completedDaysCount,
    bestStreak,
    canonicalPath,
    isOwner,
    members,
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

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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

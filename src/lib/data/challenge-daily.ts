import { challengeDayIndex, challengeTotalDays } from "@/lib/challenge-day";
import { fetchChallengeSchedule } from "@/lib/data/creator-studio";
import { unwrapOne } from "@/lib/data/relations";
import { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";

export type TodayChallengeView = {
  challengeId: string;
  title: string;
  creatorName: string;
  communityName: string | null;
  startDate: string;
  endDate: string;
  dayIndex: number;
  totalDays: number;
  progressPercent: number;
  scheduleItem: {
    id: string;
    dayLabel: string;
    title: string;
    body: string | null;
    isRest: boolean;
  } | null;
  extraActivities: { id: string; title: string; completed: boolean }[];
  completedTodayCount: number;
  totalTodayCount: number;
  streakDays: number;
  announcement: { title: string; body: string } | null;
  todayMood: string | null;
};

export async function fetchTodayChallengeView(
  challengeId: string,
  userId: string,
): Promise<TodayChallengeView | null> {
  const supabase = await createClient();
  const today = todayDateKey();

  const { data: membership } = await supabase
    .from("challenge_participants")
    .select("progress_percent, last_activity_date")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  const { data: ch } = await supabase
    .from("challenges")
    .select(
      `
      id, title, start_date, end_date, community_id,
      creator:profiles!challenges_created_by_fkey ( display_name ),
      community:creator_communities ( community_name )
    `,
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (!ch) return null;

  const schedule = await fetchChallengeSchedule(challengeId);
  const dayIndex = challengeDayIndex(ch.start_date, today);
  const totalDays = challengeTotalDays(ch.start_date, ch.end_date);
  const scheduleItem =
    schedule.find((s, i) => i + 1 === dayIndex || s.sortOrder + 1 === dayIndex) ??
    schedule[Math.min(dayIndex - 1, schedule.length - 1)] ??
    null;

  const activityIds = scheduleItem ? [scheduleItem.id] : [];
  let completions: { schedule_item_id: string }[] = [];
  if (activityIds.length) {
    const { data } = await supabase
      .from("challenge_schedule_completions")
      .select("schedule_item_id")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .eq("completed_on", today);
    completions = data ?? [];
  }

  const completedSet = new Set(completions.map((c) => c.schedule_item_id));
  const extraActivities = scheduleItem
    ? [
        {
          id: scheduleItem.id,
          title: scheduleItem.title,
          completed: completedSet.has(scheduleItem.id),
        },
      ]
    : [];

  if (scheduleItem?.body && !scheduleItem.isRest) {
    extraActivities.push({
      id: `${scheduleItem.id}-body`,
      title: scheduleItem.body.slice(0, 120),
      completed: completedSet.has(scheduleItem.id),
    });
  }

  const totalTodayCount = scheduleItem && !scheduleItem.isRest ? 1 : 0;
  const completedTodayCount =
    scheduleItem && !scheduleItem.isRest && completedSet.has(scheduleItem.id) ? 1 : 0;

  let announcement: { title: string; body: string } | null = null;
  if (ch.community_id) {
    const { data: ann } = await supabase
      .from("creator_announcements")
      .select("title, body")
      .eq("community_id", ch.community_id)
      .or(`challenge_id.eq.${challengeId},challenge_id.is.null`)
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    announcement = ann;
  }

  let todayMood: string | null = null;
  const { data: checkIn } = await supabase
    .from("challenge_daily_check_ins")
    .select("mood")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .eq("check_in_date", today)
    .maybeSingle();
  todayMood = checkIn?.mood ?? null;

  const streakDays = await estimateStreak(supabase, userId, challengeId, today);

  return {
    challengeId,
    title: ch.title,
    creatorName: unwrapOne(ch.creator)?.display_name ?? "Creator",
    communityName: unwrapOne(ch.community)?.community_name ?? null,
    startDate: ch.start_date,
    endDate: ch.end_date,
    dayIndex: Math.min(dayIndex, totalDays),
    totalDays,
    progressPercent: membership.progress_percent ?? 0,
    scheduleItem: scheduleItem
      ? {
          id: scheduleItem.id,
          dayLabel: scheduleItem.dayLabel,
          title: scheduleItem.title,
          body: scheduleItem.body,
          isRest: scheduleItem.isRest,
        }
      : null,
    extraActivities,
    completedTodayCount,
    totalTodayCount,
    streakDays,
    announcement: announcement
      ? { title: announcement.title, body: announcement.body }
      : null,
    todayMood,
  };
}

async function estimateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  challengeId: string,
  today: string,
): Promise<number> {
  const { data } = await supabase
    .from("challenge_schedule_completions")
    .select("completed_on")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .order("completed_on", { ascending: false })
    .limit(30);

  if (!data?.length) return 0;
  const dates = new Set(data.map((d) => d.completed_on));
  let streak = 0;
  let cursor = new Date(`${today}T12:00:00Z`);
  for (let i = 0; i < 30; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

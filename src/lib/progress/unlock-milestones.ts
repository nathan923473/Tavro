import type { SupabaseClient } from "@supabase/supabase-js";
import { computeWeeklyConsistency } from "@/lib/progress/consistency";
import type { PersonalGoal } from "@/types";

async function unlockMilestone(
  supabase: SupabaseClient,
  userId: string,
  key: string,
) {
  await supabase.from("member_milestones").upsert(
    { user_id: userId, milestone_key: key },
    { onConflict: "user_id,milestone_key", ignoreDuplicates: true },
  );
}

export async function maybeUnlockChallengeParticipationMilestones(
  supabase: SupabaseClient,
  userId: string,
  input: {
    progressPercent: number;
    lastActivityDate: string | null;
    completionDate: string;
    challengeEnded: boolean;
  },
) {
  if (input.progressPercent >= 80 || input.challengeEnded) {
    await unlockMilestone(supabase, userId, "first_challenge");
  }

  if (input.lastActivityDate && input.completionDate > input.lastActivityDate) {
    const last = new Date(`${input.lastActivityDate}T12:00:00Z`).getTime();
    const today = new Date(`${input.completionDate}T12:00:00Z`).getTime();
    const gapDays = Math.floor((today - last) / (24 * 60 * 60 * 1000));
    if (gapDays >= 3) {
      await unlockMilestone(supabase, userId, "returned_after_break");
    }
  }
}

export async function maybeUnlockWeeklyConsistencyMilestones(
  supabase: SupabaseClient,
  userId: string,
  goals: PersonalGoal[],
  weekCompletions: { goal_id: string; completion_date: string }[],
) {
  const completionsByGoal: Record<string, number> = {};
  for (const row of weekCompletions) {
    completionsByGoal[row.goal_id] = (completionsByGoal[row.goal_id] ?? 0) + 1;
  }
  const week = computeWeeklyConsistency(goals, completionsByGoal);
  if (week.planned > 0 && week.percent >= 70) {
    await unlockMilestone(supabase, userId, "weekly_goal_met");
  }

  const fourWeeks = await countRecentStrongWeeks(supabase, userId, goals, 4);
  if (fourWeeks >= 4) {
    await unlockMilestone(supabase, userId, "weeks_consistent_4");
  }
}

async function countRecentStrongWeeks(
  supabase: SupabaseClient,
  userId: string,
  goals: PersonalGoal[],
  needed: number,
): Promise<number> {
  const active = goals.filter((g) => !g.paused);
  if (active.length === 0) return 0;

  const ids = active.map((g) => g.id);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - needed * 7);
  const startKey = start.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("goal_completions")
    .select("goal_id, completion_date")
    .eq("user_id", userId)
    .gte("completion_date", startKey)
    .in("goal_id", ids);

  let strong = 0;
  for (let w = 0; w < needed; w += 1) {
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - (w + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setUTCDate(weekEnd.getUTCDate() - w * 7);
    const from = weekStart.toISOString().slice(0, 10);
    const to = weekEnd.toISOString().slice(0, 10);

    const inWeek = (data ?? []).filter(
      (c) => c.completion_date >= from && c.completion_date <= to,
    );
    const byGoal: Record<string, number> = {};
    for (const row of inWeek) {
      byGoal[row.goal_id] = (byGoal[row.goal_id] ?? 0) + 1;
    }
    const snapshot = active.map((g) => ({
      ...g,
      weeklyCompletion: byGoal[g.id] ?? 0,
    }));
    const planned = snapshot.reduce((sum, g) => {
      if (g.frequencyType === "daily") return sum + 7;
      return sum + Math.min(7, g.frequencyTarget);
    }, 0);
    const completed = snapshot.reduce((sum, g) => sum + g.weeklyCompletion, 0);
    const pct = planned === 0 ? 0 : Math.round((completed / planned) * 100);
    if (pct >= 70) strong += 1;
  }
  return strong;
}

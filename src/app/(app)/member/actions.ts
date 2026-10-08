"use server";

import { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import { challengeTodayDateKey } from "@/lib/timezone/challenge-calendar";
import { resolveChallengeEndAt, resolveChallengeStartAt } from "@/lib/timezone/challenge-fields";
import { normalizeTimezone, isValidIanaTimezone } from "@/lib/timezone/validate";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import type { AuStateOrTerritory } from "@/lib/timezone/constants";
import { revalidatePath } from "next/cache";
import { randomBytes, randomUUID } from "node:crypto";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log in required.");
  return { supabase, userId: user.id };
}

function slugify(text: string) {
  return `${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24)}-${randomBytes(3).toString("hex")}`;
}

export async function saveParticipantTimezoneAction(input: {
  timezone: string;
  auStateOrTerritory?: AuStateOrTerritory | null;
  timezoneSource?: string;
  confirmed?: boolean;
}) {
  const { supabase, userId } = await requireUserId();
  if (!isValidIanaTimezone(input.timezone)) {
    throw new Error("Choose a valid timezone.");
  }
  const patch: Record<string, unknown> = {
    timezone: input.timezone,
    timezone_source: input.timezoneSource ?? "manual",
  };
  if (input.auStateOrTerritory !== undefined) {
    patch.au_state_or_territory = input.auStateOrTerritory;
  }
  if (input.confirmed) {
    patch.timezone_confirmed_at = new Date().toISOString();
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error && /timezone|au_state|schema cache/i.test(error.message)) {
    throw new Error("Run migration 021_timezone_support.sql in Supabase.");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/onboarding");
  return { ok: true as const };
}

export async function completeOnboarding(input: {
  focusGoal: string;
  habits: string[];
  createGroup: boolean;
  inviteCode?: string;
  timezone?: string;
  auStateOrTerritory?: AuStateOrTerritory | null;
  timezoneSource?: string;
}) {
  const { supabase, userId } = await requireUserId();

  if (input.timezone && isValidIanaTimezone(input.timezone)) {
    await saveParticipantTimezoneAction({
      timezone: input.timezone,
      auStateOrTerritory: input.auStateOrTerritory,
      timezoneSource: input.timezoneSource ?? "device",
      confirmed: true,
    });
  }

  const habitTitles = input.habits.length
    ? input.habits.slice(0, 5)
    : ["Daily movement"];

  const goals = habitTitles.map((title, i) => ({
    title,
    category: i === 0 ? "movement" : "routine",
    sort_order: i,
    user_id: userId,
  }));

  if (input.focusGoal.trim()) {
    goals.push({
      title: input.focusGoal.trim(),
      category: "mindfulness",
      sort_order: goals.length,
      user_id: userId,
    });
  }

  await supabase.from("member_goals").delete().eq("user_id", userId);
  await supabase.from("member_goals").insert(goals);

  if (input.inviteCode?.trim()) {
    await joinGroupByInviteCode(input.inviteCode.trim());
  } else if (input.createGroup) {
    await createAccountabilityGroup(`${habitTitles[0] ?? "My"} circle`);
  }

  revalidatePath("/");
  return { ok: true as const };
}

export async function checkInTodayAction() {
  return submitDailyCheckInAction({});
}

export async function submitDailyCheckInAction(input: {
  mood?: "rough" | "okay" | "good" | "great";
  reflection?: string;
}) {
  const { supabase, userId } = await requireUserId();
  const reflection = input.reflection?.trim().slice(0, 500) ?? null;

  const row: Record<string, unknown> = {
    user_id: userId,
    check_in_date: todayDateKey(),
  };
  if (input.mood) row.mood = input.mood;
  if (reflection) row.reflection = reflection;

  let { error } = await supabase.from("daily_check_ins").upsert(row, {
    onConflict: "user_id,check_in_date",
  });

  if (error && /mood|reflection|schema cache/i.test(error.message)) {
    ({ error } = await supabase.from("daily_check_ins").upsert(
      { user_id: userId, check_in_date: todayDateKey() },
      { onConflict: "user_id,check_in_date" },
    ));
  }

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function toggleGoalAction(goalId: string) {
  const { supabase, userId } = await requireUserId();
  const today = todayDateKey();

  const { data: existing } = await supabase
    .from("goal_completions")
    .select("goal_id")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .eq("completion_date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("goal_completions")
      .delete()
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .eq("completion_date", today);
  } else {
    await supabase.from("goal_completions").insert({
      goal_id: goalId,
      user_id: userId,
      completion_date: today,
    });

    const { data: habit } = await supabase
      .from("member_goals")
      .select("linked_challenge_id, title, template_key")
      .eq("id", goalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (habit?.linked_challenge_id) {
      const { data: row } = await supabase
        .from("challenge_participants")
        .select("progress_percent")
        .eq("challenge_id", habit.linked_challenge_id)
        .eq("user_id", userId)
        .maybeSingle();
      const next = Math.min(100, (row?.progress_percent ?? 0) + 8);
      await supabase
        .from("challenge_participants")
        .update({
          progress_percent: next,
          last_activity_date: today,
        })
        .eq("challenge_id", habit.linked_challenge_id)
        .eq("user_id", userId);
    }

    await maybeUnlockHabitMilestones(supabase, userId, habit?.template_key ?? null);
  }
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/challenges");
}

async function maybeUnlockHabitMilestones(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  templateKey: string | null,
) {
  const { count: totalCompletions } = await supabase
    .from("goal_completions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const unlock = async (key: string) => {
    await supabase.from("member_milestones").upsert(
      { user_id: userId, milestone_key: key },
      { onConflict: "user_id,milestone_key", ignoreDuplicates: true },
    );
  };

  if ((totalCompletions ?? 0) >= 7) await unlock("first_week");
  if ((totalCompletions ?? 0) >= 30) await unlock("consistency_30d");
  const walkKeys = new Set(["walk", "walk_20_min", "walk_after_meal", "steps_8000"]);
  if (templateKey && walkKeys.has(templateKey) && (totalCompletions ?? 0) >= 10) {
    await unlock("walks_10");
  }
  const workoutKeys = new Set(["gym", "run", "complete_workout"]);
  if (templateKey && workoutKeys.has(templateKey) && (totalCompletions ?? 0) >= 25) {
    await unlock("workouts_25");
  }
}

export async function joinChallengeAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("challenge_participants").upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      progress_percent: 5,
    },
    { onConflict: "challenge_id,user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/challenges");
  revalidatePath("/");
  revalidatePath(`/join`);
}

/** Join then return path to participant onboarding or today's challenge hub. */
export async function joinChallengeAndContinueAction(
  challengeId: string,
  onboardingPath: string,
): Promise<string> {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("challenge_participants").upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      progress_percent: 5,
    },
    { onConflict: "challenge_id,user_id" },
  );
  if (error) throw new Error(error.message);

  const { data: row } = await supabase
    .from("challenge_participants")
    .select("onboarding_completed_at")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();

  revalidatePath("/challenges");
  revalidatePath("/");
  revalidatePath("/join");

  if (row?.onboarding_completed_at) {
    return `/challenges/${challengeId}`;
  }
  return onboardingPath;
}

export async function completeChallengeParticipantOnboardingAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  const payload: Record<string, string> = {
    onboarding_completed_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("challenge_participants")
    .update(payload)
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);
  if (error && /onboarding_completed_at|schema cache/i.test(error.message)) {
    return { ok: true as const, nextPath: `/challenges/${challengeId}` };
  }
  if (error) throw new Error(error.message);
  revalidatePath(`/challenges/${challengeId}`);
  return { ok: true as const, nextPath: `/challenges/${challengeId}` };
}

export async function leaveChallengeAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);
  revalidatePath("/challenges");
  revalidatePath("/");
}

async function challengeCompletionContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
) {
  const { data: ch } = await supabase
    .from("challenges")
    .select("start_date, end_date, start_at, end_at, challenge_timezone")
    .eq("id", challengeId)
    .maybeSingle();
  if (!ch) throw new Error("Challenge not found.");
  const tz = normalizeTimezone(ch.challenge_timezone, DEFAULT_FALLBACK_TIMEZONE);
  const todayKey = challengeTodayDateKey(new Date(), tz);
  return {
    startDate: ch.start_date as string,
    endDate: ch.end_date as string,
    todayKey,
    startAt: resolveChallengeStartAt({
      start_date: ch.start_date as string,
      start_at: ch.start_at as string | null,
      challenge_timezone: tz,
    }),
    endAt: resolveChallengeEndAt({
      end_date: ch.end_date as string,
      end_at: ch.end_at as string | null,
      challenge_timezone: tz,
    }),
  };
}

async function assertChallengeCompletionDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
  completedOn: string,
) {
  const ctx = await challengeCompletionContext(supabase, challengeId);
  if (completedOn < ctx.startDate || completedOn > ctx.endDate) {
    throw new Error("That date is outside this challenge.");
  }
  if (completedOn > ctx.todayKey) {
    throw new Error("You can only check off habits for today or earlier days.");
  }
  if (new Date().getTime() < ctx.startAt.getTime()) {
    throw new Error("This challenge has not started yet.");
  }
}

export async function toggleChallengeScheduleCompletionAction(
  challengeId: string,
  scheduleItemId: string,
  markComplete: boolean,
  activityKey = "primary",
  progressNumber?: number | null,
  completedOn?: string,
) {
  const { supabase, userId } = await requireUserId();
  const ctx = await challengeCompletionContext(supabase, challengeId);
  const completionDate = completedOn ?? ctx.todayKey;
  await assertChallengeCompletionDate(supabase, challengeId, completionDate);

  if (markComplete) {
    const payload: Record<string, unknown> = {
      user_id: userId,
      challenge_id: challengeId,
      schedule_item_id: scheduleItemId,
      completed_on: completionDate,
      activity_key: activityKey,
    };
    if (progressNumber != null) payload.progress_number = progressNumber;

    const { error } = await supabase.from("challenge_schedule_completions").upsert(payload, {
      onConflict: "user_id,schedule_item_id,completed_on,activity_key",
    });
    if (error && /activity_key|onConflict|schema cache/i.test(error.message)) {
      const { error: legacyErr } = await supabase.from("challenge_schedule_completions").upsert(
        {
          user_id: userId,
          challenge_id: challengeId,
          schedule_item_id: scheduleItemId,
          completed_on: completionDate,
          progress_number: progressNumber ?? null,
        },
        { onConflict: "user_id,schedule_item_id,completed_on" },
      );
      if (legacyErr) throw new Error(legacyErr.message);
    } else if (error) {
      throw new Error(error.message);
    }

    await bumpChallengeProgress(supabase, userId, challengeId, completionDate);
  } else {
    let q = supabase
      .from("challenge_schedule_completions")
      .delete()
      .eq("user_id", userId)
      .eq("schedule_item_id", scheduleItemId)
      .eq("completed_on", completionDate);
    q = q.eq("activity_key", activityKey);
    await q;
  }

  revalidateChallengeParticipant(challengeId);
}

async function bumpChallengeProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  challengeId: string,
  today: string,
) {
  const { data: row } = await supabase
    .from("challenge_participants")
    .select("progress_percent")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();
  const next = Math.min(100, (row?.progress_percent ?? 0) + 2);
  await supabase
    .from("challenge_participants")
    .update({
      progress_percent: next,
      last_activity_date: today,
    })
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);
}

function revalidateChallengeParticipant(challengeId: string) {
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath(`/challenges/${challengeId}/today`);
  revalidatePath("/challenges");
  revalidatePath("/");
}

export async function saveChallengeStepProgressAction(
  challengeId: string,
  scheduleItemId: string,
  activityKey: string,
  steps: number,
  target: number,
  completedOn?: string,
) {
  const { supabase, userId } = await requireUserId();
  const ctx = await challengeCompletionContext(supabase, challengeId);
  const completionDate = completedOn ?? ctx.todayKey;
  await assertChallengeCompletionDate(supabase, challengeId, completionDate);
  const complete = steps >= target;
  const payload: Record<string, unknown> = {
    user_id: userId,
    challenge_id: challengeId,
    schedule_item_id: scheduleItemId,
    completed_on: completionDate,
    activity_key: activityKey,
    progress_number: steps,
  };

  const { error } = await supabase.from("challenge_schedule_completions").upsert(payload, {
    onConflict: "user_id,schedule_item_id,completed_on,activity_key",
  });
  if (error && /activity_key|onConflict/i.test(error.message)) {
    await supabase.from("challenge_schedule_completions").upsert(
      {
        user_id: userId,
        challenge_id: challengeId,
        schedule_item_id: scheduleItemId,
        completed_on: completionDate,
        progress_number: steps,
      },
      { onConflict: "user_id,schedule_item_id,completed_on" },
    );
  } else if (error) {
    throw new Error(error.message);
  }

  if (complete) await bumpChallengeProgress(supabase, userId, challengeId, completionDate);
  revalidateChallengeParticipant(challengeId);
}

export async function saveChallengeDailyCheckInAction(
  challengeId: string,
  mood: string,
  note: string,
) {
  const { supabase, userId } = await requireUserId();
  const trimmed = note.trim().slice(0, 500);
  const { error } = await supabase.from("challenge_daily_check_ins").upsert(
    {
      user_id: userId,
      challenge_id: challengeId,
      check_in_date: todayDateKey(),
      mood,
      note: trimmed || null,
    },
    { onConflict: "user_id,challenge_id,check_in_date" },
  );
  if (error && /challenge_daily_check_ins|schema cache/i.test(error.message)) {
    throw new Error("Run migration 015_challenge_daily_progress.sql in Supabase.");
  }
  if (error) throw new Error(error.message);
  revalidateChallengeParticipant(challengeId);
}

export async function logChallengeActivityAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  const { data: row } = await supabase
    .from("challenge_participants")
    .select("progress_percent")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();

  const next = Math.min(100, (row?.progress_percent ?? 0) + 8);
  const { error } = await supabase
    .from("challenge_participants")
    .update({
      progress_percent: next,
      last_activity_date: todayDateKey(),
    })
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/challenges");
}

export async function postChallengeMessageAction(input: {
  challengeId: string;
  body: string;
  role: "creator" | "member";
}) {
  const { supabase, userId } = await requireUserId();
  const text = input.body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const { error } = await supabase.from("challenge_messages").insert({
    challenge_id: input.challengeId,
    author_id: userId,
    author_role: input.role,
    body: text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/challenges");
  revalidatePath("/studio");
}

export async function toggleFollowCommunityAction(communityId: string) {
  const { supabase, userId } = await requireUserId();
  const { data: existing } = await supabase
    .from("community_follows")
    .select("community_id")
    .eq("user_id", userId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("community_follows")
      .delete()
      .eq("user_id", userId)
      .eq("community_id", communityId);
  } else {
    await supabase.from("community_follows").insert({
      user_id: userId,
      community_id: communityId,
    });
  }
  revalidatePath("/following");
  revalidatePath("/challenges");
  revalidatePath("/creator");
}

export async function updateCommunityAnnouncementAction(
  communityId: string,
  announcement: string,
) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("creator_communities")
    .update({ announcement, updated_at: new Date().toISOString() })
    .eq("id", communityId)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
  revalidatePath("/creator/dashboard");
}

export async function saveCommunityAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const communityName = String(formData.get("community_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const brandColor = String(formData.get("brand_color") ?? "#3d8b6e");
  const shopUrl = String(formData.get("shop_url") ?? "").trim();
  const affiliateDisclosure = String(
    formData.get("affiliate_disclosure") ?? "",
  ).trim();
  let slug = String(formData.get("slug") ?? "").trim();

  if (!communityName) throw new Error("Community name is required.");

  const { data: existing } = await supabase
    .from("creator_communities")
    .select("id, slug")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!existing) {
    if (!slug) slug = slugify(communityName);
    const { error } = await supabase.from("creator_communities").insert({
      owner_id: userId,
      slug,
      community_name: communityName,
      bio,
      brand_color: brandColor,
      shop_url: shopUrl || null,
      affiliate_disclosure: affiliateDisclosure || null,
    });
    if (error) throw new Error(error.message);
  } else {
    slug = existing.slug;
    const { error } = await supabase
      .from("creator_communities")
      .update({
        community_name: communityName,
        bio,
        brand_color: brandColor,
        shop_url: shopUrl || null,
        affiliate_disclosure: affiliateDisclosure || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/creator/${slug}`);
  revalidatePath(`/creator/${slug}/edit`);
  revalidatePath("/studio");
  return { ok: true as const, slug };
}

export async function createAccountabilityGroup(name: string) {
  const { supabase, userId } = await requireUserId();

  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existingMembership) {
    throw new Error(
      "Leave your current private accountability group before creating another.",
    );
  }

  const inviteCode = randomBytes(5).toString("hex");
  const groupId = randomUUID();
  const { error: groupError } = await supabase
    .from("accountability_groups")
    .insert({
      id: groupId,
      name: name.trim() || "My private accountability group",
      invite_code: inviteCode,
      created_by: userId,
    });

  if (groupError) throw new Error(groupError.message);

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
  });
  if (memberError) throw new Error(memberError.message);

  revalidatePath("/groups");
  return { inviteCode };
}

export async function joinGroupByInviteCode(code: string) {
  const { supabase, userId } = await requireUserId();

  const { data: rows, error: lookupError } = await supabase.rpc(
    "get_group_by_invite_code",
    { p_code: code.trim() },
  );
  if (lookupError) throw new Error(lookupError.message);
  const group = Array.isArray(rows) ? rows[0] : rows;
  if (!group) throw new Error("Invalid private accountability group invite code.");

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((count ?? 0) >= group.max_members) {
    throw new Error("This private accountability group is full.");
  }

  await supabase.from("group_members").upsert(
    { group_id: group.id, user_id: userId },
    { onConflict: "group_id,user_id" },
  );

  revalidatePath("/groups");
}

export async function leaveGroupAction() {
  const { supabase, userId } = await requireUserId();
  await supabase.from("group_members").delete().eq("user_id", userId);
  revalidatePath("/groups");
}

export async function postGroupMessageAction(body: string) {
  const { supabase, userId } = await requireUserId();
  const text = body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("Join a private accountability group first.");

  const { error } = await supabase.from("group_messages").insert({
    group_id: membership.group_id,
    author_id: userId,
    body: text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

export async function addWeighInAction(weightLb: number) {
  const { supabase, userId } = await requireUserId();
  if (!Number.isFinite(weightLb) || weightLb <= 0) {
    throw new Error("Enter a valid weight.");
  }
  const { error } = await supabase.from("weekly_weigh_ins").upsert(
    {
      user_id: userId,
      recorded_date: todayDateKey(),
      weight_lb: weightLb,
    },
    { onConflict: "user_id,recorded_date" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/progress");
}

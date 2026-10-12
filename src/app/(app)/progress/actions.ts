"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import {
  ALL_WEEKDAYS_MASK,
  normalizeDaysMask,
  normalizeReminderTime,
} from "@/lib/habits/schedule";
import { presetByKey, CUSTOM_HABIT_PRESET_KEY } from "@/lib/habits/presets";
import type { GoalCategory, HabitFrequencyType } from "@/types";
import { revalidatePath } from "next/cache";

function revalidateProgressPaths() {
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/profile");
}

export async function createHabitAction(input: {
  title: string;
  templateKey?: string;
  category?: GoalCategory;
  frequencyType?: HabitFrequencyType;
  frequencyTarget?: number;
  scheduleDaysMask?: number;
  reminderTime?: string | null;
}) {
  const { supabase, userId } = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Habit name is required.");

  const preset = input.templateKey ? presetByKey(input.templateKey) : null;
  const frequencyType =
    input.frequencyType ?? preset?.frequencyType ?? "daily";
  const frequencyTarget =
    input.frequencyTarget ?? preset?.frequencyTarget ?? (frequencyType === "daily" ? 7 : 3);

  let activeCount = 0;
  const countRes = await supabase
    .from("member_goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);

  if (countRes.error && /active|schema cache/i.test(countRes.error.message)) {
    const legacyCount = await supabase
      .from("member_goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    activeCount = legacyCount.count ?? 0;
  } else {
    activeCount = countRes.count ?? 0;
  }

  if (activeCount >= 10) {
    throw new Error("Keep it focused — pause or remove a habit first (max 10).");
  }

  const scheduleDaysMask = input.scheduleDaysMask ?? ALL_WEEKDAYS_MASK;
  if (scheduleDaysMask !== normalizeDaysMask(scheduleDaysMask)) {
    throw new Error("Pick at least one day.");
  }
  const reminderTime =
    input.reminderTime === undefined ? null : normalizeReminderTime(input.reminderTime);
  if (input.reminderTime && !reminderTime) {
    throw new Error("Use a valid time.");
  }

  const row: Record<string, unknown> = {
    user_id: userId,
    title: preset?.label ?? title,
    category: input.category ?? preset?.category ?? "routine",
    active: true,
    sort_order: activeCount,
    template_key: input.templateKey ?? CUSTOM_HABIT_PRESET_KEY,
    frequency_type: frequencyType,
    frequency_target: Math.min(7, Math.max(1, frequencyTarget)),
    schedule_days_mask: scheduleDaysMask,
    reminder_time: reminderTime,
  };

  let { error } = await supabase.from("member_goals").insert(row);
  if (
    error &&
    /schedule_days_mask|reminder_time/i.test(error.message)
  ) {
    const customSchedule = scheduleDaysMask !== ALL_WEEKDAYS_MASK || Boolean(reminderTime);
    if (customSchedule) {
      throw new Error(
        "Run migration 046_habit_weekday_schedule.sql in Supabase, then try again.",
      );
    }
    const withoutSchedule = { ...row };
    delete withoutSchedule.schedule_days_mask;
    delete withoutSchedule.reminder_time;
    const retry = await supabase.from("member_goals").insert(withoutSchedule);
    error = retry.error;
  }
  if (error) {
    if (/template_key|frequency_|schema cache/i.test(error.message)) {
      const { error: legacyErr } = await supabase.from("member_goals").insert({
        user_id: userId,
        title: row.title,
        category: row.category,
        sort_order: row.sort_order,
      });
      if (legacyErr) throw new Error(legacyErr.message);
    } else {
      throw new Error(error.message);
    }
  }

  revalidateProgressPaths();
}

export async function updateHabitAction(
  habitId: string,
  input: {
    title?: string;
    frequencyType?: HabitFrequencyType;
    frequencyTarget?: number;
    scheduleDaysMask?: number;
    reminderTime?: string | null;
  },
) {
  const { supabase, userId } = await requireUserId();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.frequencyType !== undefined) patch.frequency_type = input.frequencyType;
  if (input.frequencyTarget !== undefined) {
    patch.frequency_target = Math.min(7, Math.max(1, input.frequencyTarget));
  }
  if (input.scheduleDaysMask !== undefined) {
    if (input.scheduleDaysMask !== normalizeDaysMask(input.scheduleDaysMask)) {
      throw new Error("Pick at least one day.");
    }
    patch.schedule_days_mask = input.scheduleDaysMask;
  }
  if (input.reminderTime !== undefined) {
    const reminderTime = normalizeReminderTime(input.reminderTime);
    if (input.reminderTime && !reminderTime) {
      throw new Error("Use a valid time.");
    }
    patch.reminder_time = reminderTime;
  }

  const { error } = await supabase
    .from("member_goals")
    .update(patch)
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) {
    if (/schedule_days_mask|reminder_time/i.test(error.message)) {
      throw new Error("Run migration 046_habit_weekday_schedule.sql in Supabase, then try again.");
    }
    throw new Error(error.message);
  }
  revalidateProgressPaths();
}

export async function pauseHabitAction(habitId: string, paused: boolean) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("member_goals")
    .update({ paused_at: paused ? new Date().toISOString() : null })
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) {
    if (/paused_at|schema cache/i.test(error.message)) {
      throw new Error("Run migration 010_personal_progress_habits.sql in Supabase.");
    }
    throw new Error(error.message);
  }
  revalidateProgressPaths();
}

export async function deleteHabitAction(habitId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("member_goals")
    .update({ active: false })
    .eq("id", habitId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateProgressPaths();
}

export async function linkHabitToChallengeAction(
  habitId: string,
  challengeId: string | null,
) {
  const { supabase, userId } = await requireUserId();

  if (challengeId) {
    const { data: membership } = await supabase
      .from("challenge_participants")
      .select("challenge_id")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .maybeSingle();
    if (!membership) {
      throw new Error("Join the challenge before linking a habit.");
    }
  }

  const { error } = await supabase
    .from("member_goals")
    .update({ linked_challenge_id: challengeId })
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) {
    if (/linked_challenge|schema cache/i.test(error.message)) {
      throw new Error("Run migration 010_personal_progress_habits.sql in Supabase.");
    }
    throw new Error(error.message);
  }
  revalidateProgressPaths();
  revalidatePath("/challenges");
}

export async function setWeightTrackingEnabledAction(enabled: boolean) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({
      weight_tracking_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    if (/weight_tracking|schema cache/i.test(error.message)) {
      throw new Error("Run migration 010_personal_progress_habits.sql in Supabase.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/progress");
}

export async function deleteWeighInAction(weighInId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("weekly_weigh_ins")
    .delete()
    .eq("id", weighInId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/progress");
}

export async function shareAchievementWithGroupAction(message: string) {
  const { supabase, userId } = await requireUserId();
  const text = message.trim();
  if (!text || text.length > 280) {
    throw new Error("Share a short encouragement message (max 280 characters).");
  }

  const { resolveUserGroupId } = await import("@/lib/data/resolve-user-group-id");
  const groupId = await resolveUserGroupId(supabase, userId);

  if (!groupId) {
    throw new Error("Join a private accountability group to share achievements.");
  }

  const { error } = await supabase.from("group_achievement_shares").insert({
    group_id: groupId,
    user_id: userId,
    share_type: "weekly_habits",
    message: text,
  });

  if (error) {
    if (/group_achievement|schema cache/i.test(error.message)) {
      throw new Error("Run migration 010_personal_progress_habits.sql in Supabase.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/groups");
}

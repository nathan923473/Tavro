"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import { presetByKey, CUSTOM_HABIT_PRESET_KEY } from "@/lib/habits/presets";
import {
  ALL_DAYS_MASK,
  normalizeScheduleMask,
  popcountDays,
  reminderTimeForDb,
} from "@/lib/habits/weekdays";
import type { GoalCategory, HabitFrequencyType } from "@/types";
import { revalidatePath } from "next/cache";

function revalidateProgressPaths() {
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/profile");
  revalidatePath("/groups");
}

export async function createHabitAction(input: {
  title: string;
  templateKey?: string;
  category?: GoalCategory;
  frequencyType?: HabitFrequencyType;
  frequencyTarget?: number;
  scheduleDaysMask?: number;
  reminderTimeLocal?: string | null;
}) {
  const { supabase, userId } = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Habit name is required.");

  const preset = input.templateKey ? presetByKey(input.templateKey) : null;
  const frequencyType =
    input.frequencyType ?? preset?.frequencyType ?? "daily";
  const frequencyTarget =
    input.frequencyTarget ?? preset?.frequencyTarget ?? (frequencyType === "daily" ? 7 : 3);
  const scheduleDaysMask = normalizeScheduleMask(
    input.scheduleDaysMask ?? ALL_DAYS_MASK,
  );
  if (popcountDays(scheduleDaysMask) < 1) {
    throw new Error("Pick at least one day for this habit.");
  }
  const reminderTime = reminderTimeForDb(input.reminderTimeLocal ?? "");

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
    ...(reminderTime ? { reminder_time: reminderTime } : {}),
  };

  let { error } = await supabase.from("member_goals").insert(row);

  if (error) {
    if (/template_key|frequency_|schedule_days|reminder_time|schema cache/i.test(error.message)) {
      const { error: legacyErr } = await supabase.from("member_goals").insert({
        user_id: userId,
        title: row.title,
        category: row.category,
        sort_order: row.sort_order,
      });
      if (legacyErr) throw new Error(legacyErr.message);
      error = null;
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
    reminderTimeLocal?: string | null;
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
    const mask = normalizeScheduleMask(input.scheduleDaysMask);
    if (popcountDays(mask) < 1) throw new Error("Pick at least one day for this habit.");
    patch.schedule_days_mask = mask;
  }
  if (input.reminderTimeLocal !== undefined) {
    const t = input.reminderTimeLocal
      ? reminderTimeForDb(input.reminderTimeLocal)
      : null;
    patch.reminder_time = t;
  }

  const { error } = await supabase
    .from("member_goals")
    .update(patch)
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
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
  await supabase
    .from("member_goal_group_shares")
    .delete()
    .eq("member_goal_id", habitId)
    .eq("user_id", userId);
  const { error } = await supabase
    .from("member_goals")
    .update({ active: false })
    .eq("id", habitId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateProgressPaths();
}

export async function setHabitGroupShareAction(input: {
  habitId: string;
  groupId: string | null;
}) {
  const { supabase, userId } = await requireUserId();

  const { data: habit } = await supabase
    .from("member_goals")
    .select("id")
    .eq("id", input.habitId)
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (!habit) throw new Error("Habit not found.");

  if (!input.groupId) {
    const { error } = await supabase
      .from("member_goal_group_shares")
      .delete()
      .eq("member_goal_id", input.habitId)
      .eq("user_id", userId);
    if (error && !/member_goal_group_shares|schema cache/i.test(error.message)) {
      throw new Error(error.message);
    }
    revalidateProgressPaths();
    return;
  }

  const memberCheck = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", input.groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!memberCheck.data) {
    throw new Error("You must be a member of that group to share a habit.");
  }

  await supabase
    .from("member_goal_group_shares")
    .delete()
    .eq("member_goal_id", input.habitId)
    .eq("user_id", userId);

  const { error } = await supabase.from("member_goal_group_shares").insert({
    member_goal_id: input.habitId,
    group_id: input.groupId,
    user_id: userId,
  });

  if (error) {
    if (/member_goal_group_shares|schema cache/i.test(error.message)) {
      throw new Error("Run migration 047_shared_member_goal_commitments.sql in Supabase.");
    }
    throw new Error(error.message);
  }

  revalidateProgressPaths();
}

/** Stop sharing a habit's daily check-offs with one group (Progress habit stays private). */
export async function unlinkHabitFromGroupAction(habitId: string, groupId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("member_goal_group_shares")
    .delete()
    .eq("member_goal_id", habitId)
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error && !/member_goal_group_shares|schema cache/i.test(error.message)) {
    throw new Error(error.message);
  }
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

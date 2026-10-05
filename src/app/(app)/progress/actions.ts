"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
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
}) {
  const { supabase, userId } = await requireUserId();
  const title = input.title.trim();
  if (!title) throw new Error("Habit name is required.");

  const preset = input.templateKey ? presetByKey(input.templateKey) : null;
  const frequencyType =
    input.frequencyType ?? preset?.frequencyType ?? "daily";
  const frequencyTarget =
    input.frequencyTarget ?? preset?.frequencyTarget ?? (frequencyType === "daily" ? 7 : 3);

  const { count } = await supabase
    .from("member_goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);

  if ((count ?? 0) >= 10) {
    throw new Error("Keep it focused — pause or remove a habit first (max 10).");
  }

  const row: Record<string, unknown> = {
    user_id: userId,
    title: preset?.label ?? title,
    category: input.category ?? preset?.category ?? "routine",
    sort_order: count ?? 0,
    template_key: input.templateKey ?? CUSTOM_HABIT_PRESET_KEY,
    frequency_type: frequencyType,
    frequency_target: Math.min(7, Math.max(1, frequencyTarget)),
  };

  const { error } = await supabase.from("member_goals").insert(row);
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
  },
) {
  const { supabase, userId } = await requireUserId();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.frequencyType !== undefined) patch.frequency_type = input.frequencyType;
  if (input.frequencyTarget !== undefined) {
    patch.frequency_target = Math.min(7, Math.max(1, input.frequencyTarget));
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

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    throw new Error("Join a private accountability group to share achievements.");
  }

  const { error } = await supabase.from("group_achievement_shares").insert({
    group_id: membership.group_id,
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

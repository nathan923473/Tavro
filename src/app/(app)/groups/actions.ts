"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import { resolveUserGroupId } from "@/lib/data/resolve-user-group-id";
import { generateGroupInviteCode, normalizeGroupInviteCode } from "@/lib/groups/invite-code";
import {
  ACCOUNTABILITY_GROUP_MAX_MEMBERS,
} from "@/lib/copy/accountability-groups";
import { currentWeekStartKey } from "@/lib/groups/week";
import type {
  GroupCheckInReactionKey,
  GroupDailyCheckInStatus,
  GroupFocusType,
  GroupPersonalScheduleType,
} from "@/types";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

export type GroupJoinMode = "approval" | "auto";

export type CreateGroupInput = {
  name: string;
  description?: string;
  focusType?: GroupFocusType;
  focusCustomLabel?: string;
  goal?: string;
  sharedGoal?: string;
  joinMode?: GroupJoinMode;
  maxMembers?: number;
};

function parseOkRpc(data: unknown, messages: Record<string, string>): void {
  const row = data as { ok?: boolean; error?: string } | null;
  if (row?.ok) return;
  const key = row?.error ?? "unknown";
  throw new Error(messages[key] ?? "Something went wrong — try again.");
}

function parseJoinRpcResult(data: unknown):
  | { ok: true; status: string; groupId?: string }
  | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Could not join group." };
  }
  const row = data as { ok?: boolean; status?: string; error?: string; group_id?: string };
  if (row.ok === false) {
    const err = row.error ?? "unknown";
    if (err === "invalid_invite") return { ok: false, error: "Invalid or expired invite." };
    if (err === "invites_disabled") return { ok: false, error: "Invites are disabled for this group." };
    if (err === "full") return { ok: false, error: "This group is full." };
    if (err === "not_authenticated") return { ok: false, error: "Log in to join." };
    if (err === "rate_limited") {
      return { ok: false, error: "Too many attempts — wait a few minutes and try again." };
    }
    return { ok: false, error: "Could not join group." };
  }
  return {
    ok: true,
    status: row.status ?? "joined",
    groupId: row.group_id,
  };
}

async function assertNotInOtherGroup(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  exceptGroupId?: string,
) {
  const currentGroupId = await resolveUserGroupId(supabase, userId);
  if (currentGroupId && currentGroupId !== exceptGroupId) {
    throw new Error(
      "You already belong to a private accountability group. Open the P.A. groups tab — if you do not see it, refresh the page.",
    );
  }
}

export async function createAccountabilityGroupAction(input: CreateGroupInput) {
  const { supabase, userId } = await requireUserId();
  const name = input.name.trim();
  const description = (input.description ?? "").trim();
  const focusType = input.focusType ?? "general";
  const focusCustomLabel = (input.focusCustomLabel ?? "").trim();
  const sharedGoal = (input.sharedGoal ?? input.goal ?? "").trim();
  if (!name) throw new Error("Group name is required.");
  if (focusType === "custom" && focusCustomLabel.length < 2) {
    throw new Error("Describe your custom group focus.");
  }

  await assertNotInOtherGroup(supabase, userId);

  const maxMembers = Math.min(
    ACCOUNTABILITY_GROUP_MAX_MEMBERS,
    Math.max(2, input.maxMembers ?? ACCOUNTABILITY_GROUP_MAX_MEMBERS),
  );
  const joinMode = input.joinMode ?? "approval";

  let inviteCode = generateGroupInviteCode();
  const groupId = randomUUID();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error: groupError } = await supabase.from("accountability_groups").insert({
      id: groupId,
      name,
      description,
      focus_type: focusType,
      focus_custom_label: focusType === "custom" ? focusCustomLabel : "",
      goal: sharedGoal,
      shared_goal: sharedGoal,
      invite_code: inviteCode,
      max_members: maxMembers,
      join_mode: joinMode,
      invites_enabled: true,
      created_by: userId,
    });

    if (!groupError) break;
    if (/invite_code|unique/i.test(groupError.message)) {
      inviteCode = generateGroupInviteCode();
      continue;
    }
    if (/goal|join_mode|invites_enabled|focus_custom|schema cache/i.test(groupError.message)) {
      const { error: legacyError } = await supabase.from("accountability_groups").insert({
        id: groupId,
        name,
        invite_code: inviteCode,
        max_members: maxMembers,
        created_by: userId,
      });
      if (legacyError) throw new Error(legacyError.message);
      break;
    }
    throw new Error(groupError.message);
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
  });
  if (memberError) throw new Error(memberError.message);

  revalidatePath("/groups");
  return { ok: true as const, groupId, inviteCode };
}

export async function requestJoinGroupByInviteCodeAction(code: string) {
  const { supabase, userId } = await requireUserId();
  const normalized = normalizeGroupInviteCode(code);
  if (!normalized) throw new Error("Enter an invite code.");

  await assertNotInOtherGroup(supabase, userId);

  const { data, error } = await supabase.rpc("attempt_group_join", {
    p_code: normalized,
  });

  if (error) {
    if (/attempt_group_join|schema cache/i.test(error.message)) {
      throw new Error(
        "Run migration 026_accountability_groups_enhanced.sql in Supabase, then try again.",
      );
    }
    throw new Error(error.message);
  }

  const parsed = parseJoinRpcResult(data);
  if (!parsed.ok) throw new Error(parsed.error);

  revalidatePath("/groups");
  revalidatePath(`/invite/group/${normalized}`);

  if (parsed.status === "pending") {
    return {
      ok: true as const,
      status: "pending" as const,
      message: "Request sent — the group owner will approve you soon.",
    };
  }
  if (parsed.status === "already_member") {
    return { ok: true as const, status: "joined" as const, message: "You're already in this group." };
  }
  return {
    ok: true as const,
    status: "joined" as const,
    message: "Welcome to the group!",
  };
}

export async function approveGroupJoinRequestAction(requestId: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase.rpc("approve_group_join_request", {
    p_request_id: requestId,
  });
  if (error) {
    if (/approve_group_join_request|schema cache/i.test(error.message)) {
      throw new Error(
        "Run migrations 029 and 036 in Supabase (approve_group_join_request), then try again.",
      );
    }
    throw new Error(error.message);
  }
  const row = data as { ok?: boolean; error?: string };
  if (!row?.ok) {
    if (row?.error === "full") throw new Error("Group is full — free a spot first.");
    if (row?.error === "forbidden") throw new Error("Only the group owner can approve requests.");
    if (row?.error === "not_pending") throw new Error("This request is no longer pending.");
    throw new Error("Could not approve request.");
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function declineGroupJoinRequestAction(requestId: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase.rpc("decline_group_join_request", {
    p_request_id: requestId,
  });
  if (error) {
    if (/decline_group_join_request|schema cache/i.test(error.message)) {
      throw new Error("Run migration 026 in Supabase, then try again.");
    }
    throw new Error(error.message);
  }
  const row = data as { ok?: boolean; error?: string };
  if (row?.ok === false && row.error === "forbidden") {
    throw new Error("Only the group owner can decline requests.");
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function cancelGroupJoinRequestAction(requestId: string) {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase.rpc("cancel_group_join_request", {
    p_request_id: requestId,
  });
  if (error) {
    if (/cancel_group_join_request|schema cache/i.test(error.message)) {
      throw new Error(
        "Run migration 028_group_join_request_cancel.sql in Supabase, then try again.",
      );
    }
    throw new Error(error.message);
  }
  const row = data as { ok?: boolean; error?: string };
  if (!row?.ok) {
    if (row?.error === "not_pending") {
      throw new Error("This request is no longer pending.");
    }
    throw new Error("Could not cancel request.");
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function updateGroupSettingsAction(input: {
  groupId: string;
  name?: string;
  goal?: string;
  description?: string;
  focusType?: GroupFocusType;
  sharedGoal?: string;
  joinMode?: GroupJoinMode;
}) {
  const { supabase, userId } = await requireUserId();
  const { data: group } = await supabase
    .from("accountability_groups")
    .select("id, created_by")
    .eq("id", input.groupId)
    .maybeSingle();
  if (!group || group.created_by !== userId) {
    throw new Error("Only the group owner can change settings.");
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.goal !== undefined) patch.goal = input.goal.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.focusType !== undefined) patch.focus_type = input.focusType;
  if (input.sharedGoal !== undefined) {
    const shared = input.sharedGoal.trim();
    patch.shared_goal = shared;
    patch.goal = shared;
  }
  if (input.joinMode !== undefined) patch.join_mode = input.joinMode;

  if (Object.keys(patch).length === 0) return { ok: true as const };

  const { error } = await supabase
    .from("accountability_groups")
    .update(patch)
    .eq("id", input.groupId)
    .eq("created_by", userId);
  if (error) {
    if (/join_mode|goal|schema cache/i.test(error.message)) {
      throw new Error("Run migration 026_accountability_groups_enhanced.sql in Supabase.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function regenerateGroupInviteAction(groupId: string) {
  const { supabase, userId } = await requireUserId();
  const newCode = generateGroupInviteCode();
  const { error } = await supabase
    .from("accountability_groups")
    .update({ invite_code: newCode, invites_enabled: true })
    .eq("id", groupId)
    .eq("created_by", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  return { ok: true as const, inviteCode: newCode };
}

export async function setGroupInvitesEnabledAction(groupId: string, enabled: boolean) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("accountability_groups")
    .update({ invites_enabled: enabled })
    .eq("id", groupId)
    .eq("created_by", userId);
  if (error) {
    if (/invites_enabled|schema cache/i.test(error.message)) {
      throw new Error("Run migration 026_accountability_groups_enhanced.sql in Supabase.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function removeGroupMemberAction(groupId: string, memberUserId: string) {
  const { supabase, userId } = await requireUserId();
  if (memberUserId === userId) {
    throw new Error("Transfer ownership before leaving, or delete the group.");
  }

  const { data, error } = await supabase.rpc("remove_group_member_by_owner", {
    p_group_id: groupId,
    p_member_user_id: memberUserId,
  });

  if (error) {
    if (/remove_group_member_by_owner|schema cache/i.test(error.message)) {
      const { data: group } = await supabase
        .from("accountability_groups")
        .select("created_by")
        .eq("id", groupId)
        .maybeSingle();
      if (!group || group.created_by !== userId) {
        throw new Error("Only the group owner can remove members.");
      }
      const { error: deleteError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", memberUserId);
      if (deleteError) throw new Error(deleteError.message);
      revalidatePath("/groups");
      return { ok: true as const };
    }
    throw new Error(error.message);
  }

  parseOkRpc(data, {
    forbidden: "Only the group owner can remove members.",
    cannot_remove_self: "Transfer ownership before leaving, or delete the group.",
    not_found: "That member is no longer in the group.",
    unauthenticated: "Log in to manage members.",
  });

  revalidatePath("/groups");
  return { ok: true as const };
}

export async function transferGroupOwnershipAction(groupId: string, newOwnerUserId: string) {
  const { supabase, userId } = await requireUserId();
  const { data: group } = await supabase
    .from("accountability_groups")
    .select("created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (!group || group.created_by !== userId) {
    throw new Error("Only the owner can transfer ownership.");
  }
  const { data: member } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", newOwnerUserId)
    .maybeSingle();
  if (!member) throw new Error("New owner must already be a group member.");

  const { error } = await supabase
    .from("accountability_groups")
    .update({ created_by: newOwnerUserId })
    .eq("id", groupId)
    .eq("created_by", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function deleteAccountabilityGroupAction(groupId: string, confirmName: string) {
  const { supabase, userId } = await requireUserId();
  const { data: group } = await supabase
    .from("accountability_groups")
    .select("name, created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (!group || group.created_by !== userId) {
    throw new Error("Only the owner can delete this group.");
  }
  if (group.name.trim() !== confirmName.trim()) {
    throw new Error("Group name did not match — deletion cancelled.");
  }

  const { error } = await supabase
    .from("accountability_groups")
    .delete()
    .eq("id", groupId)
    .eq("created_by", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function leaveGroupAction(groupIdFromHub?: string) {
  const { supabase, userId } = await requireUserId();

  const groupId =
    groupIdFromHub?.trim() || (await resolveUserGroupId(supabase, userId));
  if (!groupId) return { ok: true as const };

  const { data, error } = await supabase.rpc("leave_accountability_group", {
    p_group_id: groupId,
  });

  if (error) {
    if (/leave_accountability_group|schema cache/i.test(error.message)) {
      const { data: group } = await supabase
        .from("accountability_groups")
        .select("created_by")
        .eq("id", groupId)
        .maybeSingle();

      if (group?.created_by === userId) {
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId);
        if ((count ?? 0) > 1) {
          throw new Error(
            "Transfer ownership to another member before leaving, or delete the group.",
          );
        }
        const { error: deleteGroupError } = await supabase
          .from("accountability_groups")
          .delete()
          .eq("id", groupId)
          .eq("created_by", userId);
        if (deleteGroupError) throw new Error(deleteGroupError.message);
      } else {
        const { error: leaveError } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", userId);
        if (leaveError) throw new Error(leaveError.message);
      }
      revalidatePath("/groups");
      return { ok: true as const };
    }
    throw new Error(error.message);
  }

  parseOkRpc(data, {
    owner_must_transfer:
      "Transfer ownership to another member before leaving, or delete the group.",
    not_member: "You are not in this group anymore.",
    leave_failed: "Could not leave the group — try again.",
    delete_failed: "Could not delete the group — try again.",
    missing_group: "No group selected.",
    unauthenticated: "Log in to leave the group.",
  });

  revalidatePath("/groups");
  return { ok: true as const };
}

export async function postGroupMessageAction(body: string) {
  const { supabase, userId } = await requireUserId();
  const text = body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const groupId = await resolveUserGroupId(supabase, userId);
  if (!groupId) throw new Error("Join a private accountability group first.");

  const { error } = await supabase.from("group_messages").insert({
    group_id: groupId,
    author_id: userId,
    body: text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

export async function saveGroupWeeklyCommitmentAction(input: {
  groupId: string;
  commitmentId?: string;
  title: string;
  targetCount: number;
}) {
  const { supabase, userId } = await requireUserId();
  const title = input.title.trim();
  if (title.length < 2) throw new Error("Describe your commitment in a few words.");
  const targetCount = Math.min(99, Math.max(1, Math.floor(input.targetCount)));
  const weekStart = currentWeekStartKey();

  if (input.commitmentId) {
    const { error } = await supabase
      .from("group_weekly_commitments")
      .update({ title, target_count: targetCount, updated_at: new Date().toISOString() })
      .eq("id", input.commitmentId)
      .eq("user_id", userId)
      .eq("group_id", input.groupId);
    if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  } else {
    const { error } = await supabase.from("group_weekly_commitments").insert({
      group_id: input.groupId,
      user_id: userId,
      week_start: weekStart,
      title,
      target_count: targetCount,
    });
    if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function deleteGroupWeeklyCommitmentAction(commitmentId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("group_weekly_commitments")
    .delete()
    .eq("id", commitmentId)
    .eq("user_id", userId);
  if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function updateGroupCommitmentProgressAction(
  commitmentId: string,
  progressCount: number,
) {
  const { supabase, userId } = await requireUserId();
  const progress = Math.max(0, Math.floor(progressCount));
  const { error } = await supabase
    .from("group_weekly_commitments")
    .update({ progress_count: progress, updated_at: new Date().toISOString() })
    .eq("id", commitmentId)
    .eq("user_id", userId);
  if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function submitGroupDailyCheckInAction(input: {
  groupId: string;
  status: GroupDailyCheckInStatus;
  note?: string;
}) {
  const { supabase, userId } = await requireUserId();
  const note = (input.note ?? "").trim().slice(0, 280);
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("group_member_daily_check_ins").upsert(
    {
      group_id: input.groupId,
      user_id: userId,
      check_in_date: today,
      status: input.status,
      note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,user_id,check_in_date" },
  );
  if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function sendGroupEncouragementAction(input: {
  groupId: string;
  toUserId: string;
  message: string;
}) {
  const { supabase, userId } = await requireUserId();
  const message = input.message.trim();
  if (message.length < 2) throw new Error("Write a short encouraging note.");
  if (input.toUserId === userId) throw new Error("Pick another member to encourage.");

  const { error } = await supabase.from("group_encouragements").insert({
    group_id: input.groupId,
    from_user_id: userId,
    to_user_id: input.toUserId,
    message,
  });
  if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function toggleGroupMessageReactionAction(messageId: string) {
  const { supabase, userId } = await requireUserId();
  const existing = await supabase
    .from("group_message_reactions")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("group_message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
    if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  } else {
    const { error } = await supabase.from("group_message_reactions").insert({
      message_id: messageId,
      user_id: userId,
    });
    if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function setGroupParticipationPauseAction(groupId: string, pausedUntil: string | null) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("group_member_participation").upsert(
    {
      group_id: groupId,
      user_id: userId,
      paused_until: pausedUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,user_id" },
  );
  if (error) throw migrationHint(error.message, "032_group_accountability_hub.sql");
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function saveGroupPersonalGoalAction(input: {
  groupId: string;
  title: string;
  scheduleType: GroupPersonalScheduleType;
  scheduleInterval?: number;
  scheduleWeekdays?: number[];
  timesPerWeek?: number;
}) {
  const { supabase, userId } = await requireUserId();
  const title = input.title.trim();
  if (title.length < 2) throw new Error("Describe your personal goal in a few words.");

  const scheduleType = input.scheduleType;
  const scheduleInterval = Math.min(14, Math.max(1, Math.floor(input.scheduleInterval ?? 2)));
  const timesPerWeek = Math.min(7, Math.max(1, Math.floor(input.timesPerWeek ?? 3)));
  let scheduleWeekdays = (input.scheduleWeekdays ?? [1, 3, 5]).filter(
    (d) => d >= 0 && d <= 6,
  );
  if (scheduleType === "weekdays" && scheduleWeekdays.length === 0) {
    scheduleWeekdays = [1, 3, 5];
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("group_member_personal_goals").upsert(
    {
      group_id: input.groupId,
      user_id: userId,
      title,
      schedule_type: scheduleType,
      schedule_interval: scheduleInterval,
      schedule_weekdays: scheduleWeekdays,
      times_per_week: timesPerWeek,
      schedule_anchor: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id,user_id" },
  );
  if (error) throw migrationHint(error.message, "037_group_personal_goals_and_reactions.sql");
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function toggleGroupCheckInReactionAction(input: {
  groupId: string;
  targetUserId: string;
  checkInDate: string;
  reactionKey: GroupCheckInReactionKey;
}) {
  const { supabase, userId } = await requireUserId();
  if (input.targetUserId === userId) {
    throw new Error("Pick another member's check-in to react to.");
  }

  const existing = await supabase
    .from("group_check_in_reactions")
    .select("reaction_key")
    .eq("group_id", input.groupId)
    .eq("target_user_id", input.targetUserId)
    .eq("check_in_date", input.checkInDate)
    .eq("reactor_user_id", userId)
    .eq("reaction_key", input.reactionKey)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("group_check_in_reactions")
      .delete()
      .eq("group_id", input.groupId)
      .eq("target_user_id", input.targetUserId)
      .eq("check_in_date", input.checkInDate)
      .eq("reactor_user_id", userId)
      .eq("reaction_key", input.reactionKey);
    if (error) throw migrationHint(error.message, "037_group_personal_goals_and_reactions.sql");
  } else {
    const { error } = await supabase.from("group_check_in_reactions").insert({
      group_id: input.groupId,
      target_user_id: input.targetUserId,
      check_in_date: input.checkInDate,
      reactor_user_id: userId,
      reaction_key: input.reactionKey,
    });
    if (error) throw migrationHint(error.message, "037_group_personal_goals_and_reactions.sql");
  }
  revalidatePath("/groups");
  return { ok: true as const };
}

function migrationHint(message: string, migration: string): Error {
  if (
    /schema cache|does not exist|group_weekly|group_member_daily|group_encouragements|group_member_personal_goals|group_check_in_reactions/i.test(
      message,
    )
  ) {
    return new Error(`Run migration ${migration} in Supabase, then try again.`);
  }
  return new Error(message);
}

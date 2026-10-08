"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import { generateGroupInviteCode, normalizeGroupInviteCode } from "@/lib/groups/invite-code";
import {
  ACCOUNTABILITY_GROUP_MAX_MEMBERS,
} from "@/lib/copy/accountability-groups";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

export type GroupJoinMode = "approval" | "auto";

export type CreateGroupInput = {
  name: string;
  goal: string;
  joinMode?: GroupJoinMode;
  maxMembers?: number;
};

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
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membership && membership.group_id !== exceptGroupId) {
    throw new Error(
      "Leave your current private accountability group before joining another.",
    );
  }
}

export async function createAccountabilityGroupAction(input: CreateGroupInput) {
  const { supabase, userId } = await requireUserId();
  const name = input.name.trim();
  const goal = input.goal.trim();
  if (!name) throw new Error("Group name is required.");
  if (!goal) throw new Error("Add your main fitness or healthy habit goal.");

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
      goal,
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
    if (/goal|join_mode|invites_enabled|schema cache/i.test(groupError.message)) {
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
  if (error) throw new Error(error.message);
  const row = data as { ok?: boolean; error?: string };
  if (!row?.ok) {
    if (row?.error === "full") throw new Error("Group is full — free a spot first.");
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
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
  return { ok: true as const };
}

export async function updateGroupSettingsAction(input: {
  groupId: string;
  name?: string;
  goal?: string;
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
  const { data: group } = await supabase
    .from("accountability_groups")
    .select("created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (!group || group.created_by !== userId) {
    throw new Error("Only the owner can remove members.");
  }
  if (memberUserId === userId) {
    throw new Error("Transfer ownership before leaving, or delete the group.");
  }
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId);
  if (error) throw new Error(error.message);
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

export async function leaveGroupAction() {
  const { supabase, userId } = await requireUserId();

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: true as const };

  const { data: group } = await supabase
    .from("accountability_groups")
    .select("created_by")
    .eq("id", membership.group_id)
    .maybeSingle();

  if (group?.created_by === userId) {
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", membership.group_id);
    if ((count ?? 0) > 1) {
      throw new Error(
        "Transfer ownership to another member before leaving, or delete the group.",
      );
    }
    await supabase
      .from("accountability_groups")
      .delete()
      .eq("id", membership.group_id)
      .eq("created_by", userId);
  } else {
    await supabase.from("group_members").delete().eq("user_id", userId);
  }

  revalidatePath("/groups");
  return { ok: true as const };
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

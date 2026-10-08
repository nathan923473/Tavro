import { pickAccountabilityGroupSuccessor } from "@/lib/account-deletion/group-successor";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKETS = ["avatars", "community-media", "challenge-media"] as const;

export class AccountDeletionError extends Error {
  constructor(
    message: string,
    readonly step: string,
  ) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

async function transferAccountabilityGroups(
  admin: SupabaseClient,
  userId: string,
) {
  const { data: owned, error } = await admin
    .from("accountability_groups")
    .select("id")
    .eq("created_by", userId);

  if (error) {
    throw new AccountDeletionError(error.message, "accountability_groups_list");
  }

  for (const group of owned ?? []) {
    const { data: members, error: membersError } = await admin
      .from("group_members")
      .select("user_id, joined_at")
      .eq("group_id", group.id);

    if (membersError) {
      throw new AccountDeletionError(membersError.message, "group_members_list");
    }

    const successor = pickAccountabilityGroupSuccessor(members ?? [], userId);
    if (successor) {
      const { error: updateError } = await admin
        .from("accountability_groups")
        .update({ created_by: successor })
        .eq("id", group.id);
      if (updateError) {
        throw new AccountDeletionError(updateError.message, "group_transfer");
      }
    } else {
      const { error: deleteError } = await admin
        .from("accountability_groups")
        .delete()
        .eq("id", group.id);
      if (deleteError) {
        throw new AccountDeletionError(deleteError.message, "group_delete_empty");
      }
    }
  }

  const { error: leaveError } = await admin
    .from("group_members")
    .delete()
    .eq("user_id", userId);
  if (leaveError) {
    throw new AccountDeletionError(leaveError.message, "group_members_leave");
  }
}

async function archiveCreatorOwnedContent(admin: SupabaseClient, userId: string) {
  const { error: archiveError } = await admin
    .from("challenges")
    .update({
      publish_status: "archived",
      visibility: "private",
      updated_at: new Date().toISOString(),
    })
    .eq("created_by", userId);

  if (archiveError) {
    throw new AccountDeletionError(archiveError.message, "challenges_archive");
  }

  const { error: communityError } = await admin
    .from("creator_communities")
    .delete()
    .eq("owner_id", userId);

  if (communityError) {
    throw new AccountDeletionError(communityError.message, "creator_community_delete");
  }
}

async function removeParticipationAndSocial(admin: SupabaseClient, userId: string) {
  const tables = [
    "community_follows",
    "challenge_participants",
    "challenge_participant_reminders",
    "creator_applications",
  ] as const;

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      throw new AccountDeletionError(error.message, `delete_${table}`);
    }
  }
}

async function listStoragePaths(
  admin: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  const { data, error } = await admin.storage.from(bucket).list(prefix, {
    limit: 200,
  });
  if (error || !data?.length) return paths;

  for (const entry of data) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id == null) {
      const nested = await listStoragePaths(admin, bucket, full);
      paths.push(...nested);
    } else {
      paths.push(full);
    }
  }
  return paths;
}

async function purgeUserStorage(admin: SupabaseClient, userId: string) {
  for (const bucket of STORAGE_BUCKETS) {
    const paths = await listStoragePaths(admin, bucket, userId);
    if (paths.length === 0) continue;
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) {
      throw new AccountDeletionError(
        `Storage cleanup failed (${bucket}): ${error.message}`,
        "storage_cleanup",
      );
    }
  }
}

/**
 * Permanently delete the authenticated user's account.
 * Uses service role — caller must verify identity first.
 */
export async function deleteUserAccount(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new AccountDeletionError(profileError.message, "profile_load");
  }
  if (profile?.is_admin) {
    throw new AccountDeletionError(
      "Admin accounts must be removed by support.",
      "admin_blocked",
    );
  }

  await transferAccountabilityGroups(admin, userId);
  await removeParticipationAndSocial(admin, userId);
  await archiveCreatorOwnedContent(admin, userId);
  await purgeUserStorage(admin, userId);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    throw new AccountDeletionError(authError.message, "auth_delete");
  }
}

import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function listUserGroupCandidateIds(
  supabase: ServerSupabase,
  userId: string,
): Promise<string[]> {
  const rpc = await supabase.rpc("list_my_accountability_group_ids");
  if (!rpc.error && rpc.data) {
    const rows = Array.isArray(rpc.data) ? rpc.data : [rpc.data];
    const ids = rows
      .map((row) =>
        row && typeof row === "object" && "group_id" in row
          ? String((row as { group_id: string }).group_id)
          : null,
      )
      .filter((id): id is string => Boolean(id));
    if (ids.length) return ids;
  }

  const seen = new Set<string>();
  const ordered: string[] = [];

  const { data: ownedRows } = await supabase
    .from("accountability_groups")
    .select("id")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  for (const row of ownedRows ?? []) {
    if (row?.id && !seen.has(row.id)) {
      seen.add(row.id);
      ordered.push(row.id);
    }
  }

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  for (const row of memberRows ?? []) {
    if (row?.group_id && !seen.has(row.group_id)) {
      seen.add(row.group_id);
      ordered.push(row.group_id);
    }
  }

  return ordered;
}

async function ensureOwnerMembership(
  supabase: ServerSupabase,
  groupId: string,
  userId: string,
) {
  const { data: ownerMembership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!ownerMembership) {
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: userId,
    });
  }
}

/**
 * Picks the accountability group hub to show for this user.
 * Owners always resolve to the group they created (fixes arbitrary limit(1) membership rows).
 */
export async function resolveUserGroupId(
  supabase: ServerSupabase,
  userId: string,
): Promise<string | null> {
  const candidates = await listUserGroupCandidateIds(supabase, userId);
  const primary = candidates[0] ?? null;
  if (!primary) return null;

  const { data: ownedCheck } = await supabase
    .from("accountability_groups")
    .select("id")
    .eq("id", primary)
    .eq("created_by", userId)
    .maybeSingle();

  if (ownedCheck?.id) {
    await ensureOwnerMembership(supabase, primary, userId);
  }

  return primary;
}

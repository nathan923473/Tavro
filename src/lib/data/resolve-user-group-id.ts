import type { createClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Picks the accountability group hub to show for this user.
 * Owners always resolve to the group they created (fixes arbitrary limit(1) membership rows).
 */
export async function resolveUserGroupId(
  supabase: ServerSupabase,
  userId: string,
): Promise<string | null> {
  const { data: owned } = await supabase
    .from("accountability_groups")
    .select("id")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (owned?.id) {
    const { data: ownerMembership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", owned.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!ownerMembership) {
      await supabase.from("group_members").insert({
        group_id: owned.id,
        user_id: userId,
      });
    }

    return owned.id;
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return membership?.group_id ?? null;
}

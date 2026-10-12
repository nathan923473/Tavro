import { createClient } from "@/lib/supabase/server";
import { listUserGroupCandidateIds } from "@/lib/data/resolve-user-group-id";
export type UserAccountabilityGroupOption = {
  id: string;
  name: string;
};

export async function fetchUserAccountabilityGroups(
  userId: string,
): Promise<UserAccountabilityGroupOption[]> {
  const supabase = await createClient();
  const ids = await listUserGroupCandidateIds(supabase, userId);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("accountability_groups")
    .select("id, name")
    .in("id", ids);

  return (data ?? []).map((g) => ({
    id: g.id as string,
    name: String(g.name),
  }));
}

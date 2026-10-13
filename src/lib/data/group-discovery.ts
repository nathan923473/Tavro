import { createClient } from "@/lib/supabase/server";
import type { DiscoverableGroupCard, GroupCheckInFrequency } from "@/lib/groups/discovery";
import type { GroupFocusType } from "@/types";

export async function fetchDiscoveryEligibility(userId: string): Promise<{
  eligible: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_group_discovery_eligible", {
    p_user_id: userId,
  });
  if (error) {
    if (/is_group_discovery_eligible|adult_verified|schema cache/i.test(error.message)) {
      return { eligible: false };
    }
  }
  return { eligible: Boolean(data) };
}

export async function fetchDiscoverableGroups(filters: {
  focus?: GroupFocusType | "";
  checkInFrequency?: GroupCheckInFrequency | "";
}): Promise<DiscoverableGroupCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_discoverable_groups", {
    p_focus: filters.focus || null,
    p_check_in_frequency: filters.checkInFrequency || null,
    p_limit: 24,
  });

  if (error) {
    if (/list_discoverable_groups|schema cache/i.test(error.message)) {
      return [];
    }
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name ?? "Group"),
    focusType: (row.focus_type as GroupFocusType) ?? "general",
    focusCustomLabel: String(row.focus_custom_label ?? ""),
    memberCount: Number(row.member_count ?? 0),
    maxMembers: Number(row.max_members ?? 6),
    checkInFrequency: (row.check_in_frequency as GroupCheckInFrequency) ?? "flexible",
    discoverySummary: String(row.discovery_summary ?? ""),
  }));
}

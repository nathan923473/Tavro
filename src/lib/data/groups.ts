import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/data/relations";
import { formatTimeAgo, todayDateKey } from "@/lib/dates";
import type { AccountabilityGroup, GroupActivity } from "@/types";

export async function fetchUserGroup(userId: string): Promise<{
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
}> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { group: null, feed: [] };
  }

  const groupId = membership.group_id;

  const { data: groupRow } = await supabase
    .from("accountability_groups")
    .select("id, name, invite_code, max_members")
    .eq("id", groupId)
    .single();

  if (!groupRow) return { group: null, feed: [] };

  const { data: members } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      profile:profiles!group_members_user_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId);

  const today = todayDateKey();
  const memberIds = (members ?? []).map((m) => m.user_id);

  let checkedInToday = new Set<string>();
  if (memberIds.length) {
    const { data: checkins } = await supabase
      .from("daily_check_ins")
      .select("user_id")
      .in("user_id", memberIds)
      .eq("check_in_date", today);
    checkedInToday = new Set((checkins ?? []).map((c) => c.user_id));
  }

  const { data: messages } = await supabase
    .from("group_messages")
    .select(
      `
      id, body, created_at,
      author:profiles!group_messages_author_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(20);

  const feed: GroupActivity[] = (messages ?? []).map((m) => ({
    id: m.id,
    author: unwrapOne(m.author)?.display_name ?? "Member",
    message: m.body,
    timeAgo: formatTimeAgo(m.created_at),
    reactions: 0,
  }));

  const group: AccountabilityGroup = {
    id: groupRow.id,
    name: groupRow.name,
    memberCount: members?.length ?? 0,
    maxMembers: groupRow.max_members,
    checkInStreak: 0,
    recentMessage: feed[0]?.message ?? "Say hi to your private accountability group!",
    inviteCode: groupRow.invite_code,
    members: (members ?? []).map((m) => ({
      id: m.user_id,
      displayName: unwrapOne(m.profile)?.display_name ?? "Member",
      checkedInToday: checkedInToday.has(m.user_id),
    })),
  };

  return { group, feed };
}

export async function fetchGroupByInviteCode(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_group_by_invite_code", {
    p_code: code.trim(),
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

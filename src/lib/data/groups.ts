import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/data/relations";
import { formatTimeAgo, todayDateKey } from "@/lib/dates";
import type { AccountabilityGroup, GroupActivity, GroupJoinRequest } from "@/types";

export type UserGroupState = {
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
  pendingJoin: { groupId: string; groupName: string } | null;
};

export async function fetchUserGroup(userId: string): Promise<UserGroupState> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    const pending = await fetchPendingJoinForUser(supabase, userId);
    return { group: null, feed: [], pendingJoin: pending };
  }

  const groupId = membership.group_id;
  const loaded = await loadGroupHub(supabase, groupId, userId);
  return { ...loaded, pendingJoin: null };
}

async function fetchPendingJoinForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const pendingReq = await supabase
    .from("group_join_requests")
    .select(
      `
      group_id,
      status,
      group:accountability_groups ( name )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (
    pendingReq.error &&
    /group_join_requests|schema cache/i.test(pendingReq.error.message)
  ) {
    return null;
  }

  if (!pendingReq.data) return null;
  const group = unwrapOne(pendingReq.data.group);
  return {
    groupId: pendingReq.data.group_id as string,
    groupName: group?.name ?? "Private group",
  };
}

async function loadGroupHub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  userId: string,
): Promise<{ group: AccountabilityGroup | null; feed: GroupActivity[] }> {
  const groupSelect =
    "id, name, goal, invite_code, max_members, join_mode, invites_enabled, created_by";

  let groupRow: Record<string, unknown> | null = null;
  const full = await supabase
    .from("accountability_groups")
    .select(groupSelect)
    .eq("id", groupId)
    .single();

  if (full.error && /goal|join_mode|invites_enabled|schema cache/i.test(full.error.message)) {
    const legacy = await supabase
      .from("accountability_groups")
      .select("id, name, invite_code, max_members, created_by")
      .eq("id", groupId)
      .single();
    groupRow = legacy.data as Record<string, unknown> | null;
  } else {
    groupRow = full.data as Record<string, unknown> | null;
  }

  if (!groupRow) return { group: null, feed: [] };

  const membersWithAvatar = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      profile:profiles!group_members_user_id_fkey ( display_name, avatar_url )
    `,
    )
    .eq("group_id", groupId);

  type MemberRow = {
    user_id: string;
    profile:
      | { display_name: string | null; avatar_url?: string | null }
      | { display_name: string | null; avatar_url?: string | null }[]
      | null;
  };

  let members: MemberRow[] | null = membersWithAvatar.data as MemberRow[] | null;
  if (
    membersWithAvatar.error &&
    /avatar_url|schema cache/i.test(membersWithAvatar.error.message)
  ) {
    const fallback = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        profile:profiles!group_members_user_id_fkey ( display_name )
      `,
      )
      .eq("group_id", groupId);
    members = fallback.data as MemberRow[] | null;
  }

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
      id, body, created_at, author_id,
      author:profiles!group_messages_author_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(20);

  const feed: GroupActivity[] = (messages ?? []).map((m) => ({
    id: m.id,
    authorId: m.author_id,
    author: unwrapOne(m.author)?.display_name ?? "Member",
    message: m.body,
    timeAgo: formatTimeAgo(m.created_at),
    reactions: 0,
  }));

  const ownerId = String(groupRow.created_by ?? "");
  const isOwner = ownerId === userId;

  let pendingRequests: GroupJoinRequest[] = [];
  if (isOwner) {
    const reqRes = await supabase
      .from("group_join_requests")
      .select(
        `
        id, user_id, created_at,
        profile:profiles!group_join_requests_user_id_fkey ( display_name, avatar_url )
      `,
      )
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!reqRes.error) {
      pendingRequests = (reqRes.data ?? []).map((r) => {
        const profile = unwrapOne(r.profile);
        return {
          id: r.id,
          userId: r.user_id,
          displayName: profile?.display_name ?? "Member",
          avatarUrl:
            profile && "avatar_url" in profile && typeof profile.avatar_url === "string"
              ? profile.avatar_url
              : null,
          createdAt: r.created_at,
        };
      });
    }
  }

  const group: AccountabilityGroup = {
    id: String(groupRow.id),
    name: String(groupRow.name),
    goal: typeof groupRow.goal === "string" ? groupRow.goal : "",
    memberCount: members?.length ?? 0,
    maxMembers: Number(groupRow.max_members ?? 6),
    checkInStreak: 0,
    recentMessage: feed[0]?.message ?? "Say hi to your group!",
    inviteCode: String(groupRow.invite_code),
    joinMode:
      groupRow.join_mode === "auto" ? "auto" : "approval",
    invitesEnabled: groupRow.invites_enabled !== false,
    ownerId,
    isOwner,
    pendingRequests,
    members: (members ?? []).map((m) => {
      const profile = unwrapOne(m.profile);
      return {
        id: m.user_id,
        displayName: profile?.display_name ?? "Member",
        avatarUrl:
          profile && "avatar_url" in profile && typeof profile.avatar_url === "string"
            ? profile.avatar_url
            : null,
        checkedInToday: checkedInToday.has(m.user_id),
      };
    }),
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

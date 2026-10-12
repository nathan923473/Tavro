import { createClient } from "@/lib/supabase/server";
import { listUserGroupCandidateIds } from "@/lib/data/resolve-user-group-id";
import { unwrapOne } from "@/lib/data/relations";
import { formatTimeAgo, todayDateKey } from "@/lib/dates";
import { currentWeekStartKey, previousWeekStartKey } from "@/lib/groups/week";
import { ACCOUNTABILITY_GROUP_MIN_MEMBERS } from "@/lib/copy/accountability-groups";
import {
  isPersonalGoalScheduledToday,
  scheduleLabel,
} from "@/lib/groups/goal-schedule";
import { fetchGroupSharedCommitments } from "@/lib/data/group-shared-commitments";
import { ensureMemberGoalsSharedWithGroup } from "@/lib/groups/auto-share-member-goals";
import type {
  AccountabilityGroup,
  GroupActivity,
  GroupCheckInReactionKey,
  GroupDailyCheckInStatus,
  GroupFeedItem,
  GroupFocusType,
  GroupJoinRequest,
  GroupMemberPersonalGoal,
  GroupWeeklyReflection,
  GroupWeeklyRecap,
} from "@/types";

const EMPTY_REACTIONS = (): Record<GroupCheckInReactionKey, number> => ({
  clap: 0,
  fire: 0,
  muscle: 0,
  heart: 0,
});

function isReactionKey(v: string): v is GroupCheckInReactionKey {
  return v === "clap" || v === "fire" || v === "muscle" || v === "heart";
}

export type PendingGroupJoin = {
  requestId: string;
  groupId: string;
  groupName: string;
  groupGoal: string;
  memberCount: number | null;
  maxMembers: number;
  joinMode: "approval" | "auto";
};

export type UserGroupState = {
  group: AccountabilityGroup | null;
  feed: GroupActivity[];
  pendingJoin: PendingGroupJoin | null;
  /** Set when the account is linked to a group row but the hub could not be loaded. */
  existingGroupBlocked?: boolean;
};

export async function fetchUserGroup(userId: string): Promise<UserGroupState> {
  const supabase = await createClient();

  const candidateIds = await listUserGroupCandidateIds(supabase, userId);
  for (const groupId of candidateIds) {
    const loaded = await loadGroupHub(supabase, groupId, userId);
    if (loaded.group) {
      return { ...loaded, pendingJoin: null };
    }
  }

  const pending = await fetchPendingJoinForUser(supabase, userId);
  return {
    group: null,
    feed: [],
    pendingJoin: pending,
    existingGroupBlocked: candidateIds.length > 0,
  };
}

async function fetchPendingJoinForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  _userId: string,
): Promise<PendingGroupJoin | null> {
  const rpc = await supabase.rpc("get_my_pending_group_join");
  if (!rpc.error && rpc.data) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    if (row && typeof row === "object" && "request_id" in row) {
      const r = row as Record<string, unknown>;
      return {
        requestId: String(r.request_id),
        groupId: String(r.group_id),
        groupName: String(r.group_name ?? "Private group"),
        groupGoal: String(r.group_goal ?? ""),
        memberCount: typeof r.member_count === "number" ? r.member_count : null,
        maxMembers: Number(r.max_members ?? 6),
        joinMode: r.join_mode === "auto" ? "auto" : "approval",
      };
    }
  }

  const pendingReq = await supabase
    .from("group_join_requests")
    .select(
      `
      id,
      group_id,
      status,
      group:accountability_groups ( name, goal, max_members, join_mode )
    `,
    )
    .eq("user_id", _userId)
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
    requestId: String(pendingReq.data.id),
    groupId: pendingReq.data.group_id as string,
    groupName: group?.name ?? "Private group",
    groupGoal: group && "goal" in group && typeof group.goal === "string" ? group.goal : "",
    memberCount: null,
    maxMembers: Number(group && "max_members" in group ? group.max_members : 6),
    joinMode:
      group && "join_mode" in group && group.join_mode === "auto" ? "auto" : "approval",
  };
}

async function fetchGroupRowForViewer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
): Promise<Record<string, unknown> | null> {
  const rpc = await supabase.rpc("get_accountability_group_for_viewer", {
    p_group_id: groupId,
  });
  if (!rpc.error && rpc.data) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    if (row && typeof row === "object") {
      return row as Record<string, unknown>;
    }
  }

  const groupSelect =
    "id, name, goal, description, shared_goal, focus_type, focus_custom_label, invite_code, max_members, join_mode, invites_enabled, visibility, discovery_paused, check_in_frequency, discovery_summary, created_by";

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
    return legacy.data as Record<string, unknown> | null;
  }

  if (full.error || !full.data) {
    return null;
  }

  return full.data as Record<string, unknown>;
}

async function loadGroupHub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  userId: string,
): Promise<{ group: AccountabilityGroup | null; feed: GroupActivity[] }> {
  const groupRow = await fetchGroupRowForViewer(supabase, groupId);

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
  const weekStart = currentWeekStartKey();

  let checkInBoard: AccountabilityGroup["checkInBoard"] = [];
  let viewerCheckInStatus: GroupDailyCheckInStatus | null = null;

  const boardRpc = await supabase.rpc("get_group_check_in_board", {
    p_group_id: groupId,
    p_date: today,
  });
  let boardRows: AccountabilityGroup["checkInBoard"] = [];
  if (!boardRpc.error && boardRpc.data) {
    const rows = Array.isArray(boardRpc.data) ? boardRpc.data : [boardRpc.data];
    boardRows = rows
      .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
      .map((r) => {
        const statusRaw = String(r.status ?? "");
        const status = ["completed", "partial", "missed", "rest"].includes(statusRaw)
          ? (statusRaw as GroupDailyCheckInStatus)
          : null;
        if (r.user_id === userId) viewerCheckInStatus = status;
        return {
          userId: String(r.user_id),
          displayName: String(r.display_name ?? "Member"),
          avatarUrl: typeof r.avatar_url === "string" ? r.avatar_url : null,
          status,
          note: String(r.note ?? ""),
          checkedIn: Boolean(r.checked_in),
          scheduledToday: true,
          personalGoalTitle: "",
          reactions: EMPTY_REACTIONS(),
          viewerReactionKeys: [] as GroupCheckInReactionKey[],
        };
      });
  }

  const weekStartKey = weekStart;
  let weeklyCommitments: AccountabilityGroup["weeklyCommitments"] = [];
  const commitmentsRes = await supabase
    .from("group_weekly_commitments")
    .select(
      `
      id, user_id, title, target_count, progress_count,
      profile:profiles!group_weekly_commitments_user_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .eq("week_start", weekStartKey)
    .order("sort_order", { ascending: true });

  if (!commitmentsRes.error) {
    weeklyCommitments = (commitmentsRes.data ?? []).map((c) => {
      const profile = unwrapOne(c.profile);
      return {
        id: c.id,
        userId: c.user_id,
        displayName: profile?.display_name ?? "Member",
        title: c.title,
        targetCount: c.target_count,
        progressCount: c.progress_count,
        isOwn: c.user_id === userId,
      };
    });
  }

  const weekCheckInCounts = new Map<string, number>();
  const weekCheckInsRes = await supabase
    .from("group_member_daily_check_ins")
    .select("user_id, status")
    .eq("group_id", groupId)
    .gte("check_in_date", weekStartKey)
    .lte("check_in_date", today);
  if (!weekCheckInsRes.error) {
    for (const row of weekCheckInsRes.data ?? []) {
      if (row.status === "completed" || row.status === "partial") {
        weekCheckInCounts.set(
          row.user_id as string,
          (weekCheckInCounts.get(row.user_id as string) ?? 0) + 1,
        );
      }
    }
  }

  const personalGoalsByUser = new Map<string, GroupMemberPersonalGoal>();
  const personalGoalsRes = await supabase
    .from("group_member_personal_goals")
    .select(
      "user_id, title, schedule_type, schedule_interval, schedule_weekdays, times_per_week, schedule_anchor",
    )
    .eq("group_id", groupId);
  if (!personalGoalsRes.error) {
    for (const g of personalGoalsRes.data ?? []) {
      const scheduleType = g.schedule_type as GroupMemberPersonalGoal["scheduleType"];
      const goal: GroupMemberPersonalGoal = {
        userId: g.user_id as string,
        title: String(g.title),
        scheduleType,
        scheduleInterval: Number(g.schedule_interval ?? 1),
        scheduleWeekdays: Array.isArray(g.schedule_weekdays)
          ? (g.schedule_weekdays as number[])
          : [],
        timesPerWeek: Number(g.times_per_week ?? 3),
        scheduleAnchor: String(g.schedule_anchor ?? today),
        scheduleLabel: "",
      };
      goal.scheduleLabel = scheduleLabel(goal);
      personalGoalsByUser.set(goal.userId, goal);
    }
  }

  const sharedGoalFallback =
    typeof groupRow.shared_goal === "string" && groupRow.shared_goal
      ? groupRow.shared_goal
      : typeof groupRow.goal === "string"
        ? groupRow.goal
        : "Stay consistent with our group focus";

  function defaultGoalForUser(memberUserId: string): GroupMemberPersonalGoal {
    const ownCommitment = weeklyCommitments.find((c) => c.userId === memberUserId);
    const title = ownCommitment?.title ?? sharedGoalFallback;
    const scheduleType: GroupMemberPersonalGoal["scheduleType"] = ownCommitment
      ? "times_per_week"
      : "daily";
    const goal: GroupMemberPersonalGoal = {
      userId: memberUserId,
      title,
      scheduleType,
      scheduleInterval: 2,
      scheduleWeekdays: [1, 3, 5],
      timesPerWeek: ownCommitment?.targetCount ?? 3,
      scheduleAnchor: weekStartKey,
      scheduleLabel: "",
    };
    goal.scheduleLabel = scheduleLabel(goal);
    return goal;
  }

  const reactionMap = new Map<
    string,
    { counts: Record<GroupCheckInReactionKey, number>; viewer: GroupCheckInReactionKey[] }
  >();
  const reactionsRes = await supabase
    .from("group_check_in_reactions")
    .select("target_user_id, check_in_date, reaction_key, reactor_user_id")
    .eq("group_id", groupId)
    .gte("check_in_date", weekStartKey);
  if (!reactionsRes.error) {
    for (const r of reactionsRes.data ?? []) {
      const key = `${r.target_user_id}:${r.check_in_date}`;
      let bucket = reactionMap.get(key);
      if (!bucket) {
        bucket = { counts: EMPTY_REACTIONS(), viewer: [] };
        reactionMap.set(key, bucket);
      }
      const rk = String(r.reaction_key);
      if (isReactionKey(rk)) {
        bucket.counts[rk] += 1;
        if (r.reactor_user_id === userId) bucket.viewer.push(rk);
      }
    }
  }

  checkInBoard = boardRows.map((m) => {
    const goal = personalGoalsByUser.get(m.userId) ?? defaultGoalForUser(m.userId);
    const weekDone = weekCheckInCounts.get(m.userId) ?? 0;
    const scheduledToday = isPersonalGoalScheduledToday(goal, today, weekDone);
    const reactKey = `${m.userId}:${today}`;
    const react = reactionMap.get(reactKey);
    return {
      ...m,
      scheduledToday,
      personalGoalTitle: goal.title,
      reactions: react?.counts ?? EMPTY_REACTIONS(),
      viewerReactionKeys: react?.viewer ?? [],
    };
  });

  const checkedInToday = new Set(
    checkInBoard.filter((m) => m.checkedIn).map((m) => m.userId),
  );

  let viewerPersonalGoal: GroupMemberPersonalGoal | null =
    personalGoalsByUser.get(userId) ?? null;
  if (!viewerPersonalGoal) {
    viewerPersonalGoal = defaultGoalForUser(userId);
  }
  const viewerScheduledToday = isPersonalGoalScheduledToday(
    viewerPersonalGoal,
    today,
    weekCheckInCounts.get(userId) ?? 0,
  );

  const memberPersonalGoals: GroupMemberPersonalGoal[] = (members ?? []).map((m) => {
    const uid = m.user_id;
    return personalGoalsByUser.get(uid) ?? defaultGoalForUser(uid);
  });

  let recentCheckIns: AccountabilityGroup["recentCheckIns"] = [];
  const recentCheckInsRes = await supabase
    .from("group_member_daily_check_ins")
    .select(
      `
      user_id, status, note, check_in_date, updated_at,
      profile:profiles!group_member_daily_check_ins_user_id_fkey ( display_name, avatar_url )
    `,
    )
    .eq("group_id", groupId)
    .order("check_in_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(12);

  if (!recentCheckInsRes.error) {
    recentCheckIns = (recentCheckInsRes.data ?? []).map((row) => {
      const profile = unwrapOne(row.profile);
      const status = row.status as GroupDailyCheckInStatus;
      const checkInDate = String(row.check_in_date);
      const react = reactionMap.get(`${row.user_id}:${checkInDate}`);
      return {
        userId: row.user_id as string,
        displayName: profile?.display_name ?? "Member",
        avatarUrl:
          profile && "avatar_url" in profile && typeof profile.avatar_url === "string"
            ? profile.avatar_url
            : null,
        status,
        note: String(row.note ?? ""),
        checkInDate,
        timeAgo: formatTimeAgo(String(row.updated_at ?? row.check_in_date)),
        reactions: react?.counts ?? EMPTY_REACTIONS(),
        viewerReactionKeys: react?.viewer ?? [],
      };
    });
  }

  let viewerPausedUntil: string | null = null;
  const participationRes = await supabase
    .from("group_member_participation")
    .select("paused_until")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!participationRes.error && participationRes.data?.paused_until) {
    viewerPausedUntil = participationRes.data.paused_until as string;
  }

  const messagesWithImage = await supabase
    .from("group_messages")
    .select(
      `
      id, body, created_at, author_id, image_path,
      author:profiles!group_messages_author_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(30);

  const messagesRes =
    messagesWithImage.error && /image_path|schema cache/i.test(messagesWithImage.error.message)
      ? await supabase
          .from("group_messages")
          .select(
            `
            id, body, created_at, author_id,
            author:profiles!group_messages_author_id_fkey ( display_name )
          `,
          )
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(30)
      : messagesWithImage;

  const messages = messagesRes.data ?? [];
  const messageIds = messages.map((m) => m.id);
  const reactionCounts = new Map<string, number>();
  if (messageIds.length) {
    const { data: reactions, error: reactionsError } = await supabase
      .from("group_message_reactions")
      .select("message_id")
      .in("message_id", messageIds);
    if (!reactionsError) {
      for (const r of reactions ?? []) {
        reactionCounts.set(r.message_id, (reactionCounts.get(r.message_id) ?? 0) + 1);
      }
    }
  }

  type FeedRow = GroupFeedItem & { sortAt: string };
  const feedRows: FeedRow[] = messages.map((m) => ({
    id: m.id,
    kind: "message" as const,
    authorId: m.author_id,
    author: unwrapOne(m.author)?.display_name ?? "Member",
    message: m.body,
    timeAgo: formatTimeAgo(m.created_at),
    reactions: reactionCounts.get(m.id) ?? 0,
    messageId: m.id,
    sortAt: m.created_at,
  }));

  const { data: shares } = await supabase
    .from("group_achievement_shares")
    .select(
      `
      id, message, created_at, user_id,
      profile:profiles!group_achievement_shares_user_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(15);

  for (const s of shares ?? []) {
    feedRows.push({
      id: `share-${s.id}`,
      kind: "achievement",
      authorId: s.user_id,
      author: unwrapOne(s.profile)?.display_name ?? "Member",
      message: s.message,
      timeAgo: formatTimeAgo(s.created_at),
      reactions: 0,
      sortAt: s.created_at,
    });
  }

  const encouragementsRes = await supabase
    .from("group_encouragements")
    .select(
      `
      id, message, created_at, from_user_id,
      from:profiles!group_encouragements_from_user_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!encouragementsRes.error) {
    for (const e of encouragementsRes.data ?? []) {
      feedRows.push({
        id: `enc-${e.id}`,
        kind: "encouragement",
        authorId: e.from_user_id,
        author: unwrapOne(e.from)?.display_name ?? "Member",
        message: e.message,
        timeAgo: formatTimeAgo(e.created_at),
        reactions: 0,
        sortAt: e.created_at,
      });
    }
  }

  feedRows.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
  const feed: GroupActivity[] = feedRows.slice(0, 25).map(({ sortAt: _s, ...item }) => item);

  const memberCount = members?.length ?? 0;
  const weeklyRecap = buildWeeklyRecap({
    weekStart: previousWeekStartKey(weekStart),
    commitments: weeklyCommitments,
    checkInBoard,
    encouragementsCount: encouragementsRes.data?.length ?? 0,
  });

  const ownerId = String(groupRow.created_by ?? "");
  let isOwner = ownerId === userId;

  if (!isOwner) {
    const ownerRpc = await supabase.rpc("is_accountability_group_owner", {
      p_group_id: groupId,
    });
    if (!ownerRpc.error && ownerRpc.data === true) {
      isOwner = true;
    }
  }

  let pendingRequests: GroupJoinRequest[] = [];
  const pendingRpc = await supabase.rpc("list_group_pending_join_requests", {
    p_group_id: groupId,
  });

  if (!pendingRpc.error && pendingRpc.data) {
    const rows = Array.isArray(pendingRpc.data) ? pendingRpc.data : [pendingRpc.data];
    pendingRequests = rows
      .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
      .map((r) => ({
        id: String(r.id),
        userId: String(r.user_id),
        displayName: String(r.display_name ?? "Member"),
        avatarUrl: typeof r.avatar_url === "string" ? r.avatar_url : null,
        createdAt: String(r.created_at ?? ""),
        requestSource:
          r.request_source === "discovery"
            ? ("discovery" as const)
            : ("invite" as const),
      }));
    if (pendingRequests.length > 0) {
      isOwner = true;
    }
  } else if (isOwner) {
    const reqRes = await supabase
      .from("group_join_requests")
      .select("id, user_id, created_at")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!reqRes.error) {
      pendingRequests = (reqRes.data ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        displayName: "Member",
        avatarUrl: null,
        createdAt: r.created_at,
      }));
    }
  }

  const focusRaw = String(groupRow.focus_type ?? "general");
  const focusType = (
    ["walking", "gym", "nutrition", "weight_loss", "routines", "general", "custom"].includes(
      focusRaw,
    )
      ? focusRaw
      : "general"
  ) as GroupFocusType;
  const focusCustomLabel =
    typeof groupRow.focus_custom_label === "string" ? groupRow.focus_custom_label : "";

  await ensureMemberGoalsSharedWithGroup(supabase, userId, groupId);

  const [sharedCommitments, weeklyReflections] = await Promise.all([
    fetchGroupSharedCommitments(supabase, groupId, userId),
    loadWeeklyReflections(supabase, groupId, userId, weekStart),
  ]);

  const group: AccountabilityGroup = {
    id: String(groupRow.id),
    name: String(groupRow.name),
    goal: typeof groupRow.goal === "string" ? groupRow.goal : "",
    description: typeof groupRow.description === "string" ? groupRow.description : "",
    focusType,
    focusCustomLabel,
    sharedGoal:
      typeof groupRow.shared_goal === "string" && groupRow.shared_goal
        ? groupRow.shared_goal
        : typeof groupRow.goal === "string"
          ? groupRow.goal
          : "",
    memberCount,
    maxMembers: Number(groupRow.max_members ?? 6),
    minMembers: ACCOUNTABILITY_GROUP_MIN_MEMBERS,
    isActive: memberCount >= ACCOUNTABILITY_GROUP_MIN_MEMBERS,
    checkInStreak: 0,
    recentMessage: feed[0]?.message ?? "Say hi to your group!",
    inviteCode: String(groupRow.invite_code),
    joinMode:
      groupRow.join_mode === "auto" ? "auto" : "approval",
    invitesEnabled: groupRow.invites_enabled !== false,
    visibility:
      groupRow.visibility === "discoverable" ? "discoverable" : "private",
    discoveryPaused: groupRow.discovery_paused === true,
    checkInFrequency:
      groupRow.check_in_frequency === "daily" ||
      groupRow.check_in_frequency === "weekdays" ||
      groupRow.check_in_frequency === "weekly" ||
      groupRow.check_in_frequency === "flexible"
        ? groupRow.check_in_frequency
        : "flexible",
    discoverySummary:
      typeof groupRow.discovery_summary === "string" ? groupRow.discovery_summary : "",
    ownerId,
    isOwner,
    pendingRequests,
    weekStart,
    weeklyCommitments,
    checkInBoard,
    viewerCheckInStatus,
    viewerPausedUntil,
    weeklyRecap,
    viewerPersonalGoal,
    memberPersonalGoals,
    recentCheckIns,
    viewerScheduledToday,
    sharedCommitments,
    weeklyReflections,
    members: (members ?? []).map((m) => {
      const profile = unwrapOne(m.profile);
      return {
        id: m.user_id,
        displayName: profile?.display_name ?? "Member",
        avatarUrl:
          profile && "avatar_url" in profile && typeof profile.avatar_url === "string"
            ? profile.avatar_url
            : null,
        checkedInToday:
          checkInBoard.length > 0
            ? checkInBoard.some((b) => b.userId === m.user_id && b.checkedIn)
            : checkedInToday.has(m.user_id),
      };
    }),
  };

  return { group, feed };
}

async function loadWeeklyReflections(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  viewerUserId: string,
  weekStart: string,
): Promise<GroupWeeklyReflection[]> {
  const res = await supabase
    .from("group_weekly_reflections")
    .select(
      `
      id, user_id, week_start, went_well, struggled_with, focus_next,
      profile:profiles!group_weekly_reflections_user_id_fkey ( display_name )
    `,
    )
    .eq("group_id", groupId)
    .eq("week_start", weekStart)
    .order("updated_at", { ascending: false });

  if (res.error && /group_weekly_reflections|schema cache/i.test(res.error.message)) {
    return [];
  }

  return (res.data ?? []).map((row) => {
    const profile = unwrapOne(row.profile);
    return {
      id: row.id as string,
      userId: row.user_id as string,
      displayName: profile?.display_name ?? "Member",
      weekStart: String(row.week_start),
      wentWell: String(row.went_well ?? ""),
      struggledWith: String(row.struggled_with ?? ""),
      focusNext: String(row.focus_next ?? ""),
      isOwn: row.user_id === viewerUserId,
    };
  });
}

function buildWeeklyRecap(input: {
  weekStart: string;
  commitments: AccountabilityGroup["weeklyCommitments"];
  checkInBoard: AccountabilityGroup["checkInBoard"];
  encouragementsCount: number;
}): GroupWeeklyRecap | null {
  if (!input.commitments.length && !input.checkInBoard.length) return null;

  const totals = input.commitments.reduce(
    (acc, c) => {
      acc.target += c.targetCount;
      acc.done += Math.min(c.progressCount, c.targetCount);
      return acc;
    },
    { target: 0, done: 0 },
  );

  const pct =
    totals.target > 0 ? Math.round((totals.done / totals.target) * 100) : 0;
  const checkInsCount = input.checkInBoard.filter((m) => m.checkedIn).length;

  const highlights: string[] = [];
  if (pct >= 70) highlights.push("Strong commitment follow-through this week.");
  if (checkInsCount > 0) {
    highlights.push(`${checkInsCount} member check-in${checkInsCount === 1 ? "" : "s"} logged today.`);
  }
  if (input.encouragementsCount > 0) {
    highlights.push("Members sent supportive encouragement.");
  }
  if (!highlights.length) {
    highlights.push("Every small step counts — keep showing up for each other.");
  }

  return {
    weekStart: input.weekStart,
    commitmentCompletionPct: pct,
    checkInsCount,
    encouragementsCount: input.encouragementsCount,
    highlights,
    reflectionPrompt:
      "What was your biggest challenge this week, and what will you do differently next week?",
  };
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

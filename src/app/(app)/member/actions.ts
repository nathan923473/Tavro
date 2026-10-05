"use server";

import { createClient } from "@/lib/supabase/server";
import { todayDateKey } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { randomBytes, randomUUID } from "node:crypto";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log in required.");
  return { supabase, userId: user.id };
}

function slugify(text: string) {
  return `${text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24)}-${randomBytes(3).toString("hex")}`;
}

export async function completeOnboarding(input: {
  focusGoal: string;
  habit: string;
  createGroup: boolean;
  inviteCode?: string;
}) {
  const { supabase, userId } = await requireUserId();

  const goals = [
    { title: input.habit, category: "routine", sort_order: 0 },
    {
      title: input.focusGoal,
      category: "mindfulness",
      sort_order: 1,
    },
  ];

  await supabase.from("member_goals").delete().eq("user_id", userId);
  await supabase.from("member_goals").insert(
    goals.map((g) => ({ ...g, user_id: userId })),
  );

  if (input.inviteCode?.trim()) {
    await joinGroupByInviteCode(input.inviteCode.trim());
  } else if (input.createGroup) {
    await createAccountabilityGroup(`${input.habit} circle`);
  }

  revalidatePath("/");
  return { ok: true as const };
}

export async function checkInTodayAction() {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("daily_check_ins").upsert(
    { user_id: userId, check_in_date: todayDateKey() },
    { onConflict: "user_id,check_in_date" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function toggleGoalAction(goalId: string) {
  const { supabase, userId } = await requireUserId();
  const today = todayDateKey();

  const { data: existing } = await supabase
    .from("goal_completions")
    .select("goal_id")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .eq("completion_date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("goal_completions")
      .delete()
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .eq("completion_date", today);
  } else {
    await supabase.from("goal_completions").insert({
      goal_id: goalId,
      user_id: userId,
      completion_date: today,
    });
  }
  revalidatePath("/");
  revalidatePath("/progress");
}

export async function joinChallengeAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("challenge_participants").upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      progress_percent: 5,
    },
    { onConflict: "challenge_id,user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/challenges");
  revalidatePath("/");
  revalidatePath(`/join`);
}

export async function leaveChallengeAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);
  revalidatePath("/challenges");
  revalidatePath("/");
}

export async function logChallengeActivityAction(challengeId: string) {
  const { supabase, userId } = await requireUserId();
  const { data: row } = await supabase
    .from("challenge_participants")
    .select("progress_percent")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();

  const next = Math.min(100, (row?.progress_percent ?? 0) + 8);
  const { error } = await supabase
    .from("challenge_participants")
    .update({
      progress_percent: next,
      last_activity_date: todayDateKey(),
    })
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/challenges");
}

export async function postChallengeMessageAction(input: {
  challengeId: string;
  body: string;
  role: "creator" | "member";
}) {
  const { supabase, userId } = await requireUserId();
  const text = input.body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const { error } = await supabase.from("challenge_messages").insert({
    challenge_id: input.challengeId,
    author_id: userId,
    author_role: input.role,
    body: text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/challenges");
  revalidatePath("/studio");
}

export async function toggleFollowCommunityAction(communityId: string) {
  const { supabase, userId } = await requireUserId();
  const { data: existing } = await supabase
    .from("community_follows")
    .select("community_id")
    .eq("user_id", userId)
    .eq("community_id", communityId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("community_follows")
      .delete()
      .eq("user_id", userId)
      .eq("community_id", communityId);
  } else {
    await supabase.from("community_follows").insert({
      user_id: userId,
      community_id: communityId,
    });
  }
  revalidatePath("/following");
  revalidatePath("/challenges");
  revalidatePath("/creator");
}

export async function updateCommunityAnnouncementAction(
  communityId: string,
  announcement: string,
) {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("creator_communities")
    .update({ announcement, updated_at: new Date().toISOString() })
    .eq("id", communityId)
    .eq("owner_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/studio");
  revalidatePath("/creator/dashboard");
}

export async function saveCommunityAction(formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const communityName = String(formData.get("community_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const brandColor = String(formData.get("brand_color") ?? "#3d8b6e");
  const shopUrl = String(formData.get("shop_url") ?? "").trim();
  const affiliateDisclosure = String(
    formData.get("affiliate_disclosure") ?? "",
  ).trim();
  let slug = String(formData.get("slug") ?? "").trim();

  if (!communityName) throw new Error("Community name is required.");

  const { data: existing } = await supabase
    .from("creator_communities")
    .select("id, slug")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!existing) {
    if (!slug) slug = slugify(communityName);
    const { error } = await supabase.from("creator_communities").insert({
      owner_id: userId,
      slug,
      community_name: communityName,
      bio,
      brand_color: brandColor,
      shop_url: shopUrl || null,
      affiliate_disclosure: affiliateDisclosure || null,
    });
    if (error) throw new Error(error.message);
  } else {
    slug = existing.slug;
    const { error } = await supabase
      .from("creator_communities")
      .update({
        community_name: communityName,
        bio,
        brand_color: brandColor,
        shop_url: shopUrl || null,
        affiliate_disclosure: affiliateDisclosure || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/creator/${slug}`);
  revalidatePath(`/creator/${slug}/edit`);
  revalidatePath("/studio");
  return { ok: true as const, slug };
}

export async function createAccountabilityGroup(name: string) {
  const { supabase, userId } = await requireUserId();

  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existingMembership) {
    throw new Error(
      "Leave your current private accountability group before creating another.",
    );
  }

  const inviteCode = randomBytes(5).toString("hex");
  const groupId = randomUUID();
  const { error: groupError } = await supabase
    .from("accountability_groups")
    .insert({
      id: groupId,
      name: name.trim() || "My private accountability group",
      invite_code: inviteCode,
      created_by: userId,
    });

  if (groupError) throw new Error(groupError.message);

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
  });
  if (memberError) throw new Error(memberError.message);

  revalidatePath("/groups");
  return { inviteCode };
}

export async function joinGroupByInviteCode(code: string) {
  const { supabase, userId } = await requireUserId();

  const { data: rows, error: lookupError } = await supabase.rpc(
    "get_group_by_invite_code",
    { p_code: code.trim() },
  );
  if (lookupError) throw new Error(lookupError.message);
  const group = Array.isArray(rows) ? rows[0] : rows;
  if (!group) throw new Error("Invalid private accountability group invite code.");

  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((count ?? 0) >= group.max_members) {
    throw new Error("This private accountability group is full.");
  }

  await supabase.from("group_members").upsert(
    { group_id: group.id, user_id: userId },
    { onConflict: "group_id,user_id" },
  );

  revalidatePath("/groups");
}

export async function leaveGroupAction() {
  const { supabase, userId } = await requireUserId();
  await supabase.from("group_members").delete().eq("user_id", userId);
  revalidatePath("/groups");
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

export async function addWeighInAction(weightLb: number) {
  const { supabase, userId } = await requireUserId();
  if (!Number.isFinite(weightLb) || weightLb <= 0) {
    throw new Error("Enter a valid weight.");
  }
  const { error } = await supabase.from("weekly_weigh_ins").upsert(
    {
      user_id: userId,
      recorded_date: todayDateKey(),
      weight_lb: weightLb,
    },
    { onConflict: "user_id,recorded_date" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/progress");
}

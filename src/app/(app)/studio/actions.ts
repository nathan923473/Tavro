"use server";

import { requireApprovedCreator } from "@/lib/auth/profile";
import { templateByKey, type ChallengeTemplateKey } from "@/lib/creator/challenge-templates";
import { creatorChallengePath } from "@/lib/data/creator-studio";
import type { ChallengeCategory, ChallengePublishStatus } from "@/types/creator-studio";
import { revalidatePath } from "next/cache";
import { publishedWindowsFromRows } from "@/lib/challenge-lifecycle/creator-windows";
import { validatePublishAgainstLimits } from "@/lib/challenge-lifecycle/schedule-validation";
import {
  buildFixedInstantScheduleFields,
  resolveChallengeEndAt,
  resolveChallengeStartAt,
} from "@/lib/timezone/challenge-fields";
import { zonedExclusiveEndToUtc } from "@/lib/timezone/instant";
import { isValidIanaTimezone } from "@/lib/timezone/validate";

function slugify(title: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}`;
}

function revalidateStudio(communitySlug?: string) {
  revalidatePath("/studio");
  revalidatePath("/studio/challenges");
  revalidatePath("/studio/analytics");
  revalidatePath("/studio/announcements");
  revalidatePath("/studio/shop");
  revalidatePath("/studio/settings");
  revalidatePath("/creator/analytics");
  if (communitySlug) {
    revalidatePath(`/creator/${communitySlug}`);
  }
}

async function requireOwnerCommunity(supabase: Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>, userId: string) {
  const { data } = await supabase
    .from("creator_communities")
    .select("id, slug")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Create your community in Studio → Community first.");
  return data;
}

async function assertOwnsChallenge(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  challengeId: string,
) {
  const { data } = await supabase
    .from("challenges")
    .select("id, community_id, invite_slug, publish_status")
    .eq("id", challengeId)
    .eq("created_by", userId)
    .maybeSingle();
  if (!data) throw new Error("Challenge not found.");
  return data;
}

export async function saveChallengeDraftAction(input: {
  challengeId?: string;
  templateKey?: ChallengeTemplateKey;
  title: string;
  shortDescription: string;
  description: string;
  goalDescription: string;
  category: ChallengeCategory;
  startDate: string;
  endDate: string;
  startTimeLocal: string;
  challengeTimezone: string;
  schedule: Array<{
    dayLabel: string;
    title: string;
    body: string;
    isRest: boolean;
    weekTheme?: string;
  }>;
  allowLateJoin?: boolean;
  lateJoinUntilDate?: string | null;
}) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const client = await createClient();
  const community = await requireOwnerCommunity(client, user.id);

  const title = input.title.trim();
  if (!title) throw new Error("Challenge name is required.");
  if (!input.startDate || !input.endDate || input.endDate < input.startDate) {
    throw new Error("Choose valid start and end dates.");
  }
  if (!isValidIanaTimezone(input.challengeTimezone)) {
    throw new Error("Choose a valid challenge timezone.");
  }

  const template = input.templateKey ? templateByKey(input.templateKey) : null;
  const instantFields = buildFixedInstantScheduleFields({
    startDate: input.startDate,
    endDate: input.endDate,
    startTimeLocal: input.startTimeLocal,
    challengeTimezone: input.challengeTimezone,
  });

  const row: Record<string, unknown> = {
    created_by: user.id,
    community_id: community.id,
    title,
    description: input.description.trim() || template?.goalDescription || "",
    short_description: input.shortDescription.trim() || null,
    goal_description: input.goalDescription.trim() || null,
    category: input.category,
    start_date: input.startDate,
    end_date: input.endDate,
    ...instantFields,
    visibility: "public",
    publish_status: "draft" satisfies ChallengePublishStatus,
    allow_late_join: Boolean(input.allowLateJoin),
    late_join_until:
      input.allowLateJoin && input.lateJoinUntilDate
        ? zonedExclusiveEndToUtc(input.lateJoinUntilDate, instantFields.challenge_timezone).toISOString()
        : null,
  };

  let challengeId = input.challengeId;

  if (challengeId) {
    const existing = await assertOwnsChallenge(client, user.id, challengeId);
    if (existing.publish_status === "published") {
      const { count } = await client
        .from("challenge_participants")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId);
      if ((count ?? 0) > 0) {
        throw new Error(
          "This challenge already has participants. Duplicate it to edit structure safely.",
        );
      }
    }
    const { error } = await client.from("challenges").update(row).eq("id", challengeId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await client
      .from("challenges")
      .insert({ ...row, invite_slug: slugify(title) })
      .select("id")
      .single();
    if (error) {
      if (/publish_status|short_description|goal_description|category/i.test(error.message)) {
        const { data: legacy, error: legacyErr } = await client
          .from("challenges")
          .insert({
            created_by: user.id,
            community_id: community.id,
            title,
            description: String(row.description),
            start_date: input.startDate,
            end_date: input.endDate,
            visibility: "public",
            invite_slug: slugify(title),
          })
          .select("id")
          .single();
        if (legacyErr) throw new Error(legacyErr.message);
        challengeId = legacy.id;
      } else {
        throw new Error(error.message);
      }
    } else {
      challengeId = data.id;
    }
  }

  if (!challengeId) throw new Error("Could not save draft.");

  await client.from("challenge_schedule_items").delete().eq("challenge_id", challengeId);
  const scheduleRows = input.schedule.map((item, i) => ({
    challenge_id: challengeId,
    sort_order: i,
    day_label: item.dayLabel,
    title: item.title,
    body: item.body || null,
    is_rest: item.isRest,
    week_theme: item.weekTheme ?? null,
  }));
  if (scheduleRows.length) {
    const { error: schedErr } = await client
      .from("challenge_schedule_items")
      .insert(scheduleRows);
    if (schedErr && !/challenge_schedule|schema cache/i.test(schedErr.message)) {
      throw new Error(schedErr.message);
    }
  }

  const { data: coverRow } = await client
    .from("challenges")
    .select("cover_url")
    .eq("id", challengeId)
    .single();

  revalidateStudio(community.slug);
  return {
    challengeId,
    communitySlug: community.slug,
    coverUrl: (coverRow?.cover_url as string | null) ?? null,
  };
}

export async function publishChallengeAction(challengeId: string) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const community = await requireOwnerCommunity(supabase, user.id);
  await assertOwnsChallenge(supabase, user.id, challengeId);

  const { data: ch } = await supabase
    .from("challenges")
    .select("invite_slug, title, community_id, start_at, schedule_mode")
    .eq("id", challengeId)
    .single();

  const { data: full } = await supabase
    .from("challenges")
    .select(
      "id, title, publish_status, start_date, end_date, start_at, end_at, challenge_timezone, schedule_mode, cover_url",
    )
    .eq("id", challengeId)
    .single();

  const { challengeHasCover, CHALLENGE_COVER_REQUIRED_MESSAGE } = await import(
    "@/lib/challenge-lifecycle/cover-required"
  );
  if (!challengeHasCover(full?.cover_url)) {
    throw new Error(CHALLENGE_COVER_REQUIRED_MESSAGE);
  }

  if (full?.schedule_mode !== "start_anytime" && !full?.start_at) {
    throw new Error(
      "Set a start date, time, and timezone before publishing. Save the challenge again after migration 021.",
    );
  }

  const { data: siblingRows } = await supabase
    .from("challenges")
    .select(
      "id, title, publish_status, start_date, end_date, start_at, end_at, challenge_timezone",
    )
    .eq("created_by", user.id)
    .in("publish_status", ["published", "scheduled"]);

  const windows = publishedWindowsFromRows(siblingRows ?? []);
  const startAt = full
    ? resolveChallengeStartAt({
        start_date: full.start_date,
        start_at: full.start_at,
        challenge_timezone: full.challenge_timezone,
      })
    : null;
  const endAt = full
    ? resolveChallengeEndAt({
        end_date: full.end_date,
        end_at: full.end_at,
        challenge_timezone: full.challenge_timezone,
      })
    : null;

  const validation = validatePublishAgainstLimits(
    { id: challengeId, startAt, endAtExclusive: endAt },
    windows,
  );
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const patch = {
    publish_status: "published" as const,
    published_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("challenges").update(patch).eq("id", challengeId);
  if (error) {
    if (/publish_status|schema cache/i.test(error.message)) {
      throw new Error("Run migration 011_creator_studio.sql in Supabase.");
    }
    throw new Error(error.message);
  }

  const { recordPlatformEvent } = await import("@/lib/analytics/record-event");
  await recordPlatformEvent({
    eventType: "challenge_published",
    userId: user.id,
    creatorId: user.id,
    challengeId,
    idempotencyKey: `challenge_published:${challengeId}`,
  });

  revalidateStudio(community.slug);
  revalidatePath(`/join/${ch?.invite_slug}`);
  if (community?.slug && ch?.invite_slug) {
    revalidatePath(`/creator/${community.slug}/challenges/${ch.invite_slug}`);
  }
  const creatorPath = creatorChallengePath(community.slug, ch?.invite_slug ?? "");
  try {
    const { notifyFollowersNewChallenge } = await import("@/lib/data/notifications");
    if (ch?.community_id && ch.title) {
      await notifyFollowersNewChallenge(ch.community_id, ch.title, creatorPath);
    }
  } catch {
    /* notifications optional until migration 016 */
  }

  return {
    invitePath: `/join/${ch?.invite_slug}`,
    creatorPath,
  };
}

export async function duplicateChallengeAction(challengeId: string) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const community = await requireOwnerCommunity(supabase, user.id);
  const source = await assertOwnsChallenge(supabase, user.id, challengeId);

  const { data: full } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!full) throw new Error("Challenge not found.");

  const { data: created, error } = await supabase
    .from("challenges")
    .insert({
      created_by: user.id,
      community_id: community.id,
      title: `${full.title} (copy)`,
      description: full.description,
      short_description: full.short_description ?? null,
      goal_description: full.goal_description ?? null,
      category: full.category ?? null,
      start_date: full.start_date,
      end_date: full.end_date,
      challenge_timezone: full.challenge_timezone ?? null,
      start_at: full.start_at ?? null,
      end_at: full.end_at ?? null,
      schedule_mode: full.schedule_mode ?? "fixed_instant",
      cover_url: full.cover_url ?? null,
      allow_late_join: full.allow_late_join ?? false,
      late_join_until: full.late_join_until ?? null,
      visibility: "public",
      invite_slug: slugify(full.title),
      publish_status: "draft",
      duplicated_from_id: challengeId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { data: schedule } = await supabase
    .from("challenge_schedule_items")
    .select("sort_order, day_label, title, body, is_rest, week_theme")
    .eq("challenge_id", challengeId);

  if (schedule?.length) {
    await supabase.from("challenge_schedule_items").insert(
      schedule.map((s) => ({
        challenge_id: created.id,
        sort_order: s.sort_order,
        day_label: s.day_label,
        title: s.title,
        body: s.body,
        is_rest: s.is_rest,
        week_theme: s.week_theme,
      })),
    );
  }

  revalidateStudio(community.slug);
  return { challengeId: created.id };
}

export async function createAnnouncementAction(input: {
  communityId: string;
  challengeId?: string | null;
  title: string;
  body: string;
  imageUrl?: string;
  publishAt?: string;
}) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, slug")
    .eq("id", input.communityId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!community) throw new Error("Not your community.");

  const { error } = await supabase.from("creator_announcements").insert({
    community_id: input.communityId,
    challenge_id: input.challengeId || null,
    title: input.title.trim(),
    body: input.body.trim(),
    image_url: input.imageUrl?.trim() || null,
    publish_at: input.publishAt ?? new Date().toISOString(),
    created_by: user.id,
  });

  if (error) {
    if (/creator_announcements|schema cache/i.test(error.message)) {
      throw new Error("Run migration 011_creator_studio.sql in Supabase.");
    }
    throw new Error(error.message);
  }

  revalidateStudio(community.slug);
  try {
    const { notifyFollowersAnnouncement } = await import("@/lib/data/notifications");
    const { data: meta } = await supabase
      .from("creator_communities")
      .select("community_name")
      .eq("id", input.communityId)
      .maybeSingle();
    await notifyFollowersAnnouncement(
      input.communityId,
      meta?.community_name ?? "Creator",
      input.title.trim(),
      `/following`,
    );
  } catch {
    /* optional */
  }
}

export async function upsertCreatorLinkAction(input: {
  communityId: string;
  id?: string;
  linkType: string;
  label: string;
  url: string;
  isPublic: boolean;
  sortOrder: number;
}) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, slug")
    .eq("id", input.communityId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!community) throw new Error("Not your community.");

  const row = {
    community_id: input.communityId,
    link_type: input.linkType,
    label: input.label.trim(),
    url: input.url.trim(),
    is_public: input.isPublic,
    sort_order: input.sortOrder,
  };

  if (input.id) {
    const { error } = await supabase
      .from("creator_links")
      .update(row)
      .eq("id", input.id)
      .eq("community_id", input.communityId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("creator_links").insert(row);
    if (error) {
      if (/creator_links|schema cache/i.test(error.message)) {
        throw new Error("Run migration 011_creator_studio.sql in Supabase.");
      }
      throw new Error(error.message);
    }
  }

  revalidateStudio(community.slug);
}

export async function publishChallengeFormAction(challengeId: string) {
  await publishChallengeAction(challengeId);
}

export async function duplicateChallengeRedirectAction(challengeId: string) {
  const { challengeId: newId } = await duplicateChallengeAction(challengeId);
  const { redirect } = await import("next/navigation");
  redirect(`/studio/challenges/${newId}`);
}

export async function deleteChallengeAction(challengeId: string) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const community = await requireOwnerCommunity(supabase, user.id);
  const owned = await assertOwnsChallenge(supabase, user.id, challengeId);

  const { data: ch } = await supabase
    .from("challenges")
    .select("invite_slug")
    .eq("id", challengeId)
    .single();

  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", challengeId)
    .eq("created_by", user.id);

  if (error) {
    if (/policy|permission|42501/i.test(error.message)) {
      throw new Error(
        "Delete is not allowed yet — run migration 020_creator_delete_challenges.sql in Supabase.",
      );
    }
    throw new Error(error.message);
  }

  revalidateStudio(community.slug);
  revalidatePath("/challenges");
  revalidatePath("/discover");
  if (ch?.invite_slug) {
    revalidatePath(`/join/${ch.invite_slug}`);
  }
  if (community.slug && owned.invite_slug) {
    revalidatePath(`/creator/${community.slug}/challenges/${owned.invite_slug}`);
  }

  return { ok: true as const };
}

export async function deleteChallengeFormAction(challengeId: string) {
  await deleteChallengeAction(challengeId);
  const { redirect } = await import("next/navigation");
  redirect("/studio/challenges");
}

export async function deleteCreatorLinkAction(communityId: string, linkId: string) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase
    .from("creator_links")
    .delete()
    .eq("id", linkId)
    .eq("community_id", communityId);
  if (error) throw new Error(error.message);
  revalidateStudio();
}

export async function saveCompletionOfferAction(formData: FormData) {
  const { user } = await requireApprovedCreator();
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const communityId = String(formData.get("communityId") ?? "").trim();
  const enabled = formData.get("enabled") === "on";
  const linkIdRaw = String(formData.get("linkId") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const offerMessage = String(formData.get("offerMessage") ?? "").trim();

  if (!communityId) throw new Error("Missing community.");

  const { data: community } = await supabase
    .from("creator_communities")
    .select("id, slug")
    .eq("id", communityId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!community) throw new Error("Not your community.");

  let linkId: string | null = linkIdRaw || null;
  if (enabled) {
    if (!linkId) {
      throw new Error("Choose a public link for the completion offer.");
    }
    const { data: link } = await supabase
      .from("creator_links")
      .select("id, is_public")
      .eq("id", linkId)
      .eq("community_id", communityId)
      .maybeSingle();
    if (!link?.is_public) {
      throw new Error("Completion offer link must be a public shop link.");
    }
  } else {
    linkId = linkIdRaw || null;
  }

  const { error } = await supabase
    .from("creator_communities")
    .update({
      completion_offer_enabled: enabled,
      completion_offer_link_id: enabled ? linkId : linkId,
      completion_offer_headline: headline || null,
      completion_offer_message: offerMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", communityId)
    .eq("owner_id", user.id);

  if (error) {
    if (/completion_offer|schema cache/i.test(error.message)) {
      throw new Error("Run migration 038_creator_completion_offer.sql in Supabase.");
    }
    throw new Error(error.message);
  }

  revalidateStudio(community.slug);
  return { ok: true as const };
}

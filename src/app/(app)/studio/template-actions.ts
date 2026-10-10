"use server";

import { requireApprovedCreator } from "@/lib/auth/profile";
import { CATEGORY_LABELS, type TemplateScheduleItem } from "@/lib/creator/challenge-templates";
import { isTemplateTableMissing, parseTemplateSchedule } from "@/lib/creator/personal-templates";
import { fetchChallengeSchedule } from "@/lib/data/creator-studio";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeCategory } from "@/types/creator-studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const CATEGORIES = new Set<ChallengeCategory>(Object.keys(CATEGORY_LABELS) as ChallengeCategory[]);
const TEMPLATE_LIMIT = 40;

export type PersonalTemplateDraftInput = {
  title: string;
  shortDescription: string;
  description: string;
  goalDescription: string;
  category: ChallengeCategory;
  participantSummary?: string;
  schedule: TemplateScheduleItem[];
};

function cleanDraft(input: PersonalTemplateDraftInput) {
  const title = input.title.trim().slice(0, 120);
  if (title.length < 2) throw new Error("Add a challenge name before saving a template.");
  const schedule = parseTemplateSchedule(input.schedule);
  if (!schedule) throw new Error("Add at least one day before saving a template.");
  const category = CATEGORIES.has(input.category) ? input.category : "other";
  const shortDescription = input.shortDescription.trim().slice(0, 280);
  const participantSummary =
    input.participantSummary?.trim().slice(0, 280) ||
    shortDescription ||
    "Participants follow this daily plan and check in.";

  return {
    title,
    short_description: shortDescription || null,
    description: input.description.trim().slice(0, 2000) || null,
    goal_description: input.goalDescription.trim().slice(0, 2000) || null,
    category,
    duration_days: schedule.length,
    participant_summary: participantSummary,
    schedule,
  };
}

async function insertTemplate(
  userId: string,
  row: ReturnType<typeof cleanDraft>,
) {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("creator_challenge_templates")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  if (countError) {
    if (isTemplateTableMissing(countError.message)) {
      throw new Error("Run migration 043_creator_challenge_templates.sql in Supabase, then try again.");
    }
    throw new Error(countError.message);
  }
  if ((count ?? 0) >= TEMPLATE_LIMIT) {
    throw new Error("You already have 40 personal templates. Delete one before saving another.");
  }

  const { error } = await supabase.from("creator_challenge_templates").insert({
    owner_id: userId,
    ...row,
  });
  if (error) {
    if (isTemplateTableMissing(error.message)) {
      throw new Error("Run migration 043_creator_challenge_templates.sql in Supabase, then try again.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/studio/challenges/templates");
}

export async function savePersonalTemplateFromDraftAction(input: PersonalTemplateDraftInput) {
  const { user } = await requireApprovedCreator();
  await insertTemplate(user.id, cleanDraft(input));
  return { ok: true as const };
}

export async function saveChallengeAsPersonalTemplateAction(challengeId: string) {
  const { user } = await requireApprovedCreator();
  const supabase = await createClient();
  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("id, title, short_description, description, goal_description, category, created_by")
    .eq("id", challengeId)
    .eq("created_by", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!challenge) throw new Error("Challenge not found.");

  const schedule = await fetchChallengeSchedule(challengeId);
  if (!schedule.length) throw new Error("Add a schedule before saving this challenge as a template.");

  try {
    await insertTemplate(
      user.id,
      cleanDraft({
        title: challenge.title,
        shortDescription: challenge.short_description ?? "",
        description: challenge.description ?? "",
        goalDescription: challenge.goal_description ?? "",
        category: CATEGORIES.has(challenge.category as ChallengeCategory)
          ? (challenge.category as ChallengeCategory)
          : "other",
        schedule: schedule.map((item) => ({
          dayLabel: item.dayLabel,
          title: item.title,
          body: item.body ?? "",
          isRest: item.isRest,
          weekTheme: item.weekTheme,
        })),
      }),
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save template.";
    redirect(
      `/studio/challenges/${challengeId}?error=${encodeURIComponent(message.slice(0, 180))}`,
    );
  }

  redirect(`/studio/challenges/${challengeId}?notice=template_saved`);
}

export async function deletePersonalTemplateAction(formData: FormData) {
  const { user } = await requireApprovedCreator();
  const templateId = String(formData.get("template_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(templateId)) {
    redirect("/studio/challenges/templates?error=invalid");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("creator_challenge_templates")
    .delete()
    .eq("id", templateId)
    .eq("owner_id", user.id);
  if (error) {
    if (isTemplateTableMissing(error.message)) {
      redirect("/studio/challenges/templates?error=migration");
    }
    redirect("/studio/challenges/templates?error=delete");
  }
  revalidatePath("/studio/challenges/templates");
  redirect("/studio/challenges/templates?notice=deleted");
}

import type { ChallengeTemplate, TemplateScheduleItem } from "@/lib/creator/challenge-templates";
import { CATEGORY_LABELS } from "@/lib/creator/challenge-templates";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeCategory } from "@/types/creator-studio";

export type PersonalChallengeTemplate = ChallengeTemplate & {
  id: string;
};

const CATEGORIES = new Set<ChallengeCategory>(Object.keys(CATEGORY_LABELS) as ChallengeCategory[]);

export function isTemplateTableMissing(message: string) {
  return /creator_challenge_templates|schema cache|does not exist/i.test(message);
}

function asCategory(value: unknown): ChallengeCategory {
  return typeof value === "string" && CATEGORIES.has(value as ChallengeCategory)
    ? (value as ChallengeCategory)
    : "other";
}

export function parseTemplateSchedule(value: unknown): TemplateScheduleItem[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 400) return null;
  const schedule: TemplateScheduleItem[] = [];
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const dayLabel =
      typeof row.dayLabel === "string" && row.dayLabel.trim()
        ? row.dayLabel.trim()
        : `Day ${index + 1}`;
    schedule.push({
      dayLabel: dayLabel.slice(0, 40),
      title: title.slice(0, 200),
      body: typeof row.body === "string" ? row.body.slice(0, 2000) : "",
      isRest: row.isRest === true,
      weekTheme:
        typeof row.weekTheme === "string" && row.weekTheme.trim()
          ? row.weekTheme.trim().slice(0, 80)
          : null,
    });
  }
  return schedule;
}

function asPersonalTemplate(row: Record<string, unknown>): PersonalChallengeTemplate | null {
  if (typeof row.id !== "string" || typeof row.title !== "string") return null;
  const schedule = parseTemplateSchedule(row.schedule);
  if (!schedule) return null;
  const duration = schedule.length;
  return {
    id: row.id,
    key: row.id,
    label: row.title,
    category: asCategory(row.category),
    title: row.title,
    shortDescription: typeof row.short_description === "string" ? row.short_description : "",
    description: typeof row.description === "string" ? row.description : "",
    goalDescription: typeof row.goal_description === "string" ? row.goal_description : "",
    durationDays: duration,
    participantSummary:
      typeof row.participant_summary === "string" && row.participant_summary.trim()
        ? row.participant_summary
        : "Your saved daily plan.",
    schedule,
  };
}

export async function listPersonalChallengeTemplates(userId: string): Promise<
  | { status: "ok"; templates: PersonalChallengeTemplate[] }
  | { status: "migration" }
  | { status: "error" }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_challenge_templates")
    .select(
      "id, title, short_description, description, goal_description, category, duration_days, participant_summary, schedule",
    )
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isTemplateTableMissing(error.message)) return { status: "migration" };
    return { status: "error" };
  }

  const templates = (data ?? [])
    .map((row) => asPersonalTemplate(row as Record<string, unknown>))
    .filter((template): template is PersonalChallengeTemplate => template !== null);

  return { status: "ok", templates };
}

export async function getPersonalChallengeTemplate(
  userId: string,
  templateId: string,
): Promise<PersonalChallengeTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_challenge_templates")
    .select(
      "id, title, short_description, description, goal_description, category, duration_days, participant_summary, schedule",
    )
    .eq("owner_id", userId)
    .eq("id", templateId)
    .maybeSingle();

  if (error || !data) return null;
  return asPersonalTemplate(data as Record<string, unknown>);
}

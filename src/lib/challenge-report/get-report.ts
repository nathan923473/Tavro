import { buildCreatorChallengeWindow } from "@/lib/challenge-lifecycle/creator-windows";
import { computeChallengeReport, reportFromPayload, toStoredPayload } from "./compute";
import { createClient } from "@/lib/supabase/server";
import type {
  ChallengeReport,
  ChallengeReportCompletionInput,
  ChallengeReportInput,
  ChallengeReportParticipantInput,
  ChallengeReportScheduleItemInput,
} from "@/types/challenge-report";

const PAGE_SIZE = 1000;

export type CreatorChallengeReportResult =
  | { status: "not_found" }
  | { status: "not_completed"; title: string }
  | {
      status: "ready";
      report: ChallengeReport;
      persisted: boolean;
      notice: "saved" | "storage_unavailable" | "partial";
    };

type ChallengeRow = {
  id: string;
  title: string;
  category?: string | null;
  start_date: string;
  end_date: string;
  start_at?: string | null;
  end_at?: string | null;
  challenge_timezone?: string | null;
  publish_status?: string | null;
  community_id?: string | null;
};

function missingReportsTable(message: string) {
  return /creator_challenge_reports/i.test(message);
}

function isUniqueViolation(error: { code?: string; message?: string }) {
  return error.code === "23505" || /duplicate key|unique constraint/i.test(error.message ?? "");
}

function isCompletedChallenge(row: ChallengeRow) {
  if (row.publish_status === "archived") return true;
  if (row.publish_status === "draft") return false;
  const window = buildCreatorChallengeWindow({
    id: row.id,
    title: row.title,
    publish_status: row.publish_status ?? "published",
    start_date: row.start_date,
    end_date: row.end_date,
    start_at: row.start_at ?? null,
    end_at: row.end_at ?? null,
    challenge_timezone: row.challenge_timezone ?? null,
  });
  return window?.phase === "completed";
}

async function fetchChallenge(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
  userId: string,
): Promise<ChallengeRow | null> {
  const full =
    "id, title, category, community_id, start_date, end_date, start_at, end_at, challenge_timezone, publish_status";
  const legacy =
    "id, title, start_date, end_date, start_at, end_at, challenge_timezone";

  const first = await supabase
    .from("challenges")
    .select(full)
    .eq("id", challengeId)
    .eq("created_by", userId)
    .maybeSingle();

  if (!first.error) return (first.data as ChallengeRow | null) ?? null;
  if (!/publish_status|category|community_id|schema cache/i.test(first.error.message)) {
    throw new Error(first.error.message);
  }

  const second = await supabase
    .from("challenges")
    .select(legacy)
    .eq("id", challengeId)
    .eq("created_by", userId)
    .maybeSingle();
  if (second.error) throw new Error(second.error.message);
  return (second.data as ChallengeRow | null) ?? null;
}

async function fetchPages<T>(
  load: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < 20000; from += PAGE_SIZE) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchParticipants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
): Promise<ChallengeReportParticipantInput[]> {
  const full =
    "user_id, progress_percent, joined_at, last_activity_date, join_source, referrer_user_id, is_new_platform_user_at_join";
  const legacy = "user_id, progress_percent, joined_at, last_activity_date";
  const minimal = "user_id, progress_percent, joined_at";

  const load = async (columns: string) =>
    fetchPages<Record<string, unknown>>(async (from, to) => {
      const result = await supabase
        .from("challenge_participants")
        .select(columns)
        .eq("challenge_id", challengeId)
        .order("user_id", { ascending: true })
        .range(from, to);
      return {
        data: (result.data as Record<string, unknown>[] | null) ?? null,
        error: result.error,
      };
    });

  let rows: Record<string, unknown>[];
  try {
    rows = await load(full);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/join_source|referrer_user_id|is_new_platform|last_activity_date|schema cache/i.test(message)) {
      throw error;
    }
    try {
      rows = await load(legacy);
    } catch (legacyError) {
      const legacyMessage = legacyError instanceof Error ? legacyError.message : "";
      if (!/last_activity_date|schema cache/i.test(legacyMessage)) throw legacyError;
      rows = await load(minimal);
    }
  }

  return rows.map((row) => ({
    userId: String(row.user_id ?? ""),
    progressPercent: typeof row.progress_percent === "number" ? row.progress_percent : 0,
    joinedAt: typeof row.joined_at === "string" ? row.joined_at : null,
    lastActivityDate: typeof row.last_activity_date === "string" ? row.last_activity_date : null,
    joinSource: typeof row.join_source === "string" ? row.join_source : null,
    referrerUserId: typeof row.referrer_user_id === "string" ? row.referrer_user_id : null,
    isNewPlatformUser:
      typeof row.is_new_platform_user_at_join === "boolean"
        ? row.is_new_platform_user_at_join
        : null,
  }));
}

async function fetchScheduleItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
): Promise<ChallengeReportScheduleItemInput[]> {
  const { data, error } = await supabase
    .from("challenge_schedule_items")
    .select("id, is_rest")
    .eq("challenge_id", challengeId)
    .order("sort_order", { ascending: true })
    .limit(1000);
  if (error) {
    if (/challenge_schedule_items|schema cache|does not exist/i.test(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    isRest: row.is_rest === true,
  }));
}

async function fetchCompletions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
): Promise<ChallengeReportCompletionInput[]> {
  try {
    const rows = await fetchPages<Record<string, unknown>>(async (from, to) => {
      const result = await supabase
        .from("challenge_schedule_completions")
        .select("user_id, schedule_item_id, completed_on")
        .eq("challenge_id", challengeId)
        .order("completed_on", { ascending: true })
        .order("user_id", { ascending: true })
        .range(from, to);
      return {
        data: (result.data as Record<string, unknown>[] | null) ?? null,
        error: result.error,
      };
    });
    return rows.map((row) => ({
      userId: String(row.user_id ?? ""),
      scheduleItemId: String(row.schedule_item_id ?? ""),
      completedOn: String(row.completed_on ?? ""),
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/challenge_schedule_completions|schema cache|does not exist/i.test(message)) return [];
    throw error;
  }
}

async function fetchCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "creator_announcements" | "challenge_messages",
  challengeId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  if (error) {
    if (/schema cache|does not exist/i.test(error.message)) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function loadInput(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challenge: ChallengeRow,
): Promise<{ input: ChallengeReportInput; partial: boolean }> {
  const generatedAt = new Date().toISOString();
  let partial = false;

  const participants = await fetchParticipants(supabase, challenge.id);
  let scheduleItems: ChallengeReportScheduleItemInput[] = [];
  let scheduleCompletions: ChallengeReportCompletionInput[] = [];
  let announcementCount = 0;
  let messageCount = 0;

  try {
    scheduleItems = await fetchScheduleItems(supabase, challenge.id);
  } catch {
    partial = true;
  }
  try {
    scheduleCompletions = await fetchCompletions(supabase, challenge.id);
  } catch {
    partial = true;
  }
  try {
    announcementCount = challenge.community_id
      ? await fetchCount(supabase, "creator_announcements", challenge.id)
      : 0;
  } catch {
    partial = true;
  }
  try {
    messageCount = await fetchCount(supabase, "challenge_messages", challenge.id);
  } catch {
    partial = true;
  }

  return {
    partial,
    input: {
      challengeId: challenge.id,
      title: challenge.title,
      category: challenge.category ?? null,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      participants,
      scheduleItems,
      scheduleCompletions,
      announcementCount,
      messageCount,
      generatedAt,
      isDemo: false,
    },
  };
}

/**
 * Return the saved snapshot when one exists.
 * The first successful calculation is stored; later calls do not write a second row.
 */
export async function getCreatorChallengeReport(
  challengeId: string,
  userId: string,
): Promise<CreatorChallengeReportResult> {
  const supabase = await createClient();
  const challenge = await fetchChallenge(supabase, challengeId, userId);
  if (!challenge) return { status: "not_found" };
  if (!isCompletedChallenge(challenge)) {
    return { status: "not_completed", title: challenge.title };
  }

  const existing = await supabase
    .from("creator_challenge_reports")
    .select("payload")
    .eq("challenge_id", challengeId)
    .eq("creator_id", userId)
    .maybeSingle();

  if (existing.error && !missingReportsTable(existing.error.message)) {
    throw new Error(existing.error.message);
  }

  const storedPayload = !existing.error ? existing.data?.payload : null;
  if (storedPayload) {
    const stored = reportFromPayload(storedPayload);
    if (stored) return { status: "ready", report: stored, persisted: true, notice: "saved" };
  }

  const loaded = await loadInput(supabase, challenge);
  const report = computeChallengeReport(loaded.input);
  if (loaded.partial) {
    return { status: "ready", report, persisted: false, notice: "partial" };
  }
  if (existing.error && missingReportsTable(existing.error.message)) {
    return { status: "ready", report, persisted: false, notice: "storage_unavailable" };
  }
  if (storedPayload) {
    return { status: "ready", report, persisted: false, notice: "partial" };
  }

  const insert = await supabase.from("creator_challenge_reports").insert({
    challenge_id: challenge.id,
    creator_id: userId,
    generated_at: report.generatedAt,
    payload: toStoredPayload(report),
  });

  if (!insert.error) {
    return { status: "ready", report, persisted: true, notice: "saved" };
  }
  if (missingReportsTable(insert.error.message)) {
    return { status: "ready", report, persisted: false, notice: "storage_unavailable" };
  }
  if (!isUniqueViolation(insert.error)) {
    throw new Error(insert.error.message);
  }

  const raced = await supabase
    .from("creator_challenge_reports")
    .select("payload")
    .eq("challenge_id", challengeId)
    .eq("creator_id", userId)
    .maybeSingle();
  const stored = raced.data?.payload ? reportFromPayload(raced.data.payload) : null;
  if (stored) return { status: "ready", report: stored, persisted: true, notice: "saved" };
  return { status: "ready", report, persisted: true, notice: "saved" };
}

import {
  computeChallengeReport,
  findPreviousCompletedReport,
} from "@/lib/challenge-report/compute-report";
import { buildCreatorChallengeWindow } from "@/lib/challenge-lifecycle/creator-windows";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeReportPayload } from "@/types/challenge-report";

async function assertCreatorOwnsChallenge(userId: string, challengeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select(
      "id, created_by, visibility, publish_status, start_date, end_date, start_at, end_at, challenge_timezone",
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (!data || data.created_by !== userId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const window = buildCreatorChallengeWindow({
    id: data.id,
    title: "",
    publish_status: data.publish_status,
    start_date: data.start_date,
    end_date: data.end_date,
    start_at: data.start_at,
    end_at: data.end_at,
    challenge_timezone: data.challenge_timezone,
  });

  if (!window || window.phase !== "completed") {
    return { ok: false as const, reason: "not_completed" as const, challenge: data };
  }

  if (data.visibility !== "public") {
    return { ok: false as const, reason: "not_public" as const };
  }

  return { ok: true as const, challenge: data };
}

export async function getOrGenerateChallengeReport(
  userId: string,
  challengeId: string,
  options?: { isAdmin?: boolean },
): Promise<
  | { status: "ready"; report: ChallengeReportPayload }
  | { status: "not_completed" }
  | { status: "forbidden" }
  | { status: "error"; message: string }
> {
  if (!options?.isAdmin) {
    const gate = await assertCreatorOwnsChallenge(userId, challengeId);
    if (!gate.ok) {
      if (gate.reason === "not_completed") return { status: "not_completed" };
      return { status: "forbidden" };
    }
  } else {
    const admin = createAdminClient();
    if (!admin) return { status: "forbidden" };
    const { data } = await admin
      .from("challenges")
      .select("id, created_by, end_date, visibility, publish_status, start_date, start_at, end_at, challenge_timezone")
      .eq("id", challengeId)
      .maybeSingle();
    if (!data) return { status: "forbidden" };
    const window = buildCreatorChallengeWindow({
      id: data.id,
      title: "",
      publish_status: data.publish_status,
      start_date: data.start_date,
      end_date: data.end_date,
      start_at: data.start_at,
      end_at: data.end_at,
      challenge_timezone: data.challenge_timezone,
    });
    if (!window || window.phase !== "completed") return { status: "not_completed" };
  }

  const supabase = await createClient();
  const { data: existing, error: readErr } = await supabase
    .from("creator_challenge_reports")
    .select("report")
    .eq("challenge_id", challengeId)
    .maybeSingle();

  if (existing?.report && !readErr) {
    return { status: "ready", report: existing.report as ChallengeReportPayload };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { status: "error", message: "Server cannot generate reports." };
  }

  const { data: chMeta } = await admin
    .from("challenges")
    .select("created_by, end_date")
    .eq("id", challengeId)
    .single();

  const previous = chMeta
    ? await findPreviousCompletedReport(chMeta.created_by, chMeta.end_date, challengeId)
    : null;

  try {
    const report = await computeChallengeReport(challengeId, previous);

    const ownerId = chMeta?.created_by ?? userId;
    const { error: insertErr } = await supabase.from("creator_challenge_reports").insert({
      challenge_id: challengeId,
      created_by: ownerId,
      report,
    });

    if (insertErr && !/duplicate|unique|23505/i.test(insertErr.message)) {
      if (/creator_challenge_reports|schema cache/i.test(insertErr.message)) {
        return {
          status: "error",
          message: "Run migration 040_creator_challenge_reports.sql in Supabase.",
        };
      }
    }

    const { data: after } = await supabase
      .from("creator_challenge_reports")
      .select("report")
      .eq("challenge_id", challengeId)
      .maybeSingle();

    if (after?.report) {
      return { status: "ready", report: after.report as ChallengeReportPayload };
    }

    return { status: "ready", report };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Report generation failed.",
    };
  }
}

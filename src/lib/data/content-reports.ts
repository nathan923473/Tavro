import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/data/relations";
import type { ContentReportRow } from "@/lib/moderation/types";

export async function listContentReportsForAdmin(): Promise<ContentReportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_reports")
    .select(
      `
      id, reporter_id, reported_user_id, content_type, content_id,
      reason, explanation, status, admin_notes, created_at,
      reporter:profiles!content_reports_reporter_id_fkey ( display_name ),
      reported:profiles!content_reports_reported_user_id_fkey ( display_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (/content_reports|schema cache/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    contentType: row.content_type,
    contentId: row.content_id,
    reason: row.reason,
    explanation: row.explanation,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    reporterDisplayName: unwrapOne(row.reporter)?.display_name ?? null,
    reportedDisplayName: unwrapOne(row.reported)?.display_name ?? null,
  }));
}

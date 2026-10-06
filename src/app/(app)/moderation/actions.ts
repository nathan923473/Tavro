"use server";

import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireAdmin } from "@/lib/auth/require-admin";
import { resolveReportedUserId } from "@/lib/moderation/resolve-reported-user";
import {
  CONTENT_REPORT_REASONS,
  REPORTED_CONTENT_TYPES,
  type ContentReportReason,
  type ReportedContentType,
  type SubmitContentReportInput,
} from "@/lib/moderation/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function isReportReason(value: string): value is ContentReportReason {
  return CONTENT_REPORT_REASONS.some((r) => r.value === value);
}

function isContentType(value: string): value is ReportedContentType {
  return (REPORTED_CONTENT_TYPES as readonly string[]).includes(value);
}

export async function submitContentReportAction(input: SubmitContentReportInput) {
  const { user } = await getCurrentUserProfile();
  if (!user) {
    throw new Error("Sign in to report content.");
  }

  if (!isContentType(input.contentType)) {
    throw new Error("Invalid content type.");
  }
  if (!isReportReason(input.reason)) {
    throw new Error("Pick a reason for your report.");
  }

  const contentId = input.contentId?.trim();
  if (!contentId) {
    throw new Error("Missing content reference.");
  }

  const explanation = input.explanation?.trim() ?? "";
  if (explanation.length > 500) {
    throw new Error("Explanation must be 500 characters or fewer.");
  }
  if (input.reason === "other" && explanation.length < 10) {
    throw new Error("Please briefly describe the issue (at least 10 characters).");
  }

  const supabase = await createClient();
  const resolvedUserId = await resolveReportedUserId(
    supabase,
    input.contentType,
    contentId,
  );

  if (!resolvedUserId) {
    throw new Error("This content could not be found.");
  }

  if (resolvedUserId !== input.reportedUserId) {
    throw new Error("Report details did not match this content.");
  }

  if (resolvedUserId === user.id) {
    throw new Error("You cannot report your own content.");
  }

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    reported_user_id: resolvedUserId,
    content_type: input.contentType,
    content_id: contentId,
    reason: input.reason,
    explanation: explanation || null,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You already submitted a report for this content.");
    }
    if (/content_reports|schema cache/i.test(error.message)) {
      throw new Error(
        "Reporting is not available yet. Ask your admin to run migration 013_content_reports.sql in Supabase.",
      );
    }
    throw new Error(error.message);
  }
}

export async function adminUpdateContentReportAction(
  reportId: string,
  status: "reviewed" | "dismissed",
  adminNotes: string,
) {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const notes = adminNotes.trim().slice(0, 2000);

  const { error } = await supabase
    .from("content_reports")
    .update({
      status,
      admin_notes: notes || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/content-reports");
}

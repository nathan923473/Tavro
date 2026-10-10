"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  isAccountId,
  isMissingTestAccessRpc,
  lookupTestCreatorAccount,
  normalizeAccountEmail,
} from "@/lib/creator/test-access";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function adminConfirmVerification(applicationId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_confirm_verification", {
    app_id: applicationId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/creator-applications");
  revalidatePath("/become-creator");
}

export async function adminRequestOwnershipVerification(applicationId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_request_ownership_verification", {
    app_id: applicationId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/creator-applications");
  revalidatePath("/become-creator");
}

export async function adminApproveApplication(applicationId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_creator_application", {
    app_id: applicationId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/creator-applications");
  revalidatePath("/become-creator");
  revalidatePath("/studio");
  revalidatePath("/profile");
}

export async function adminRejectApplication(applicationId: string, notes: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_creator_application", {
    app_id: applicationId,
    p_notes: notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/creator-applications");
  revalidatePath("/become-creator");
  revalidatePath("/profile");
}

function creatorAdminPath(params: { email?: string; notice?: string; error?: string }) {
  const search = new URLSearchParams();
  if (params.email) search.set("email", params.email);
  if (params.notice) search.set("notice", params.notice);
  if (params.error) search.set("error", params.error);
  const qs = search.toString();
  return qs ? `/admin/creator-applications?${qs}` : "/admin/creator-applications";
}

function revalidateCreatorAccess() {
  revalidatePath("/admin/creator-applications");
  revalidatePath("/become-creator");
  revalidatePath("/studio");
  revalidatePath("/profile");
  revalidatePath("/creators");
}

function mapTestAccessError(message: string) {
  if (isMissingTestAccessRpc(message)) return "migration";
  if (/not authorized/i.test(message)) return "unauthorized";
  if (/already an approved creator/i.test(message)) return "already_creator";
  if (/only test accounts/i.test(message)) return "not_test";
  if (/does not have creator access/i.test(message)) return "not_creator";
  if (/account not found/i.test(message)) return "not_found";
  if (/valid email required/i.test(message)) return "invalid";
  return "failed";
}

export async function grantTestCreatorAccess(formData: FormData) {
  await requireAdmin();
  const email = normalizeAccountEmail(String(formData.get("email") ?? ""));
  const userId = String(formData.get("user_id") ?? "");
  if (!email || !isAccountId(userId)) {
    redirect(creatorAdminPath({ email: email ?? undefined, error: "invalid" }));
  }

  const lookup = await lookupTestCreatorAccount(email);
  if (lookup.status === "migration") {
    redirect(creatorAdminPath({ email, error: "migration" }));
  }
  if (lookup.status === "missing") {
    redirect(creatorAdminPath({ email, error: "not_found" }));
  }
  if (lookup.status === "error") {
    redirect(creatorAdminPath({ email, error: mapTestAccessError(lookup.message) }));
  }
  if (lookup.account.userId !== userId) {
    redirect(creatorAdminPath({ email, error: "mismatch" }));
  }
  if (lookup.account.creatorStatus === "approved" && !lookup.account.isTestAccount) {
    redirect(creatorAdminPath({ email, error: "already_creator" }));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_grant_test_creator_access", {
    p_user_id: userId,
  });
  if (error) {
    redirect(creatorAdminPath({ email, error: mapTestAccessError(error.message) }));
  }

  revalidateCreatorAccess();
  redirect(creatorAdminPath({ email, notice: "granted" }));
}

export async function revokeTestCreatorAccess(formData: FormData) {
  await requireAdmin();
  const email = normalizeAccountEmail(String(formData.get("email") ?? ""));
  const userId = String(formData.get("user_id") ?? "");
  if (!isAccountId(userId)) {
    redirect(creatorAdminPath({ email: email ?? undefined, error: "invalid" }));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revoke_test_creator_access", {
    p_user_id: userId,
  });
  if (error) {
    redirect(
      creatorAdminPath({
        email: email ?? undefined,
        error: mapTestAccessError(error.message),
      }),
    );
  }

  revalidateCreatorAccess();
  redirect(creatorAdminPath({ email: email ?? undefined, notice: "revoked" }));
}

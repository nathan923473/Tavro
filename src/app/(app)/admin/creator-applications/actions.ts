"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

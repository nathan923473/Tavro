import { createAdminClient } from "@/lib/supabase/admin";

export type StampEmailOwnershipResult =
  | "stamped"
  | "column_missing"
  | "no_service_role"
  | "failed";

/**
 * Records inbox ownership after Supabase has exchanged a real email link.
 * The profile trigger rejects this write from signed-in users, including admins.
 */
export async function stampEmailOwnership(userId: string): Promise<StampEmailOwnershipResult> {
  const admin = createAdminClient();
  if (!admin) return "no_service_role";

  const { error } = await admin
    .from("profiles")
    .update({ email_ownership_verified_at: new Date().toISOString() })
    .eq("id", userId)
    .is("email_ownership_verified_at", null);

  if (error) {
    if (/email_ownership_verified_at|schema cache/i.test(error.message)) {
      return "column_missing";
    }
    return "failed";
  }

  const { data, error: readError } = await admin
    .from("profiles")
    .select("email_ownership_verified_at")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    if (/email_ownership_verified_at|schema cache/i.test(readError.message)) {
      return "column_missing";
    }
    return "failed";
  }
  if (data?.email_ownership_verified_at) return "stamped";
  return "failed";
}

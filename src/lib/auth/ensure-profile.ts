import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

/** Creates a profiles row if auth user exists but trigger did not run. */
export async function ensureUserProfile(fallbackDisplayName?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const meta = user.user_metadata as { display_name?: string } | undefined;
  const displayName =
    fallbackDisplayName?.trim() ||
    meta?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "Member";

  await supabase.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    referral_code: randomBytes(6).toString("hex"),
  });
}

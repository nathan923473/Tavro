import { createClient } from "@/lib/supabase/server";

export type CreatorApplicationRow = {
  id: string;
  user_id: string;
  display_name: string;
  pitch: string;
  coaching_focus?: string | null;
  social_link: string | null;
  status: string;
  reviewed_by?: string | null;
  verification_code: string | null;
  verification_code_expires_at: string | null;
  verification_state: string;
  verification_method: string | null;
  verification_verified_at: string | null;
  dm_verification_requested_at: string | null;
  admin_notes: string | null;
  referred_by_user_id: string | null;
  application_source: string | null;
  created_at: string;
};

export async function getLatestApplicationForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as CreatorApplicationRow | null;
}

export async function getOpenApplicationForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_applications")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending_verification", "awaiting_review", "pending"])
    .order("created_at", { ascending: false })
    .maybeSingle();

  return data as CreatorApplicationRow | null;
}

export async function listApplicationsForAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creator_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as CreatorApplicationRow[];
}

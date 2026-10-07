"use server";

import { requireApprovedCreator } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function completeCreatorOnboardingAction() {
  const { user } = await requireApprovedCreator();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ creator_onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error && !/creator_onboarding_completed_at|schema cache/i.test(error.message)) {
    throw new Error(error.message);
  }
  revalidatePath("/studio");
  revalidatePath("/studio/onboarding");
}

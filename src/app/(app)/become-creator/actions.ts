"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitCreatorApplication(formData: FormData): Promise<void> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const pitch = String(formData.get("pitch") ?? "").trim();
  const socialLink = String(formData.get("social_link") ?? "").trim();

  if (!displayName || !pitch) {
    throw new Error("Name and pitch are required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_status")
    .eq("id", user.id)
    .single();

  if (profile?.creator_status === "approved") {
    throw new Error("You are already an approved creator.");
  }

  if (profile?.creator_status === "pending") {
    throw new Error("Your application is already under review.");
  }

  const { error: insertError } = await supabase.from("creator_applications").insert({
    user_id: user.id,
    display_name: displayName,
    pitch,
    social_link: socialLink || null,
    status: "pending",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ creator_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/become-creator");
  revalidatePath("/profile");
  redirect("/become-creator?submitted=1");
}

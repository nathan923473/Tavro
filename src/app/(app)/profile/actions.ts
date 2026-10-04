"use server";

import { requireUserId } from "@/lib/auth/require-user-id";
import { isAllowedProfileAvatarUrl } from "@/lib/storage/validate-image-url";
import { revalidatePath } from "next/cache";

export async function setProfileAvatarUrlAction(avatarUrl: string) {
  const { supabase, userId } = await requireUserId();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!isAllowedProfileAvatarUrl(avatarUrl, supabaseUrl)) {
    throw new Error("Invalid profile image.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/groups");
  revalidatePath("/");
}

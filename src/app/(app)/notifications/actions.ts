"use server";

import { getCurrentUserProfile } from "@/lib/auth/profile";
import { markNotificationRead } from "@/lib/data/notifications";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string) {
  const { user } = await getCurrentUserProfile();
  if (!user) throw new Error("Log in required.");
  await markNotificationRead(user.id, notificationId);
  revalidatePath("/notifications");
}

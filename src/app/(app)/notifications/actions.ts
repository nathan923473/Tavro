"use server";

import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  countUnreadNotifications,
  markNotificationRead,
} from "@/lib/data/notifications";
import { revalidatePath } from "next/cache";

export async function unreadNotificationCountAction(userId: string) {
  const { user } = await getCurrentUserProfile();
  if (!user || user.id !== userId) return 0;
  return countUnreadNotifications(user.id);
}

export async function markNotificationReadAction(notificationId: string) {
  const { user } = await getCurrentUserProfile();
  if (!user) throw new Error("Log in required.");
  await markNotificationRead(user.id, notificationId);
  revalidatePath("/notifications");
}

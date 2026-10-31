"use server";

import { assertVerifiedAccount } from "@/lib/auth/require-user-id";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveNotificationPreferencesAction(prefs: {
  challengeReminders: boolean;
  creatorAnnouncements: boolean;
  newChallengesFromFollowed: boolean;
}) {
  const { user } = await getCurrentUserProfile();
  if (!user) throw new Error("Log in required.");
  await assertVerifiedAccount();

  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      challenge_reminders: prefs.challengeReminders,
      creator_announcements: prefs.creatorAnnouncements,
      new_challenges_from_followed: prefs.newChallengesFromFollowed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error && /notification_preferences|schema cache/i.test(error.message)) {
    throw new Error("Run migration 016_in_app_notifications.sql in Supabase.");
  }
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

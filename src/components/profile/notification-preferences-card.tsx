import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";
import { Card } from "@/components/ui/card";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export async function NotificationPreferencesCard() {
  const { user } = await getCurrentUserProfile();
  if (!user) return null;

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("challenge_reminders, creator_announcements, new_challenges_from_followed")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div id="notification-settings">
      <Card>
        <h2 className="font-semibold">Notification preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          In-app alerts first. Web push can be added later with VAPID keys.
        </p>
        <div className="mt-4">
          <NotificationPreferencesForm
            initial={{
              challengeReminders: prefs?.challenge_reminders ?? true,
              creatorAnnouncements: prefs?.creator_announcements ?? true,
              newChallengesFromFollowed: prefs?.new_challenges_from_followed ?? true,
            }}
          />
        </div>
      </Card>
    </div>
  );
}

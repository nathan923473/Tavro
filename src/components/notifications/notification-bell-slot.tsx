import { NotificationBellClient } from "@/components/notifications/notification-bell-client";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { Suspense } from "react";

function NotificationBellPlaceholder() {
  // Reserve space so the header doesn’t jump; avoid looking like a real control.
  return <span className="inline-block h-10 w-10" aria-hidden />;
}

async function AuthedNotificationBell() {
  const { user } = await getCurrentUserProfile();
  if (!user) return null;
  return <NotificationBellClient userId={user.id} />;
}

/** Streams the unread count so the app shell can paint without waiting on auth/DB. */
export function NotificationBellSlot() {
  return (
    <Suspense fallback={<NotificationBellPlaceholder />}>
      <AuthedNotificationBell />
    </Suspense>
  );
}

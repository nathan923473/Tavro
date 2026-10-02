/**
 * Placeholder for opt-in web push (Supabase + service worker) in a later phase.
 * Call only after explicit user consent in the UI.
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.info(
      "[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — subscription skipped.",
    );
    return null;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidPublicKey,
  });
}

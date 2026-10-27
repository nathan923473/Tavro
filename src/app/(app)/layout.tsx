import { AppShell } from "@/components/layout/app-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { Suspense } from "react";

export default async function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentUserProfile();
  return (
    <AppShell
      notificationSlot={
        user ? (
          <Suspense fallback={null}>
            <NotificationBell userId={user.id} />
          </Suspense>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}

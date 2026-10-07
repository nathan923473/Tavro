import { AppShell } from "@/components/layout/app-shell";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getCurrentUserProfile } from "@/lib/auth/profile";

export default async function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentUserProfile();
  return (
    <AppShell
      notificationSlot={user ? <NotificationBell userId={user.id} /> : null}
    >
      {children}
    </AppShell>
  );
}

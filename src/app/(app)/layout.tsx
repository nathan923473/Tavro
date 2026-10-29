import { AppShell } from "@/components/layout/app-shell";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";

/** Sync layout: bottom nav stays mounted; notifications stream in separately. */
export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell notificationSlot={<NotificationBellSlot />}>{children}</AppShell>
  );
}

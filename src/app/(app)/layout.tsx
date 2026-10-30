import { InstantTabHost } from "@/components/navigation/instant-tab-host";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";

/** Bottom nav stays mounted. Tab clicks paint before RSC data arrives. */
export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <InstantTabHost notificationSlot={<NotificationBellSlot />}>
      {children}
    </InstantTabHost>
  );
}

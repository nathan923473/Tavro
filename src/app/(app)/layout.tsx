import { VerifiedAccountGate } from "@/components/auth/verified-account-gate";
import { CreatorStudioSidebar } from "@/components/creator/studio/creator-studio-sidebar";
import { InstantTabHost } from "@/components/navigation/instant-tab-host";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
import { Suspense } from "react";

/** Bottom nav stays mounted. Tab clicks paint before RSC data arrives. */
export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <InstantTabHost
      notificationSlot={<NotificationBellSlot />}
      creatorStudioTab={
        <Suspense fallback={null}>
          <CreatorStudioSidebar />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <VerifiedAccountGate>{children}</VerifiedAccountGate>
      </Suspense>
    </InstantTabHost>
  );
}

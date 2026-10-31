import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  notificationSlot?: ReactNode;
  creatorStudioTab?: ReactNode;
};

export function AppShell({ children, notificationSlot, creatorStudioTab }: AppShellProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background md:max-w-3xl lg:grid lg:max-w-[1440px] lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:border-x lg:border-border/50">
      <DesktopSidebar creatorStudioTab={creatorStudioTab} />
      <div className="relative min-w-0">
        {notificationSlot ? (
          <div className="pointer-events-none fixed right-0 top-0 z-50 flex justify-end p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:absolute lg:right-6 lg:top-3 lg:p-0 lg:pt-0">
            <div className="pointer-events-auto">{notificationSlot}</div>
          </div>
        ) : null}
        <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] lg:pb-10 lg:pt-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

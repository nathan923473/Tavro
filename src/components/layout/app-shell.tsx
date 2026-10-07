import { BottomNav } from "@/components/layout/bottom-nav";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  notificationSlot?: ReactNode;
};

export function AppShell({ children, notificationSlot }: AppShellProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background">
      {notificationSlot ? (
        <div className="pointer-events-none fixed right-0 top-0 z-50 flex justify-end p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="pointer-events-auto">{notificationSlot}</div>
        </div>
      ) : null}
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

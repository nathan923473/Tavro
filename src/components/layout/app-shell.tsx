import { BottomNav } from "@/components/layout/bottom-nav";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background">
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

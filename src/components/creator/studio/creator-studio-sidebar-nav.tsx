"use client";

import { isStudioTabActive, studioTabs } from "@/components/creator/studio/studio-tabs";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function CreatorStudioSidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col border-r border-border/70 bg-surface lg:flex">
      <div className="px-4 pb-1 pt-5">
        <p className="text-sm font-semibold tracking-tight text-foreground">Creator Studio</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Challenges and community</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Creator Studio">
        {studioTabs.map((tab) => {
          const active = isStudioTabActive(pathname, tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5px]")} aria-hidden />
              <span>{tab.sidebarLabel ?? tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

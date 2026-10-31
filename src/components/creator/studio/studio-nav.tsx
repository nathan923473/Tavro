"use client";

import { isStudioTabActive, studioTabs } from "@/components/creator/studio/studio-tabs";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto pb-1 lg:hidden"
      aria-label="Creator Studio"
    >
      {studioTabs.map((tab) => {
        const { href, label, icon: Icon } = tab;
        const active = isStudioTabActive(pathname, tab);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "focus-ring flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                : "border border-border/80 bg-surface text-muted-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

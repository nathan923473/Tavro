"use client";

import { cn } from "@/lib/cn";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** One row on the existing desktop sidebar. Studio sections stay in StudioNav. */
export function CreatorStudioSidebarTab() {
  const pathname = usePathname();
  const active = pathname === "/studio" || pathname.startsWith("/studio/");

  return (
    <div className="mt-2 border-t border-border/70 pt-2">
      <Link
        href="/studio"
        prefetch
        aria-current={active ? "page" : undefined}
        className={cn(
          "focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        )}
      >
        <LayoutDashboard
          className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5px]")}
          aria-hidden
        />
        <span>Creator Studio</span>
      </Link>
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import {
  BarChart3,
  LayoutGrid,
  Link2,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/studio", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/studio/challenges", label: "Challenges", icon: Trophy },
  { href: "/studio/community", label: "Community", icon: Users },
  { href: "/studio/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/studio/shop", label: "Shop & Links", icon: Link2 },
  { href: "/studio/settings", label: "Profile", icon: Settings },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto pb-1"
      aria-label="Creator Studio"
    >
      {tabs.map((tab) => {
        const { href, label, icon: Icon } = tab;
        const exact = "exact" in tab && tab.exact;
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
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

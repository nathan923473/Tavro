"use client";

import { cn } from "@/lib/cn";
import {
  ACCOUNTABILITY_GROUP_NAV,
  ACCOUNTABILITY_GROUP_PLURAL,
} from "@/lib/copy/accountability-groups";
import {
  Home,
  Trophy,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/groups",
    label: ACCOUNTABILITY_GROUP_NAV,
    icon: Users,
  },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function NavPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary transition-opacity duration-150",
        pending ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 md:max-w-2xl lg:max-w-3xl">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const navTitle =
            href === "/groups" ? ACCOUNTABILITY_GROUP_PLURAL : undefined;

          return (
            <Link
              key={href}
              href={href}
              title={navTitle}
              className={cn(
                "focus-ring relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active ? (
                <span
                  className="absolute inset-x-2 top-1 h-8 rounded-xl bg-primary/10"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={cn("relative h-5 w-5", active && "stroke-[2.5px]")}
                aria-hidden
              />
              <span className="relative">{label}</span>
              <NavPendingHint />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import {
  isMainTabActive,
  mainTabs,
  useMainTabClick,
} from "@/components/layout/main-tab-nav";
import { cn } from "@/lib/cn";
import type { MainTab } from "@/components/navigation/instant-tab-host";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

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

function BottomTabLink({
  href,
  label,
  icon: Icon,
  title,
}: {
  href: MainTab;
  label: string;
  icon: (typeof mainTabs)[number]["icon"];
  title?: string;
}) {
  const pathname = usePathname();
  const onClick = useMainTabClick(href);
  const active = isMainTabActive(pathname, href);

  return (
    <Link
      href={href}
      title={title}
      prefetch
      onClick={onClick}
      className={cn(
        "focus-ring relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[11px] font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active ? (
        <span className="absolute inset-x-2 top-1 h-8 rounded-xl bg-primary/10" aria-hidden />
      ) : null}
      <Icon className={cn("relative h-5 w-5", active && "stroke-[2.5px]")} aria-hidden />
      <span className="relative">{label}</span>
      <NavPendingHint />
    </Link>
  );
}

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 md:max-w-3xl">
        {mainTabs.map((tab) => (
          <BottomTabLink key={tab.href} {...tab} />
        ))}
      </div>
    </nav>
  );
}

"use client";

import { BrandWordmark } from "@/components/brand/brand-wordmark";
import {
  isMainTabActive,
  mainTabs,
  useMainTabClick,
} from "@/components/layout/main-tab-nav";
import { cn } from "@/lib/cn";
import type { MainTab } from "@/components/navigation/instant-tab-host";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function SidebarLink({
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5px]")} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function DesktopSidebar({ creatorStudioTab }: { creatorStudioTab?: ReactNode }) {
  const onHome = useMainTabClick("/");

  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border/70 bg-surface lg:flex">
      <div className="px-5 pb-2 pt-5">
        <Link href="/" onClick={onHome} className="focus-ring inline-flex rounded-xl">
          <BrandWordmark size="sm" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Main navigation">
        {mainTabs.map((tab) => (
          <SidebarLink key={tab.href} {...tab} />
        ))}
        {creatorStudioTab}
      </nav>
      <p className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">
        Daily habits, challenges, and a small crew.
      </p>
    </aside>
  );
}

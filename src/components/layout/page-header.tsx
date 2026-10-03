"use client";

import { BackButton } from "@/components/layout/back-button";
import { cn } from "@/lib/cn";
import { getBackHref } from "@/lib/back-navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** Override fallback when there is no in-app history. Set false to hide back. */
  backHref?: string | false;
};

export function PageHeader({
  title,
  subtitle,
  action,
  className,
  backHref: backHrefProp,
}: PageHeaderProps) {
  const pathname = usePathname();
  const fallbackBack =
    backHrefProp === false
      ? null
      : backHrefProp ?? (pathname ? getBackHref(pathname) : null);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      {fallbackBack ? (
        <BackButton fallbackHref={fallbackBack} className="mb-3" />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
    </header>
  );
}

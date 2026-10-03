"use client";

import { BackLink } from "@/components/layout/back-link";
import { cn } from "@/lib/cn";
import {
  backLabelForHref,
  getBackHref,
} from "@/lib/back-navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** Override auto-detected back target. Set to false to hide back. */
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
  const resolvedBack =
    backHrefProp === false
      ? null
      : backHrefProp ?? (pathname ? getBackHref(pathname) : null);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/50 bg-background/90 px-4 py-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {resolvedBack ? (
          <BackLink
            href={resolvedBack}
            label={backLabelForHref(resolvedBack)}
            className="-ml-1 mt-0.5"
          />
        ) : null}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
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
      </div>
    </header>
  );
}

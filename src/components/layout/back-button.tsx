"use client";

import { cn } from "@/lib/cn";
import { backLabelForHref, shortLabelForPath } from "@/lib/back-navigation";
import {
  getPreviousNavPath,
  recordNavPathname,
  resolveBackNavigation,
} from "@/lib/navigation-stack";
import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

type BackButtonProps = {
  /** Used when there is no in-app history (direct link, refresh). */
  fallbackHref: string;
  className?: string;
  /** full = arrow + “Back to …” on its own row; compact = smaller inline control */
  variant?: "full" | "compact";
};

export function BackButton({
  fallbackHref,
  className,
  variant = "full",
}: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (pathname) recordNavPathname(pathname);
    setPreviousPath(getPreviousNavPath());
  }, [pathname]);

  const destinationHref = previousPath ?? fallbackHref;
  const visibleLabel = previousPath
    ? shortLabelForPath(previousPath)
    : shortLabelForPath(fallbackHref);
  const ariaLabel = backLabelForHref(destinationHref);

  function handleBack() {
    const target = resolveBackNavigation(fallbackHref);
    router.push(target);
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleBack}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-primary transition-colors hover:bg-muted",
          className,
        )}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
        <span className="max-w-[9rem] truncate">Back</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-h-11 w-full max-w-md items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2 text-left text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted",
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <span className="truncate">
        Back to <span className="text-primary">{visibleLabel}</span>
      </span>
    </button>
  );
}

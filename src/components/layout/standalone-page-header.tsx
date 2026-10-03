"use client";

import { BackButton } from "@/components/layout/back-button";
import { getBackHref } from "@/lib/back-navigation";

type StandalonePageHeaderProps = {
  pathname: string;
  title?: string;
  backHref?: string;
};

/** Top bar with back for pages outside the main tab shell (join, invite, auth). */
export function StandalonePageHeader({
  pathname,
  title,
  backHref,
}: StandalonePageHeaderProps) {
  const fallback = backHref ?? getBackHref(pathname);
  if (!fallback) return null;

  return (
    <div className="mb-4 space-y-2">
      <BackButton fallbackHref={fallback} />
      {title ? (
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
    </div>
  );
}

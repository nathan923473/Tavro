import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function MutedCallout({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {title ? <p className="mb-1 font-medium text-foreground">{title}</p> : null}
      {children}
    </div>
  );
}

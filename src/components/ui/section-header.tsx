import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function SectionHeader({
  title,
  description,
  action,
  className,
  titleId,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  titleId?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-1", className)}>
      <div className="min-w-0">
        <h2 id={titleId} className="text-title">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-caption leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

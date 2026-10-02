import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/50 bg-background/90 px-4 py-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
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

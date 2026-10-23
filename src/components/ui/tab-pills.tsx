"use client";

import { cn } from "@/lib/cn";

export function TabPills<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto pb-1", className)}>
      <div
        className="flex min-w-max gap-1 rounded-2xl bg-muted/50 p-1"
        role="tablist"
      >
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.id)}
              className={cn(
                "focus-ring rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "muted";
  className?: string;
};

const toneStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

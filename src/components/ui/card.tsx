import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type CardVariant = "default" | "muted" | "brand" | "outline";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  variant?: CardVariant;
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

const variantMap: Record<CardVariant, string> = {
  default: "border-border/70 bg-surface shadow-card",
  muted: "border-border/50 bg-muted/30 shadow-none",
  brand: "border-primary/15 bg-brand-subtle shadow-card",
  outline: "border-border bg-surface shadow-none",
};

export function Card({
  children,
  className,
  padding = "md",
  variant = "default",
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        variantMap[variant],
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

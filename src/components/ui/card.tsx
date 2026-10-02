import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
};

const paddingMap = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-surface shadow-sm shadow-black/[0.03]",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

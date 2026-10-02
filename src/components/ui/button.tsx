import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
  ghost: "bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
  outline:
    "border border-border bg-surface text-foreground hover:bg-muted active:scale-[0.98]",
};

export function Button({
  className,
  variant = "primary",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

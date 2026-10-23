import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonSize = "default" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-dark active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-accent/60 active:scale-[0.98]",
  ghost: "bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
  outline:
    "border border-border bg-surface text-foreground shadow-sm hover:bg-muted active:scale-[0.98]",
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-11 px-5 text-sm",
  sm: "min-h-9 rounded-xl px-3 text-xs",
};

export function Button({
  className,
  variant = "primary",
  size = "default",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]";

const variants = {
  primary: "bg-primary text-primary-foreground shadow-sm shadow-primary/15 hover:bg-primary-dark",
  secondary:
    "border border-border bg-surface text-foreground shadow-sm hover:bg-muted",
  ghost: "bg-transparent text-primary hover:bg-muted",
} as const;

type LinkButtonProps = {
  href: string;
  variant?: keyof typeof variants;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

export function PrimaryLink({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      {...props}
      className={cn(base, variants[variant], fullWidth && "w-full", className)}
    />
  );
}

export function SecondaryLink(props: LinkButtonProps) {
  return <PrimaryLink {...props} variant="secondary" />;
}

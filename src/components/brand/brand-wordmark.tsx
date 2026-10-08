import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/cn";

type BrandWordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function BrandWordmark({ className, size = "md" }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-bold tracking-tight text-foreground",
        sizeMap[size],
        className,
      )}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm"
        aria-hidden
      >
        T
      </span>
      {APP_NAME}
    </span>
  );
}

import { APP_NAME, BRAND_LOGO } from "@/lib/branding";
import { cn } from "@/lib/cn";
import Image from "next/image";

type BrandWordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Show “Tavro” text beside the mark (default true). */
  showName?: boolean;
};

const markSize = {
  sm: { px: 36, src: BRAND_LOGO.markSm },
  md: { px: 44, src: BRAND_LOGO.markMd },
  lg: { px: 56, src: BRAND_LOGO.markLg },
} as const;

const textSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

export function BrandWordmark({
  className,
  size = "md",
  showName = true,
}: BrandWordmarkProps) {
  const { px, src } = markSize[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight text-foreground",
        showName ? textSize[size] : "",
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        width={px}
        height={px}
        className="shrink-0 rounded-[22%] shadow-sm"
        priority
        unoptimized
      />
      {showName ? <span>{APP_NAME}</span> : null}
      <span className="sr-only">{APP_NAME}</span>
    </span>
  );
}

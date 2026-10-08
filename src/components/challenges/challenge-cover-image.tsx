"use client";

import { ReportContentMenu } from "@/components/moderation/report-content-menu";
import { BRAND_COLORS } from "@/lib/branding";
import { cn } from "@/lib/cn";
import Image from "next/image";

const TAVRO_FALLBACK_GRADIENT = `linear-gradient(135deg, ${BRAND_COLORS.royalBlue} 0%, ${BRAND_COLORS.navy} 55%, ${BRAND_COLORS.mint}33 100%)`;

type ChallengeCoverImageProps = {
  coverUrl?: string | null;
  /** Optional category / creator gradient when no upload (defaults to Tavro brand). */
  fallbackGradient?: string;
  title?: string;
  className?: string;
  aspectClassName?: string;
  priority?: boolean;
  report?: {
    contentId: string;
    reportedUserId: string;
    canReport: boolean;
  };
};

export function ChallengeCoverImage({
  coverUrl,
  fallbackGradient,
  title,
  className,
  aspectClassName = "aspect-video",
  priority = false,
  report,
}: ChallengeCoverImageProps) {
  const alt = title ? `${title} cover` : "Challenge cover";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        aspectClassName,
        className,
      )}
      style={coverUrl ? undefined : { background: fallbackGradient ?? TAVRO_FALLBACK_GRADIENT }}
    >
      {coverUrl ? (
        <>
          <Image
            src={coverUrl}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 480px"
            unoptimized
            priority={priority}
          />
          {report ? (
            <ReportContentMenu
              contentType="challenge_cover"
              contentId={report.contentId}
              reportedUserId={report.reportedUserId}
              canReport={report.canReport}
            />
          ) : null}
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 flex items-end justify-between p-3"
          aria-hidden
        >
          <span className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            Tavro
          </span>
          <span className="h-10 w-10 rounded-full border-2 border-white/25 bg-white/10" />
        </div>
      )}
    </div>
  );
}

export { TAVRO_FALLBACK_GRADIENT };

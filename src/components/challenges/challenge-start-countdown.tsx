"use client";

import {
  formatCompactCountdownToStart,
  formatHumanCountdownToStart,
  hasStarted,
} from "@/lib/challenge-countdown";
import { useMinuteTicker } from "@/lib/hooks/use-minute-ticker";
import {
  formatShortDate,
  formatShortDateTime,
  friendlyTimezoneLabel,
  friendlyTimezoneTitle,
} from "@/lib/timezone/format";
import { cn } from "@/lib/cn";
import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ChallengeStartCountdownProps = {
  /** Exact UTC start instant (preferred). */
  startAt?: string | null;
  /** Legacy fallback when start_at not migrated yet. */
  startDate?: string;
  challengeTimezone?: string | null;
  participantTimezone?: string | null;
  className?: string;
  variant?: "inline" | "banner" | "badge" | "hero" | "strip" | "prominent" | "compact";
  label?: string;
  showCreatorStart?: boolean;
};

function useStartInstant(startAt?: string | null, startDate?: string) {
  return useMemo(() => {
    if (startAt) return new Date(startAt);
    if (startDate) return new Date(`${startDate}T00:00:00.000Z`);
    return null;
  }, [startAt, startDate]);
}

export function ChallengeStartCountdown({
  startAt,
  startDate,
  challengeTimezone,
  participantTimezone,
  className,
  variant = "inline",
  label = "Starts in",
  showCreatorStart = false,
}: ChallengeStartCountdownProps) {
  const startInstant = useStartInstant(startAt, startDate);
  const minuteTick = useMinuteTicker();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { text, expired } = useMemo(() => {
    if (!mounted) return { text: "", expired: false };
    void minuteTick;
    if (!startInstant) return { text: "", expired: false };
    if (hasStarted(startInstant)) return { text: "Started", expired: true };
    const useCompact =
      variant === "compact" ||
      variant === "badge" ||
      variant === "inline" ||
      variant === "strip";
    const formatted = useCompact
      ? formatCompactCountdownToStart(startInstant)
      : formatHumanCountdownToStart(startInstant);
    return { text: formatted, expired: false };
  }, [mounted, startInstant, minuteTick, variant]);

  if (!startInstant) return null;

  const countdownLabel =
    text === "Starting soon" ? "Starting soon" : text ? `${label} ${text}` : `${label} …`;

  if (!mounted) {
    if (variant === "compact") {
      return (
        <span
          className={cn(
            "inline-flex max-w-full items-center gap-1 text-xs font-medium text-muted-foreground",
            className,
          )}
          role="timer"
          aria-live="polite"
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
          <span className="truncate tabular-nums">{`${label} …`}</span>
        </span>
      );
    }
    if (variant === "badge") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
            className,
          )}
          role="timer"
          aria-live="polite"
        >
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {`${label} …`}
        </span>
      );
    }
    if (variant === "strip") {
      return (
        <div
          className={cn("border-b border-border bg-muted/40 px-4 py-2", className)}
          role="timer"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {`${label} …`}
            </span>
          </div>
        </div>
      );
    }
    if (variant === "banner" || variant === "prominent" || variant === "hero") {
      return (
        <div
          className={cn(
            variant === "hero"
              ? "rounded-2xl border border-border bg-muted/40 px-4 py-4 text-center"
              : "rounded-xl border border-border bg-muted/30 px-3 py-2.5",
            className,
          )}
          role="timer"
          aria-live="polite"
        >
          <p className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            {`${label} …`}
          </p>
        </div>
      );
    }
    return (
      <p className={cn("text-sm text-muted-foreground", className)} role="timer" aria-live="polite">
        {`${label} …`}
      </p>
    );
  }

  if (expired && variant !== "inline") {
    return null;
  }

  const participantTz =
    participantTimezone ??
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");
  const creatorTz = challengeTimezone ?? participantTz;

  const localLine = formatShortDateTime(startInstant, participantTz);
  const creatorLine =
    showCreatorStart && challengeTimezone
      ? `${formatShortDateTime(startInstant, creatorTz)} (${friendlyTimezoneLabel(creatorTz)})`
      : null;

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center gap-1 text-xs font-medium text-muted-foreground",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
        <span className="truncate tabular-nums">{countdownLabel}</span>
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        {countdownLabel}
      </span>
    );
  }

  if (variant === "strip") {
    return (
      <div
        className={cn(
          "border-b border-border bg-muted/40 px-4 py-2",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {countdownLabel}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "banner" || variant === "prominent") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-muted/30 px-3 py-2.5",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {countdownLabel}
            </p>
            <p className="text-xs text-muted-foreground">{localLine} your time</p>
            {creatorLine ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Creator start: {creatorLine}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-muted/40 px-4 py-4 text-center",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <p className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
          <Clock className="h-4 w-4 text-primary" aria-hidden />
          {countdownLabel}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{localLine}</p>
        <p className="text-xs text-muted-foreground">{friendlyTimezoneTitle(participantTz)}</p>
        {creatorLine ? (
          <p className="mt-2 text-xs text-muted-foreground">Creator: {creatorLine}</p>
        ) : null}
      </div>
    );
  }

  return (
    <p className={cn("text-sm text-muted-foreground", className)} role="timer" aria-live="polite">
      {expired ? "Started" : countdownLabel}
      <span className="mt-0.5 block text-xs">{localLine}</span>
    </p>
  );
}

export function formatChallengeStartDisplay(
  startAt: string,
  participantTimezone: string,
): string {
  return formatShortDate(new Date(startAt), participantTimezone);
}

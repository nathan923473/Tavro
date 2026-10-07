"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatChallengeCountdown,
  formatChallengeStartDate,
  isChallengeUpcoming,
  msUntilChallengeStart,
} from "@/lib/challenge-countdown";
import { cn } from "@/lib/cn";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

type ChallengeStartCountdownProps = {
  startDate: string;
  className?: string;
  /** inline text, highlighted banner, compact badge, top strip, or card callout */
  variant?: "inline" | "banner" | "badge" | "hero" | "strip" | "prominent";
  /** Shown before the ticking time (banner/inline/hero). */
  label?: string;
};

export function ChallengeStartCountdown({
  startDate,
  className,
  variant = "inline",
  label = "Starts in",
}: ChallengeStartCountdownProps) {
  const [text, setText] = useState(() =>
    isChallengeUpcoming(startDate)
      ? formatChallengeCountdown(msUntilChallengeStart(startDate))
      : "",
  );
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!isChallengeUpcoming(startDate)) return;
    const tick = () => {
      const ms = msUntilChallengeStart(startDate);
      if (ms <= 0) {
        setExpired(true);
        return;
      }
      setText(formatChallengeCountdown(ms));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startDate]);

  if (!isChallengeUpcoming(startDate) || expired) return null;

  if (variant === "badge") {
    return (
      <Badge tone="warning" className={cn("gap-1 font-mono tabular-nums", className)}>
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        {text}
      </Badge>
    );
  }

  if (variant === "strip") {
    return (
      <div
        className={cn(
          "border-b-2 border-amber-400/70 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 px-4 py-3 dark:border-amber-600/50 dark:from-amber-950/90 dark:via-amber-900/40 dark:to-amber-950/90",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/25 dark:bg-amber-500/20">
              <Clock className="h-4 w-4 text-amber-900 dark:text-amber-200" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100">
                {label}
              </p>
              <p className="text-xs font-medium text-amber-900/85 dark:text-amber-200/90">
                {formatChallengeStartDate(startDate)}
              </p>
            </div>
          </div>
          <p className="font-mono text-xl font-bold tabular-nums tracking-tight text-amber-950 dark:text-amber-50">
            {text}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "banner" || variant === "prominent") {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 to-amber-100/90 px-3 py-3 shadow-sm dark:border-amber-600/60 dark:from-amber-950/80 dark:to-amber-900/30",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/30 dark:bg-amber-500/25">
            <Clock className="h-5 w-5 text-amber-950 dark:text-amber-100" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100">
              {label}
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums leading-none text-amber-950 dark:text-amber-50">
              {text}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-amber-900/90 dark:text-amber-200/90">
              First day · {formatChallengeStartDate(startDate)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-50 to-amber-100/80 px-4 py-5 text-center shadow-sm dark:border-amber-600/50 dark:from-amber-950/80 dark:to-amber-900/40",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-900 dark:text-amber-100">
          {label}
        </p>
        <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight text-amber-950 dark:text-amber-50">
          {text}
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-900/90 dark:text-amber-200/90">
          {formatChallengeStartDate(startDate)}
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      role="timer"
      aria-live="polite"
    >
      {label}{" "}
      <span className="font-mono font-medium tabular-nums text-foreground">{text}</span>
    </p>
  );
}

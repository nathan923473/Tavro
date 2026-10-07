"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatChallengeCountdown,
  isChallengeUpcoming,
  msUntilChallengeStart,
} from "@/lib/challenge-countdown";
import { cn } from "@/lib/cn";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

type ChallengeStartCountdownProps = {
  startDate: string;
  className?: string;
  /** inline text, highlighted banner, or compact badge */
  variant?: "inline" | "banner" | "badge" | "hero";
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

  if (variant === "banner") {
    return (
      <p
        className={cn(
          "rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <span className="font-medium text-foreground">{label}</span>{" "}
        <span className="font-mono tabular-nums text-foreground">{text}</span>
      </p>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-primary/25 bg-primary/5 px-4 py-4 text-center",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {text}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Begins {startDate}</p>
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

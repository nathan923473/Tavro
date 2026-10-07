"use client";

import {
  formatHumanCountdownToStart,
  hasStarted,
  msUntilChallengeStartAt,
} from "@/lib/challenge-countdown";
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
  variant?: "inline" | "banner" | "badge" | "hero" | "strip" | "prominent";
  label?: string;
  showCreatorStart?: boolean;
};

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
  const startInstant = useMemo(() => {
    if (startAt) return new Date(startAt);
    if (startDate) return new Date(`${startDate}T00:00:00.000Z`);
    return null;
  }, [startAt, startDate]);

  const [text, setText] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!startInstant) return;
    const tick = () => {
      if (hasStarted(startInstant)) {
        setExpired(true);
        setText("Started");
        return;
      }
      setText(formatHumanCountdownToStart(startInstant));
    };
    tick();
    const ms = msUntilChallengeStartAt(startInstant.toISOString());
    const interval = ms < 3_600_000 ? 30_000 : 60_000;
    const id = window.setInterval(tick, interval);
    return () => window.clearInterval(id);
  }, [startInstant]);

  if (!startInstant || (expired && variant !== "inline")) {
    if (expired && variant === "inline") {
      return <p className={cn("text-sm text-muted-foreground", className)}>Started</p>;
    }
    return expired ? null : null;
  }

  if (expired && variant !== "inline") return null;

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

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        {text}
      </span>
    );
  }

  if (variant === "strip") {
    return (
      <div
        className={cn(
          "border-b-2 border-amber-400/70 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 px-4 py-3",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/25">
              <Clock className="h-4 w-4 text-amber-900" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                {label}
              </p>
              <p className="text-xs font-medium text-amber-900/85">{localLine} your time</p>
            </div>
          </div>
          <p className="text-lg font-bold text-amber-950">{text}</p>
        </div>
      </div>
    );
  }

  if (variant === "banner" || variant === "prominent") {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 to-amber-100/90 px-3 py-3 shadow-sm",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/30">
            <Clock className="h-5 w-5 text-amber-950" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              {label}
            </p>
            <p className="mt-0.5 text-xl font-bold leading-tight text-amber-950">{text}</p>
            <p className="mt-1.5 text-xs font-semibold text-amber-900/90">{localLine} your time</p>
            {creatorLine ? (
              <p className="mt-1 text-xs text-amber-900/80">
                Creator start: {creatorLine}
              </p>
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
          "rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-50 to-amber-100/80 px-4 py-5 text-center shadow-sm",
          className,
        )}
        role="timer"
        aria-live="polite"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-900">{label}</p>
        <p className="mt-2 text-2xl font-bold text-amber-950">{text}</p>
        <p className="mt-2 text-sm font-semibold text-amber-900/90">{localLine}</p>
        <p className="text-xs text-amber-900/75">{friendlyTimezoneTitle(participantTz)}</p>
        {creatorLine ? (
          <p className="mt-2 text-xs text-muted-foreground">Creator: {creatorLine}</p>
        ) : null}
      </div>
    );
  }

  return (
    <p className={cn("text-sm text-muted-foreground", className)} role="timer" aria-live="polite">
      {text}
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

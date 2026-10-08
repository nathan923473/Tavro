"use client";

import { ChallengeDateRange } from "@/components/challenges/challenge-date-range";
import { ChallengeStartCountdown } from "@/components/challenges/challenge-start-countdown";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { ChallengeCategory } from "@/types/creator-studio";
import { challengeStartInstantUtc, parseTimeLocal } from "@/lib/timezone/instant";
import { formatShortDateTime, formatTimeOnly } from "@/lib/timezone/format";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { CalendarRange, Gift, Users } from "lucide-react";
import { useMemo } from "react";

export type ChallengePreviewScheduleDay = {
  dayLabel: string;
  title: string;
  body: string;
  isRest: boolean;
};

const COVER_GRADIENT: Record<ChallengeCategory, string> = {
  walking: "linear-gradient(145deg, #3156E8, #2442c4)",
  strength: "linear-gradient(145deg, #6366f1, #4338ca)",
  running: "linear-gradient(145deg, #0ea5e9, #0369a1)",
  general_fitness: "linear-gradient(145deg, #14b8a6, #0f766e)",
  healthy_habits: "linear-gradient(145deg, #84cc16, #65a30d)",
  sleep: "linear-gradient(145deg, #8b5cf6, #6d28d9)",
  wellness: "linear-gradient(145deg, #f97316, #ea580c)",
  other: "linear-gradient(145deg, #64748b, #475569)",
};

type ChallengeCreatorLivePreviewProps = {
  templateLabel: string;
  category: ChallengeCategory;
  title: string;
  shortDescription: string;
  description: string;
  goalDescription: string;
  startDate: string;
  endDate: string;
  startTimeLocal: string;
  challengeTimezone: string;
  schedule: ChallengePreviewScheduleDay[];
  creatorDisplayName: string;
  creatorAvatarUrl?: string | null;
  coverUrl?: string | null;
  /** Inner card only (used inside phone frame wrapper). */
  framed?: boolean;
};

function habitsFromDay(day: ChallengePreviewScheduleDay): string[] {
  const extras = day.body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const t = day.title.trim();
  if (!t && !extras.length) return [];
  if (!t) return extras;
  return [t, ...extras.filter((e) => e.toLowerCase() !== t.toLowerCase())];
}

export function ChallengeCreatorLivePreview({
  templateLabel,
  category,
  title,
  shortDescription,
  description,
  goalDescription,
  startDate,
  endDate,
  startTimeLocal,
  challengeTimezone,
  schedule,
  creatorDisplayName,
  creatorAvatarUrl,
  coverUrl,
  framed = false,
}: ChallengeCreatorLivePreviewProps) {
  const displayTitle = title.trim() || "Your challenge name";
  const tz = normalizeTimezone(challengeTimezone);

  const { startAtIso, isUpcoming, localStartLine } = useMemo(() => {
    if (!startDate) {
      return { startAtIso: null as string | null, isUpcoming: false, localStartLine: null as string | null };
    }
    const time = parseTimeLocal(startTimeLocal) ?? { hours: 9, minutes: 0 };
    const start = challengeStartInstantUtc(startDate, time, tz);
    const upcoming = start.getTime() > Date.now();
    return {
      startAtIso: start.toISOString(),
      isUpcoming: upcoming,
      localStartLine: `${formatShortDateTime(start, tz)} (${formatTimeOnly(start, tz)} challenge time)`,
    };
  }, [startDate, startTimeLocal, tz]);

  const schedulePreview = schedule.filter((d) => d.title.trim() || d.body.trim() || d.isRest);

  return (
    <Card
      className={`overflow-hidden border-0 p-0 shadow-none ${framed ? "rounded-2xl bg-surface" : "shadow-md ring-1 ring-border/60"}`}
      aria-label="Live challenge page preview"
    >
        <div
          className="relative aspect-[2/1] w-full bg-muted"
          style={coverUrl ? undefined : { background: COVER_GRADIENT[category] }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-end p-3">
              <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white">
                Cover photo in Challenge photos
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <UserAvatar
                displayName={creatorDisplayName}
                avatarUrl={creatorAvatarUrl}
                size="sm"
                className="rounded-xl"
              />
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{creatorDisplayName}</p>
                <h3 className="text-base font-semibold leading-snug">
                  {displayTitle}
                </h3>
              </div>
            </div>
            <Badge tone="success" className="shrink-0 gap-0.5 text-[10px]">
              <Gift className="h-3 w-3" aria-hidden />
              Free
            </Badge>
          </div>

          {shortDescription.trim() ? (
            <p className="text-sm font-medium text-foreground/90">{shortDescription}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">Short description appears here</p>
          )}

          {description.trim() ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
          ) : null}

          {goalDescription.trim() ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">What you&apos;ll do: </span>
              {goalDescription}
            </p>
          ) : null}

          {startDate && endDate ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                <ChallengeDateRange
                  startDate={startDate}
                  endDate={endDate}
                  challengeTimezone={tz}
                />
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden />
                0 joined
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Add dates to show schedule & countdown</p>
          )}

          {localStartLine ? (
            <p className="text-[11px] text-muted-foreground">Official start: {localStartLine}</p>
          ) : null}

          {isUpcoming && startAtIso ? (
            <ChallengeStartCountdown
              startAt={startAtIso}
              challengeTimezone={tz}
              variant="prominent"
              label="Starting in"
            />
          ) : null}

          <div
            className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden
          >
            Join free
          </div>

          {schedulePreview.length > 0 ? (
            <section className="border-t border-border pt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Plan preview
              </h4>
              <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                {schedulePreview.slice(0, 6).map((day, i) => {
                  const habits = habitsFromDay(day);
                  return (
                    <li
                      key={`${day.dayLabel}-${i}`}
                      className="rounded-lg border border-border/80 bg-muted/30 px-2 py-1.5 text-xs"
                    >
                      <span className="font-medium">{day.dayLabel}</span>
                      {day.isRest ? (
                        <span className="text-muted-foreground"> · Rest</span>
                      ) : habits.length ? (
                        <span className="text-muted-foreground"> · {habits.join(" · ")}</span>
                      ) : (
                        <span className="italic text-muted-foreground"> · Add habits</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {schedulePreview.length > 6 ? (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  +{schedulePreview.length - 6} more days in full plan
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      </Card>
  );
}

"use client";

import {
  publishChallengeAction,
  saveChallengeDraftAction,
} from "@/app/(app)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CHALLENGE_TEMPLATES,
  templateByKey,
  type ChallengeTemplateKey,
} from "@/lib/creator/challenge-templates";
import type { ChallengeCategory } from "@/types/creator-studio";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { ShareChallengeButton } from "@/components/share/share-challenge-button";
import {
  challengeEndDateForDayCount,
  challengeTotalDays,
  indicesForEveryNthDay,
  indicesForWeekdaysInRange,
  WEEKDAY_SHORT,
  weekdayUtcForChallengeDay,
} from "@/lib/challenge-day";
import { TimezoneSelect } from "@/components/timezone/timezone-select";
import {
  formatCalendarDateKey,
  formatChallengeDateRange,
} from "@/lib/timezone/format";
import { ChallengeCoverField } from "@/components/challenges/challenge-cover-field";
import {
  CHALLENGE_COVER_REQUIRED_MESSAGE,
  challengeHasCover,
} from "@/lib/challenge-lifecycle/cover-required";
import { ChallengeBuilderWithPreview } from "@/components/creator/studio/challenge-builder-with-preview";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type Dispatch, type SetStateAction } from "react";

const INTERVAL_PRESETS = [2, 3, 4, 5, 6, 7, 10, 14] as const;

type ScheduleDraftItem = {
  dayLabel: string;
  title: string;
  body: string;
  isRest: boolean;
  weekTheme: string;
};

function habitsFromItem(item: ScheduleDraftItem): string[] {
  const extras = item.body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title = item.title.trim();
  if (!title && extras.length === 0) return [""];
  if (!title) return extras;
  const out = [title];
  for (const e of extras) {
    if (e.toLowerCase() !== title.toLowerCase()) out.push(e);
  }
  return out;
}

function setItemHabits(item: ScheduleDraftItem, habits: string[]): ScheduleDraftItem {
  const cleaned = habits.map((h) => h.trim()).filter(Boolean);
  return {
    ...item,
    title: cleaned[0] ?? "",
    body: cleaned.slice(1).join("\n"),
    ...(cleaned.length ? { isRest: false } : {}),
  };
}

function mergeItemHabits(item: ScheduleDraftItem, add: string[]): ScheduleDraftItem {
  const existing = habitsFromItem(item).filter(Boolean);
  const merged = [...existing];
  for (const h of add) {
    const t = h.trim();
    if (!t) continue;
    if (!merged.some((m) => m.toLowerCase() === t.toLowerCase())) merged.push(t);
  }
  return setItemHabits(item, merged.length ? merged : [""]);
}

function removeHabitsFromItem(item: ScheduleDraftItem, toRemove: string[]): ScheduleDraftItem {
  const removeSet = new Set(toRemove.map((h) => h.trim().toLowerCase()).filter(Boolean));
  if (!removeSet.size) return item;
  const kept = habitsFromItem(item).filter((h) => !removeSet.has(h.trim().toLowerCase()));
  return setItemHabits(item, kept.length ? kept : [""]);
}

function clearHabitsOnItem(item: ScheduleDraftItem): ScheduleDraftItem {
  return { ...item, title: "", body: "", isRest: item.isRest };
}

function parseBulkHabits(text: string): string[] {
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function buildScheduleForDayCount(
  totalDays: number,
  existing: ScheduleDraftItem[],
): ScheduleDraftItem[] {
  return Array.from({ length: totalDays }, (_, i) => {
    const prev = existing[i];
    return {
      dayLabel: prev?.dayLabel?.trim() ? prev.dayLabel : `Day ${i + 1}`,
      title: prev?.title ?? "",
      body: prev?.body ?? "",
      isRest: prev?.isRest ?? false,
      weekTheme: prev?.weekTheme ?? "",
    };
  });
}

const CATEGORIES: { value: ChallengeCategory; label: string }[] = [
  { value: "walking", label: "Walking" },
  { value: "strength", label: "Strength" },
  { value: "running", label: "Running" },
  { value: "general_fitness", label: "General fitness" },
  { value: "healthy_habits", label: "Healthy habits" },
  { value: "sleep", label: "Sleep" },
  { value: "wellness", label: "Wellness" },
  { value: "other", label: "Other" },
];

export function ChallengeBuilderWizard({
  defaultChallengeTimezone = "Australia/Melbourne",
  creatorDisplayName = "You",
  creatorAvatarUrl = null,
}: {
  defaultChallengeTimezone?: string;
  creatorDisplayName?: string;
  creatorAvatarUrl?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplate = (searchParams.get("template") ??
    "scratch") as ChallengeTemplateKey;
  const template = useMemo(() => templateByKey(initialTemplate), [initialTemplate]);

  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | undefined>();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [published, setPublished] = useState<{
    invitePath: string;
    creatorPath: string;
  } | null>(null);

  const [title, setTitle] = useState(template.title);
  const [shortDescription, setShortDescription] = useState(template.shortDescription);
  const [description, setDescription] = useState("");
  const [goalDescription, setGoalDescription] = useState(template.goalDescription);
  const [category, setCategory] = useState<ChallengeCategory>(template.category);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTimeLocal, setStartTimeLocal] = useState("09:00");
  const [challengeTimezone, setChallengeTimezone] = useState(defaultChallengeTimezone);
  const [allowLateJoin, setAllowLateJoin] = useState(false);
  const [lateJoinUntilDate, setLateJoinUntilDate] = useState("");
  const [lengthShortcut, setLengthShortcut] = useState("30");
  const [schedule, setSchedule] = useState<ScheduleDraftItem[]>(
    template.schedule.map((s) => ({
      dayLabel: s.dayLabel,
      title: s.title,
      body: s.body ?? "",
      isRest: s.isRest,
      weekTheme: s.weekTheme ?? "",
    })),
  );
  const [selectedDays, setSelectedDays] = useState<Set<number>>(() => new Set());
  const [bulkHabitsText, setBulkHabitsText] = useState("");
  const [bulkAppend, setBulkAppend] = useState(false);
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(1);
  const [scheduleSavedFlash, setScheduleSavedFlash] = useState(false);

  const datesInvalid = Boolean(startDate && endDate && endDate < startDate);

  function updateSchedule(next: ScheduleDraftItem[] | ((prev: ScheduleDraftItem[]) => ScheduleDraftItem[])) {
    setSchedule(next);
    setScheduleSavedFlash(false);
  }

  const plannedDayCount = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return 0;
    return challengeTotalDays(startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (step !== 3 || plannedDayCount < 1) return;
    setSchedule((prev) => buildScheduleForDayCount(plannedDayCount, prev));
    setBulkTo(plannedDayCount);
  }, [step, plannedDayCount]);

  useEffect(() => {
    if (plannedDayCount > 0) {
      setBulkTo((prev) => Math.min(Math.max(prev, 1), plannedDayCount));
      setBulkFrom((prev) => Math.min(Math.max(prev, 1), plannedDayCount));
    }
  }, [plannedDayCount]);

  function saveDraft(nextStep?: number) {
    startTransition(async () => {
      try {
        setError(null);
        const result = await saveChallengeDraftAction({
          challengeId,
          templateKey: initialTemplate,
          title,
          shortDescription,
          description,
          goalDescription,
          category,
          startDate,
          endDate,
          startTimeLocal,
          challengeTimezone,
          schedule,
          allowLateJoin,
          lateJoinUntilDate: allowLateJoin && lateJoinUntilDate ? lateJoinUntilDate : null,
        });
        setChallengeId(result.challengeId);
        if (result.coverUrl) {
          setCoverUrl(result.coverUrl);
        }
        if (step === 3) {
          setScheduleSavedFlash(true);
        }
        if (typeof nextStep === "number") setStep(nextStep);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  if (published) {
    return (
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Your challenge is live!</h2>
        <p className="text-sm text-muted-foreground">
          Share your link on Instagram, Stories, or DMs. All challenges are free to join.
        </p>
        <CopyLinkButton url={published.creatorPath} label="Copy challenge link" fullWidth />
        <ShareChallengeButton path={published.creatorPath} title={title} fullWidth />
        <Link
          href={published.creatorPath}
          className="flex min-h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          View challenge page
        </Link>
        <CopyLinkButton url={published.invitePath} label="Short link (/join)" fullWidth />
        <Link href="/studio/challenges" className="block text-center text-sm text-muted-foreground">
          Back to challenges
        </Link>
      </Card>
    );
  }

  const previewProps = {
    templateLabel: template.label,
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
  };

  return (
    <ChallengeBuilderWithPreview {...previewProps} showPreview={step >= 0 && step <= 4}>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step {step + 1} of 5
        </p>
        <p className="truncate text-xs text-muted-foreground">{template.label}</p>
      </div>

      {step === 0 ? (
        <Card className="space-y-4">
          <div>
            <h2 className="font-semibold">What type of challenge?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a template — you can change everything in the next steps.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHALLENGE_TEMPLATES.map((t) => {
              const selected = t.key === initialTemplate;
              return (
                <Link
                  key={t.key}
                  href={`/studio/challenges/new?template=${t.key}`}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <Button type="button" fullWidth onClick={() => setStep(1)}>
            Continue with {template.label}
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">Challenge basics</h2>
          <Field label="Challenge name" value={title} onChange={setTitle} required />
          <Field
            label="Short description"
            value={shortDescription}
            onChange={setShortDescription}
          />
          <label className="block text-sm">
            <span className="font-medium">Full description</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Category</span>
            <select
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as ChallengeCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field
              label="Start date"
              type="date"
              value={startDate}
              onChange={setStartDate}
              required
            />
            <Field
              label="End date"
              type="date"
              value={endDate}
              onChange={setEndDate}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Start time</span>
              <input
                type="time"
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
                required
              />
            </label>
            <TimezoneSelect
              label="Challenge timezone"
              value={challengeTimezone}
              onChange={setChallengeTimezone}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Participants in other timezones will automatically see this converted to their local
            time. You can publish and open registrations anytime before the start — many creators
            share 2 weeks ahead.
          </p>

          <fieldset className="space-y-2 rounded-xl border border-border px-3 py-3">
            <legend className="px-1 text-sm font-semibold">Registration after start</legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={allowLateJoin}
                onChange={(e) => setAllowLateJoin(e.target.checked)}
              />
              <span>
                Allow participants to join after the challenge starts
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Default: registration closes at the official start time. Late joiners start on
                  today&apos;s challenge day, not day 1.
                </span>
              </span>
            </label>
            {allowLateJoin ? (
              <label className="block text-sm">
                <span className="text-xs font-medium text-muted-foreground">
                  Optional late-join cutoff date (through end of day)
                </span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={lateJoinUntilDate}
                  min={startDate || undefined}
                  max={endDate || undefined}
                  onChange={(e) => setLateJoinUntilDate(e.target.value)}
                />
              </label>
            ) : null}
          </fieldset>

          {startDate && endDate ? (
            datesInvalid ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                End date must be on or after the start date.
              </p>
            ) : (
              <ChallengeDurationSummary
                startDate={startDate}
                endDate={endDate}
                dayCount={plannedDayCount}
                challengeTimezone={challengeTimezone}
              />
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              Choose start and end dates — we&apos;ll show how many challenge days that includes
              (both dates count as day 1 and the last day).
            </p>
          )}

          {startDate && !datesInvalid ? (
            <div className="flex flex-wrap items-end gap-2 text-sm">
              <label className="block min-w-[8rem] flex-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Set exact length (updates end date)
                </span>
                <input
                  type="number"
                  min={1}
                  max={400}
                  className="mt-0.5 w-full rounded-xl border border-border px-3 py-2 text-sm"
                  value={lengthShortcut}
                  onChange={(e) => setLengthShortcut(e.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  const n = Number.parseInt(lengthShortcut, 10);
                  if (!startDate || !Number.isFinite(n) || n < 1) return;
                  setEndDate(challengeEndDateForDayCount(startDate, n));
                }}
              >
                Apply {lengthShortcut || "?"} days
              </Button>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={
                pending || !title.trim() || !startDate || !endDate || datesInvalid || plannedDayCount < 1
              }
              onClick={() => saveDraft(2)}
            >
              Save & continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">Challenge goal</h2>
          <p className="text-sm text-muted-foreground">
            Explain what participants are working toward — keep it safe and flexible.
          </p>
          <textarea
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            rows={4}
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
          />
          {challengeId ? (
            <ChallengeCoverField
              challengeId={challengeId}
              coverUrl={coverUrl}
              title={title}
              disabled={pending}
              required
              onCoverUrlChange={setCoverUrl}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              Save challenge basics first — then upload a required cover image here.
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={pending || !challengeHasCover(coverUrl)}
              onClick={() => saveDraft(3)}
            >
              Continue
            </Button>
          </div>
          {challengeId && !challengeHasCover(coverUrl) ? (
            <p className="text-xs text-amber-800">{CHALLENGE_COVER_REQUIRED_MESSAGE}</p>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <ScheduleStep
          schedule={schedule}
          setSchedule={updateSchedule}
          plannedDayCount={plannedDayCount}
          startDate={startDate}
          endDate={endDate}
          challengeTimezone={challengeTimezone}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          bulkHabitsText={bulkHabitsText}
          setBulkHabitsText={setBulkHabitsText}
          bulkAppend={bulkAppend}
          setBulkAppend={setBulkAppend}
          bulkFrom={bulkFrom}
          setBulkFrom={setBulkFrom}
          bulkTo={bulkTo}
          setBulkTo={setBulkTo}
          pending={pending}
          scheduleSavedFlash={scheduleSavedFlash}
          onBack={() => setStep(2)}
          onSave={() => saveDraft()}
          onPreview={() => saveDraft(4)}
        />
      ) : null}

      {step === 4 ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">Review & publish</h2>
          <p className="text-sm text-muted-foreground">
            Use the live participant preview while you edit. Below is your full day-by-day plan before
            you publish.
          </p>
          <p className="text-xs text-muted-foreground">
            {plannedDayCount} days · {formatChallengeDateRange(startDate, endDate, challengeTimezone)} ·
            Free challenge
          </p>
          <section aria-labelledby="preview-schedule-heading">
            <h3 id="preview-schedule-heading" className="text-sm font-semibold">
              Full schedule ({schedule.length} day{schedule.length === 1 ? "" : "s"})
            </h3>
            <ul className="mt-2 max-h-[min(420px,55vh)] space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 text-sm">
              {schedule.map((s, i) => {
                const dayHabits = habitsFromItem(s).filter(Boolean);
                const weekday =
                  startDate && !s.isRest
                    ? ` (${WEEKDAY_SHORT[weekdayUtcForChallengeDay(startDate, i + 1)]})`
                    : "";
                return (
                  <li key={i} className="leading-snug">
                    <span className="font-medium">
                      {s.dayLabel}
                      {weekday}:
                    </span>{" "}
                    {s.isRest ? "Rest" : dayHabits.join(" · ") || "—"}
                  </li>
                );
              })}
            </ul>
          </section>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={pending || !challengeId || !challengeHasCover(coverUrl)}
              onClick={() => {
                if (!challengeId) return;
                startTransition(async () => {
                  try {
                    setError(null);
                    const paths = await publishChallengeAction(challengeId);
                    setPublished(paths);
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Publish failed.");
                  }
                });
              }}
            >
              Publish challenge
            </Button>
          </div>
          {!challengeHasCover(coverUrl) ? (
            <p className="text-xs text-amber-800">{CHALLENGE_COVER_REQUIRED_MESSAGE}</p>
          ) : null}
        </Card>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </ChallengeBuilderWithPreview>
  );
}

function ScheduleStep({
  schedule,
  setSchedule,
  plannedDayCount,
  startDate,
  endDate,
  challengeTimezone,
  selectedDays,
  setSelectedDays,
  bulkHabitsText,
  setBulkHabitsText,
  bulkAppend,
  setBulkAppend,
  bulkFrom,
  setBulkFrom,
  bulkTo,
  setBulkTo,
  pending,
  scheduleSavedFlash,
  onBack,
  onSave,
  onPreview,
}: {
  schedule: ScheduleDraftItem[];
  setSchedule: (
    next: ScheduleDraftItem[] | ((prev: ScheduleDraftItem[]) => ScheduleDraftItem[]),
  ) => void;
  plannedDayCount: number;
  startDate: string;
  endDate: string;
  challengeTimezone: string;
  selectedDays: Set<number>;
  setSelectedDays: Dispatch<SetStateAction<Set<number>>>;
  bulkHabitsText: string;
  setBulkHabitsText: (v: string) => void;
  bulkAppend: boolean;
  setBulkAppend: (v: boolean) => void;
  bulkFrom: number;
  setBulkFrom: (v: number) => void;
  bulkTo: number;
  setBulkTo: (v: number) => void;
  pending: boolean;
  scheduleSavedFlash: boolean;
  onBack: () => void;
  onSave: () => void;
  onPreview: () => void;
}) {
  const [weekdays, setWeekdays] = useState<Set<number>>(() => new Set());
  const [intervalStep, setIntervalStep] = useState<number>(2);
  const [intervalAnchor, setIntervalAnchor] = useState(1);
  const [removeHabitsText, setRemoveHabitsText] = useState("");

  const rangeFrom = Math.min(bulkFrom, bulkTo);
  const rangeTo = Math.max(bulkFrom, bulkTo);
  const rangeDayCount = Math.max(0, rangeTo - rangeFrom + 1);

  const bulkHabits = parseBulkHabits(bulkHabitsText);
  const habitsToRemove = parseBulkHabits(removeHabitsText);
  const hasBulkHabits = bulkHabits.length > 0;
  const hasRemoveHabits = habitsToRemove.length > 0;

  function applyBulkToIndices(indices: number[], habits: string[], mode: "replace" | "append") {
    if (!habits.length) return;
    const next = [...schedule];
    for (const i of indices) {
      if (i < 0 || i >= next.length) continue;
      next[i] =
        mode === "append"
          ? mergeItemHabits(next[i], habits)
          : setItemHabits(next[i], habits);
    }
    setSchedule(next);
  }

  function removeHabitsFromIndices(indices: number[], toRemove: string[]) {
    if (!toRemove.length) return;
    const next = [...schedule];
    for (const i of indices) {
      if (i < 0 || i >= next.length) continue;
      next[i] = removeHabitsFromItem(next[i], toRemove);
    }
    setSchedule(next);
  }

  function clearHabitsOnIndices(indices: number[]) {
    const next = [...schedule];
    for (const i of indices) {
      if (i < 0 || i >= next.length) continue;
      next[i] = clearHabitsOnItem(next[i]);
    }
    setSchedule(next);
  }

  function indicesForRange() {
    const indices: number[] = [];
    for (let d = rangeFrom; d <= rangeTo; d++) indices.push(d - 1);
    return indices;
  }

  function applyBulkRange() {
    applyBulkToIndices(indicesForRange(), bulkHabits, bulkAppend ? "append" : "replace");
  }

  function applyBulkToSelected() {
    applyBulkToIndices([...selectedDays], bulkHabits, bulkAppend ? "append" : "replace");
  }

  function toggleDaySelected(index: number) {
    const next = new Set(selectedDays);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedDays(next);
  }

  function selectAllDays() {
    setSelectedDays(new Set(schedule.map((_, i) => i)));
  }

  function clearSelectedDays() {
    setSelectedDays(new Set());
  }

  function toggleWeekday(w: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  }

  function applyToWeekdays() {
    if (!startDate) return;
    const indices = indicesForWeekdaysInRange(startDate, rangeFrom, rangeTo, weekdays);
    applyBulkToIndices(indices, bulkHabits, bulkAppend ? "append" : "replace");
  }

  function applyToInterval(step: number) {
    const indices = indicesForEveryNthDay(rangeFrom, rangeTo, step, intervalAnchor);
    applyBulkToIndices(indices, bulkHabits, bulkAppend ? "append" : "replace");
  }

  function selectMatchingWeekdaysInRange() {
    if (!startDate || weekdays.size === 0) return;
    setSelectedDays(new Set(indicesForWeekdaysInRange(startDate, rangeFrom, rangeTo, weekdays)));
  }

  function selectMatchingIntervalInRange(step: number) {
    setSelectedDays(
      new Set(indicesForEveryNthDay(rangeFrom, rangeTo, step, intervalAnchor)),
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Schedule</h2>
        {plannedDayCount > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {plannedDayCount} days · {formatChallengeDateRange(startDate, endDate, challengeTimezone)}.
            Participants check off each habit on
            the Today tab.
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-800">
            Set start and end dates on the basics step first.
          </p>
        )}
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Write habits and apply them to a day range (or pick days below).</li>
          <li>Tap <strong className="font-medium text-foreground">Save schedule</strong> so nothing is lost.</li>
          <li>Scroll the day list to fine-tune or mark rest days.</li>
        </ol>
      </div>

      <Card padding="sm" className="space-y-2 border-primary/30 bg-primary/5">
        <Button type="button" fullWidth disabled={pending || schedule.length === 0} onClick={onSave}>
          {pending ? "Saving…" : "Save schedule"}
        </Button>
        {scheduleSavedFlash ? (
          <p className="text-center text-sm font-medium text-primary" role="status">
            Saved. You can publish from Preview when ready.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Save after you apply habits — changes aren&apos;t stored until you do.
          </p>
        )}
      </Card>

      <Card padding="sm" className="space-y-3">
        <div>
          <p className="text-sm font-semibold">1 · Habits to add</p>
          <p className="text-xs text-muted-foreground">One habit per line.</p>
        </div>
        <textarea
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          rows={3}
          value={bulkHabitsText}
          onChange={(e) => setBulkHabitsText(e.target.value)}
          placeholder={"10,000 steps\n5 burpees"}
          aria-label="Habits to add, one per line"
        />
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-muted-foreground">When applying</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="bulk-mode"
              checked={!bulkAppend}
              onChange={() => setBulkAppend(false)}
            />
            Replace habits on those days
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="bulk-mode"
              checked={bulkAppend}
              onChange={() => setBulkAppend(true)}
            />
            Add to existing habits on those days
          </label>
        </fieldset>
      </Card>

      <Card padding="sm" className="space-y-3">
        <div>
          <p className="text-sm font-semibold">2 · Which days</p>
          <p className="text-xs text-muted-foreground">
            Day range for bulk actions · {rangeDayCount} day{rangeDayCount === 1 ? "" : "s"} selected
            {selectedDays.size > 0 ? ` · ${selectedDays.size} checked in the list below` : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">From day</span>
            <input
              type="number"
              min={1}
              max={schedule.length || 1}
              className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5"
              value={bulkFrom}
              onChange={(e) => setBulkFrom(Number(e.target.value) || 1)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">To day</span>
            <input
              type="number"
              min={1}
              max={schedule.length || 1}
              className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5"
              value={bulkTo}
              onChange={(e) => setBulkTo(Number(e.target.value) || 1)}
            />
          </label>
        </div>
        <Button type="button" fullWidth disabled={!hasBulkHabits} onClick={applyBulkRange}>
          Apply habits to days {rangeFrom}–{rangeTo}
        </Button>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!hasBulkHabits || selectedDays.size === 0}
            onClick={applyBulkToSelected}
          >
            Apply to checked days ({selectedDays.size})
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!hasBulkHabits}
            onClick={() =>
              applyBulkToIndices(
                schedule.map((_, i) => i),
                bulkHabits,
                bulkAppend ? "append" : "replace",
              )
            }
          >
            Apply to all {schedule.length} days
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <button type="button" className="font-semibold text-primary" onClick={selectAllDays}>
            Check all days
          </button>
          <button type="button" className="font-semibold text-primary" onClick={clearSelectedDays}>
            Uncheck all
          </button>
        </div>

        <details className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">More ways to pick days (optional)</summary>
          <div className="mt-3 space-y-4 border-t border-border pt-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Same habits every Mon / Thu, etc.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {WEEKDAY_SHORT.map((label, w) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleWeekday(w)}
                    className={`min-h-9 rounded-lg border px-2.5 text-xs font-semibold ${
                      weekdays.has(w)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="text-sm"
                  disabled={!hasBulkHabits || weekdays.size === 0 || !startDate}
                  onClick={applyToWeekdays}
                >
                  Apply to those weekdays
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-sm"
                  disabled={weekdays.size === 0 || !startDate}
                  onClick={selectMatchingWeekdaysInRange}
                >
                  Check those weekdays
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Every 2nd / 3rd day, etc.</p>
              <label className="mt-1 block text-xs">
                Start on day
                <input
                  type="number"
                  min={1}
                  max={schedule.length || 1}
                  className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5"
                  value={intervalAnchor}
                  onChange={(e) => setIntervalAnchor(Number(e.target.value) || 1)}
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INTERVAL_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIntervalStep(n)}
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold ${
                      intervalStep === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border"
                    }`}
                  >
                    Every {n}d
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="text-sm"
                  disabled={!hasBulkHabits}
                  onClick={() => applyToInterval(intervalStep)}
                >
                  Apply every {intervalStep} days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-sm"
                  onClick={() => selectMatchingIntervalInRange(intervalStep)}
                >
                  Check that pattern
                </Button>
              </div>
            </div>
          </div>
        </details>
      </Card>

      <Card padding="sm" className="space-y-3 border-red-100 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20">
        <div>
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">3 · Remove habits</p>
          <p className="text-xs text-red-900/80 dark:text-red-200/80">
            Separate list — type habits to remove (one per line). Uses the same day range as above, or
            checked days.
          </p>
        </div>
        <textarea
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          rows={2}
          value={removeHabitsText}
          onChange={(e) => setRemoveHabitsText(e.target.value)}
          placeholder="5 burpees"
          aria-label="Habits to remove, one per line"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            disabled={!hasRemoveHabits}
            onClick={() => removeHabitsFromIndices(indicesForRange(), habitsToRemove)}
          >
            Remove from days {rangeFrom}–{rangeTo}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasRemoveHabits || selectedDays.size === 0}
            onClick={() => removeHabitsFromIndices([...selectedDays], habitsToRemove)}
          >
            Remove from checked days
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="border-red-300 text-red-800 dark:text-red-300"
          disabled={selectedDays.size === 0}
          onClick={() => {
            if (
              !window.confirm(
                `Clear every habit on ${selectedDays.size} checked day(s)? Rest-day flags stay.`,
              )
            ) {
              return;
            }
            clearHabitsOnIndices([...selectedDays]);
          }}
        >
          Clear all habits on checked days
        </Button>
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold">4 · Each day (fine-tune)</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Use the checkbox to include a day in &quot;checked days&quot; actions above.
        </p>
      </div>

      <div className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
        <ul className="space-y-2">
          {schedule.map((item, i) => (
            <li
              key={i}
              className={`rounded-xl border p-3 text-sm ${
                selectedDays.has(i) ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedDays.has(i)}
                  onChange={() => toggleDaySelected(i)}
                  aria-label={`Select ${item.dayLabel}`}
                />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.dayLabel}
                  {startDate ? (
                    <span className="ml-1.5 font-normal normal-case text-muted-foreground/80">
                      ({WEEKDAY_SHORT[weekdayUtcForChallengeDay(startDate, i + 1)]})
                    </span>
                  ) : null}
                </span>
              </div>
              <DayHabitsEditor
                habits={habitsFromItem(item)}
                disabled={item.isRest}
                onChange={(habits) => {
                  const next = [...schedule];
                  next[i] = setItemHabits(next[i], habits);
                  setSchedule(next);
                }}
              />
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={item.isRest}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[i] = { ...next[i], isRest: e.target.checked };
                    setSchedule(next);
                  }}
                />
                Rest / recovery day
              </label>
            </li>
          ))}
        </ul>
      </div>

      {plannedDayCount > 0 && schedule.length !== plannedDayCount ? (
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => setSchedule(buildScheduleForDayCount(plannedDayCount, schedule))}
        >
          Reset to {plannedDayCount} days from your dates
        </Button>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" fullWidth disabled={pending || schedule.length === 0} onClick={onPreview}>
          Save &amp; preview
        </Button>
      </div>
    </div>
  );
}

function DayHabitsEditor({
  habits,
  onChange,
  disabled,
}: {
  habits: string[];
  onChange: (habits: string[]) => void;
  disabled?: boolean;
}) {
  const rows = habits.length ? habits : [""];

  function updateRow(index: number, value: string) {
    const next = [...rows];
    next[index] = value;
    onChange(next);
  }

  function addRow() {
    onChange([...rows, ""]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(rows.filter((_, j) => j !== index));
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Habits for this day</p>
      {rows.map((h, hi) => (
        <div key={hi} className="flex gap-1.5">
          <input
            className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1 font-medium disabled:opacity-50"
            value={h}
            disabled={disabled}
            onChange={(e) => updateRow(hi, e.target.value)}
            placeholder={hi === 0 ? "Primary habit" : "Additional habit"}
          />
          {rows.length > 1 ? (
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border px-2 text-xs text-muted-foreground"
              disabled={disabled}
              onClick={() => removeRow(hi)}
              aria-label="Remove habit"
            >
              ✕
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className="text-xs font-semibold text-primary disabled:opacity-50"
        disabled={disabled}
        onClick={addRow}
      >
        + Add another habit
      </button>
    </div>
  );
}

function ChallengeDurationSummary({
  startDate,
  endDate,
  dayCount,
  challengeTimezone,
}: {
  startDate: string;
  endDate: string;
  dayCount: number;
  challengeTimezone?: string;
}) {
  return (
    <div className="rounded-xl border-2 border-primary/25 bg-primary/5 px-4 py-3">
      <p className="text-lg font-semibold text-foreground">
        {dayCount} day{dayCount === 1 ? "" : "s"} long
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Day 1 is{" "}
        <span className="font-medium text-foreground">
          {formatCalendarDateKey(startDate, challengeTimezone)}
        </span>
        {" · "}
        Day {dayCount} is{" "}
        <span className="font-medium text-foreground">
          {formatCalendarDateKey(endDate, challengeTimezone)}
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Your schedule step will include {dayCount} row{dayCount === 1 ? "" : "s"} (one per day,
        counting both start and end dates).
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        required={required}
        className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

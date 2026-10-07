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

export function ChallengeBuilderWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplate = (searchParams.get("template") ??
    "scratch") as ChallengeTemplateKey;
  const template = useMemo(() => templateByKey(initialTemplate), [initialTemplate]);

  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | undefined>();
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
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkFrom, setBulkFrom] = useState(1);
  const [bulkTo, setBulkTo] = useState(1);

  const datesInvalid = Boolean(startDate && endDate && endDate < startDate);

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
          schedule,
        });
        setChallengeId(result.challengeId);
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

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Step {step + 1} of 5
      </p>

      {step === 0 ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">What type of challenge?</h2>
          <div className="grid gap-2">
            {CHALLENGE_TEMPLATES.map((t) => (
              <Link
                key={t.key}
                href={`/studio/challenges/new?template=${t.key}`}
                className="rounded-xl border border-border px-3 py-3 text-sm font-medium"
              >
                {t.label}
              </Link>
            ))}
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={pending} onClick={() => saveDraft(3)}>
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <ScheduleStep
          schedule={schedule}
          setSchedule={setSchedule}
          plannedDayCount={plannedDayCount}
          startDate={startDate}
          endDate={endDate}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          bulkTitle={bulkTitle}
          setBulkTitle={setBulkTitle}
          bulkFrom={bulkFrom}
          setBulkFrom={setBulkFrom}
          bulkTo={bulkTo}
          setBulkTo={setBulkTo}
          pending={pending}
          onBack={() => setStep(2)}
          onPreview={() => saveDraft(4)}
        />
      ) : null}

      {step === 4 ? (
        <Card className="space-y-3">
          <h2 className="font-semibold">Preview</h2>
          <p className="text-lg font-semibold">{title}</p>
          {shortDescription ? (
            <p className="text-sm text-muted-foreground">{shortDescription}</p>
          ) : null}
          <p className="text-sm">{goalDescription}</p>
          <p className="text-xs text-muted-foreground">
            {plannedDayCount} days · {startDate} → {endDate} · Free challenge
          </p>
          <ul className="space-y-1 text-sm">
            {schedule.slice(0, 5).map((s, i) => (
              <li key={i}>
                {s.dayLabel}: {s.title}
                {s.isRest ? " (rest)" : ""}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={pending || !challengeId}
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
        </Card>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ScheduleStep({
  schedule,
  setSchedule,
  plannedDayCount,
  startDate,
  endDate,
  selectedDays,
  setSelectedDays,
  bulkTitle,
  setBulkTitle,
  bulkFrom,
  setBulkFrom,
  bulkTo,
  setBulkTo,
  pending,
  onBack,
  onPreview,
}: {
  schedule: ScheduleDraftItem[];
  setSchedule: (next: ScheduleDraftItem[]) => void;
  plannedDayCount: number;
  startDate: string;
  endDate: string;
  selectedDays: Set<number>;
  setSelectedDays: Dispatch<SetStateAction<Set<number>>>;
  bulkTitle: string;
  setBulkTitle: (v: string) => void;
  bulkFrom: number;
  setBulkFrom: (v: number) => void;
  bulkTo: number;
  setBulkTo: (v: number) => void;
  pending: boolean;
  onBack: () => void;
  onPreview: () => void;
}) {
  const [weekdays, setWeekdays] = useState<Set<number>>(() => new Set());
  const [intervalStep, setIntervalStep] = useState<number>(2);
  const [intervalAnchor, setIntervalAnchor] = useState(1);

  const rangeFrom = Math.min(bulkFrom, bulkTo);
  const rangeTo = Math.max(bulkFrom, bulkTo);

  function applyBulkToIndices(indices: number[], title: string, asRest: boolean) {
    if (!title.trim() && !asRest) return;
    const next = [...schedule];
    for (const i of indices) {
      if (i < 0 || i >= next.length) continue;
      next[i] = {
        ...next[i],
        ...(title.trim() ? { title: title.trim(), isRest: false } : {}),
        ...(asRest ? { isRest: true, title: next[i].title || "Rest" } : {}),
      };
    }
    setSchedule(next);
  }

  function applyBulkRange() {
    const from = Math.min(bulkFrom, bulkTo);
    const to = Math.max(bulkFrom, bulkTo);
    const indices: number[] = [];
    for (let d = from; d <= to; d++) indices.push(d - 1);
    applyBulkToIndices(indices, bulkTitle, false);
  }

  function applyBulkToSelected() {
    applyBulkToIndices([...selectedDays], bulkTitle, false);
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
    applyBulkToIndices(indices, bulkTitle, false);
  }

  function applyToInterval(step: number) {
    const indices = indicesForEveryNthDay(rangeFrom, rangeTo, step, intervalAnchor);
    applyBulkToIndices(indices, bulkTitle, false);
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
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold">Schedule</h2>
        {plannedDayCount > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {plannedDayCount} days · {startDate} → {endDate}. One row per challenge day — fill habits
            below or apply to many days at once.
          </p>
        ) : (
          <p className="mt-1 text-sm text-amber-800">
            Set start and end dates on the basics step first.
          </p>
        )}
      </div>

      <Card padding="sm" className="space-y-3 border-primary/20 bg-secondary/20">
        <p className="text-sm font-semibold">Add habit to multiple days</p>
        <input
          className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium"
          value={bulkTitle}
          onChange={(e) => setBulkTitle(e.target.value)}
          placeholder="e.g. 10,000 steps or 30-min walk"
        />
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={!bulkTitle.trim()}
            onClick={applyBulkRange}
          >
            Apply to day range
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={!bulkTitle.trim() || selectedDays.size === 0}
            onClick={applyBulkToSelected}
          >
            Apply to selected ({selectedDays.size})
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" className="font-semibold text-primary" onClick={selectAllDays}>
            Select all days
          </button>
          <span className="text-muted-foreground">·</span>
          <button type="button" className="font-semibold text-primary" onClick={clearSelectedDays}>
            Clear selection
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="font-semibold text-primary"
            onClick={() => {
              if (!bulkTitle.trim()) return;
              applyBulkToIndices(
                schedule.map((_, i) => i),
                bulkTitle,
                false,
              );
            }}
          >
            Apply to all days
          </button>
        </div>

        <div className="border-t border-border/60 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            By weekday (uses From/To day above)
          </p>
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
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 text-sm"
              disabled={!bulkTitle.trim() || weekdays.size === 0 || !startDate}
              onClick={applyToWeekdays}
            >
              Apply to selected weekdays
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-sm"
              disabled={weekdays.size === 0 || !startDate}
              onClick={selectMatchingWeekdaysInRange}
            >
              Highlight those days
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Every Nth day (within From/To range)
          </p>
          <label className="mt-2 block text-sm">
            <span className="text-xs font-medium text-muted-foreground">Start pattern on day</span>
            <input
              type="number"
              min={1}
              max={schedule.length || 1}
              className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5"
              value={intervalAnchor}
              onChange={(e) => setIntervalAnchor(Number(e.target.value) || 1)}
            />
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            e.g. start on day 1 + every 2 days → days 1, 3, 5…
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INTERVAL_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setIntervalStep(n)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                  intervalStep === n
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border"
                }`}
              >
                Every {n} days
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <span className="shrink-0 text-xs text-muted-foreground">Custom</span>
            <input
              type="number"
              min={1}
              max={90}
              className="w-20 rounded-lg border border-border px-2 py-1"
              value={intervalStep}
              onChange={(e) => setIntervalStep(Math.max(1, Number(e.target.value) || 1))}
            />
            <span className="text-xs text-muted-foreground">days apart</span>
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 text-sm"
              disabled={!bulkTitle.trim()}
              onClick={() => applyToInterval(intervalStep)}
            >
              Apply every {intervalStep} days
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => selectMatchingIntervalInRange(intervalStep)}
            >
              Highlight pattern
            </Button>
          </div>
        </div>
      </Card>

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
              <input
                className="mb-1 w-full rounded-lg border border-border px-2 py-1 font-medium"
                value={item.title}
                onChange={(e) => {
                  const next = [...schedule];
                  next[i] = { ...next[i], title: e.target.value };
                  setSchedule(next);
                }}
                placeholder="Activity / habit for this day"
              />
              <label className="flex items-center gap-2 text-xs">
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

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" fullWidth disabled={pending || schedule.length === 0} onClick={onPreview}>
          Preview
        </Button>
      </div>
    </Card>
  );
}

function formatChallengeDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ChallengeDurationSummary({
  startDate,
  endDate,
  dayCount,
}: {
  startDate: string;
  endDate: string;
  dayCount: number;
}) {
  return (
    <div className="rounded-xl border-2 border-primary/25 bg-primary/5 px-4 py-3">
      <p className="text-lg font-semibold text-foreground">
        {dayCount} day{dayCount === 1 ? "" : "s"} long
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Day 1 is <span className="font-medium text-foreground">{formatChallengeDate(startDate)}</span>
        {" · "}
        Day {dayCount} is{" "}
        <span className="font-medium text-foreground">{formatChallengeDate(endDate)}</span>
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

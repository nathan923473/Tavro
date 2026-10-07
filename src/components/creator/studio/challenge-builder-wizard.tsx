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
import { challengeEndDateForDayCount } from "@/lib/challenge-day";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

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
  const [durationDays, setDurationDays] = useState(30);
  const [endDate, setEndDate] = useState("");
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

  const plannedDayCount = useMemo(() => {
    if (!startDate || durationDays < 1) return 0;
    return Math.max(1, Math.floor(durationDays));
  }, [startDate, durationDays]);

  useEffect(() => {
    if (!startDate || durationDays < 1) return;
    setEndDate(challengeEndDateForDayCount(startDate, durationDays));
  }, [startDate, durationDays]);

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
          <Field
            label="Start date (day 1)"
            type="date"
            value={startDate}
            onChange={setStartDate}
            required
          />
          <label className="block text-sm">
            <span className="font-medium">Challenge length (days)</span>
            <input
              type="number"
              min={1}
              max={400}
              required
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              value={durationDays}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                setDurationDays(Number.isFinite(n) && n > 0 ? n : 1);
              }}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              A 30-day challenge is 30 rows in your plan — not the same as picking two calendar
              dates a month apart (that is often 31–32 days).
            </span>
          </label>
          {startDate && durationDays > 0 && endDate ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-sm">
              <span className="font-medium">Last day (day {durationDays}):</span>{" "}
              {endDate}
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {durationDays} days from {startDate} through {endDate} inclusive.
              </span>
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={pending || !title.trim() || !startDate || durationDays < 1 || !endDate}
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
            {durationDays} days · {startDate} → {endDate} · Free challenge
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
  setSelectedDays: (next: Set<number>) => void;
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

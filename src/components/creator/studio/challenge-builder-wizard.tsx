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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  const [schedule, setSchedule] = useState(
    template.schedule.map((s) => ({
      dayLabel: s.dayLabel,
      title: s.title,
      body: s.body ?? "",
      isRest: s.isRest,
      weekTheme: s.weekTheme ?? "",
    })),
  );

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
          <div className="grid grid-cols-2 gap-2">
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              type="button"
              fullWidth
              disabled={pending || !title.trim() || !startDate || !endDate}
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
        <Card className="space-y-3">
          <h2 className="font-semibold">Schedule</h2>
          <ul className="space-y-2">
            {schedule.map((item, i) => (
              <li key={i} className="rounded-xl border border-border p-3 text-sm">
                <input
                  className="mb-1 w-full rounded-lg border border-border px-2 py-1"
                  value={item.dayLabel}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[i] = { ...next[i], dayLabel: e.target.value };
                    setSchedule(next);
                  }}
                  placeholder="Day label"
                />
                <input
                  className="mb-1 w-full rounded-lg border border-border px-2 py-1 font-medium"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...schedule];
                    next[i] = { ...next[i], title: e.target.value };
                    setSchedule(next);
                  }}
                  placeholder="Activity title"
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
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() =>
              setSchedule([
                ...schedule,
                {
                  dayLabel: `Day ${schedule.length + 1}`,
                  title: "Activity",
                  body: "",
                  isRest: false,
                  weekTheme: "",
                },
              ])
            }
          >
            + Add day
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={pending} onClick={() => saveDraft(4)}>
              Preview
            </Button>
          </div>
        </Card>
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
            {startDate} → {endDate} · Free challenge
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

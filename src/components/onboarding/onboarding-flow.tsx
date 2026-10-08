"use client";

import { completeOnboarding } from "@/app/(app)/member/actions";
import { TimezoneSelect } from "@/components/timezone/timezone-select";
import {
  AU_STATE_OPTIONS,
  type AuStateOrTerritory,
} from "@/lib/timezone/constants";
import {
  detectBrowserTimezone,
  resolveInitialTimezone,
  timezoneFromAuState,
} from "@/lib/timezone/detect";
import { friendlyTimezoneTitle } from "@/lib/timezone/format";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { APP_NAME } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { HABIT_PRESETS } from "@/lib/habits/presets";
import { ArrowRight, Check, Users } from "lucide-react";
import {
  ACCOUNTABILITY_GROUP_PLURAL,
  ACCOUNTABILITY_GROUP_SINGULAR,
  ACCOUNTABILITY_GROUP_SIZE_LABEL,
} from "@/lib/copy/accountability-groups";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const goalOptions = [
  "Move more consistently",
  "Improve energy & sleep",
  "Build mindful eating habits",
  "Stay accountable with friends",
];

const onboardingHabits = HABIT_PRESETS.map((p) => p.label);

export function OnboardingFlow({
  userId,
  displayName,
  avatarUrl,
}: {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedToGroup = searchParams.get("group") === "1";
  const inviteCode = searchParams.get("code") ?? undefined;
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(goalOptions[0]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    "Walk for 20 minutes",
    "Drink water with each meal",
  ]);
  const [wantsGroup, setWantsGroup] = useState(invitedToGroup);
  const [auState, setAuState] = useState<AuStateOrTerritory | "">("");
  const [timezone, setTimezone] = useState(() => detectBrowserTimezone() ?? "Australia/Melbourne");
  const [timezoneSource, setTimezoneSource] = useState<string>("device");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 5;

  function applyStateFallback(state: AuStateOrTerritory | "") {
    setAuState(state);
    if (state && state !== "outside_australia") {
      const fromState = timezoneFromAuState(state);
      if (fromState) {
        setTimezone(fromState);
        setTimezoneSource("state_fallback");
      }
    } else if (state === "outside_australia") {
      const detected = detectBrowserTimezone();
      if (detected) {
        setTimezone(detected);
        setTimezoneSource("device");
      }
    }
  }

  function finish() {
    startTransition(async () => {
      try {
        const resolved = resolveInitialTimezone({
          detected: timezone,
          auState: auState || null,
          stored: timezone,
        });
        await completeOnboarding({
          focusGoal: selectedGoal,
          habits: selectedHabits.slice(0, 5),
          createGroup: wantsGroup && !inviteCode,
          inviteCode,
          timezone: resolved.timezone,
          auStateOrTerritory: auState || null,
          timezoneSource: timezoneSource || resolved.source,
        });
        router.push("/");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save onboarding.");
      }
    });
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <div className="mb-6 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      {step === 0 ? (
        <div className="animate-fade-up flex flex-1 flex-col">
          <BrandWordmark size="md" className="mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to {APP_NAME}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick one focus — saved to your account.
          </p>
          <ul className="mt-6 space-y-2">
            {goalOptions.map((goal) => (
              <li key={goal}>
                <button
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    selectedGoal === goal
                      ? "border-primary bg-secondary/60 font-medium"
                      : "border-border bg-surface",
                  )}
                >
                  {goal}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="animate-fade-up flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold">Choose a few habits</h1>
          <p className="mt-2 text-muted-foreground">
            Pick 3–5 healthy habits — you can edit these anytime on Progress.
          </p>
          <ul className="mt-6 space-y-2">
            {onboardingHabits.map((habit) => {
              const selected = selectedHabits.includes(habit);
              return (
                <li key={habit}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedHabits((prev) => {
                        if (selected) return prev.filter((h) => h !== habit);
                        if (prev.length >= 5) return prev;
                        return [...prev, habit];
                      })
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      selected
                        ? "border-primary bg-secondary/60 font-medium"
                        : "border-border bg-surface",
                    )}
                  >
                    {habit}
                    {selected ? (
                      <Check className="h-4 w-4 text-primary" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedHabits.length}/5 selected
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-fade-up flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold">Where are you based?</h1>
          <p className="mt-2 text-muted-foreground">
            This helps us show challenge times correctly.
          </p>
          <ul className="mt-4 space-y-2">
            {AU_STATE_OPTIONS.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => applyStateFallback(o.value)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm",
                    auState === o.value
                      ? "border-primary bg-secondary/60 font-medium"
                      : "border-border bg-surface",
                  )}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
          <Card className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">Your timezone</p>
              <p className="text-sm text-muted-foreground">{friendlyTimezoneTitle(timezone)}</p>
              <p className="text-xs text-muted-foreground">{timezone}</p>
            </div>
            <TimezoneSelect
              value={timezone}
              onChange={(v) => {
                setTimezone(v);
                setTimezoneSource("manual");
              }}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll use this for local times and reminders. You can change it anytime in Profile.
            </p>
          </Card>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="animate-fade-up flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold">Add a profile picture</h1>
          <p className="mt-2 text-muted-foreground">
            Optional — friends see this in your private accountability group.
          </p>
          <Card className="mt-6">
            <ProfileAvatarEditor
              userId={userId}
              displayName={displayName}
              avatarUrl={avatarUrl}
            />
          </Card>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            onClick={() => setStep((s) => s + 1)}
          >
            Skip for now
          </Button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="animate-fade-up flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold capitalize">
            {ACCOUNTABILITY_GROUP_PLURAL} (optional)
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join a {ACCOUNTABILITY_GROUP_SINGULAR} or stay solo — both work.
          </p>
          <Card className="mt-6">
            <button
              type="button"
              className="flex w-full items-start gap-3 text-left"
              onClick={() => setWantsGroup(true)}
            >
              <Users className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="font-medium">
                  {invitedToGroup
                    ? `Join my friend’s ${ACCOUNTABILITY_GROUP_SINGULAR}`
                    : `Start a ${ACCOUNTABILITY_GROUP_SINGULAR}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ACCOUNTABILITY_GROUP_SIZE_LABEL.toLowerCase()} · private invite link
                </p>
              </div>
              {wantsGroup ? (
                <Check className="ml-auto h-5 w-5 text-primary" aria-hidden />
              ) : null}
            </button>
          </Card>
          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-border px-4 py-3 text-left text-sm"
            onClick={() => setWantsGroup(false)}
          >
            Continue solo for now
          </button>
        </div>
      ) : null}

      <div className="mt-8 space-y-2 pb-[env(safe-area-inset-bottom)]">
        {step < totalSteps - 1 ? (
          <Button fullWidth onClick={() => setStep((s) => s + 1)}>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button fullWidth disabled={pending} onClick={finish}>
            {pending ? "Saving…" : "Go to my dashboard"}
          </Button>
        )}
        {step > 0 ? (
          <Button variant="ghost" fullWidth onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        {error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

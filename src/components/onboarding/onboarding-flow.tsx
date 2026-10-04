"use client";

import { completeOnboarding } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { ArrowRight, Check, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const goalOptions = [
  "Move more consistently",
  "Improve energy & sleep",
  "Build mindful eating habits",
  "Stay accountable with friends",
];

const habitOptions = [
  "Daily walk",
  "Water goal",
  "Strength or mobility",
  "Evening wind-down",
];

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedToGroup = searchParams.get("group") === "1";
  const inviteCode = searchParams.get("code") ?? undefined;
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(goalOptions[0]);
  const [selectedHabit, setSelectedHabit] = useState(habitOptions[0]);
  const [wantsGroup, setWantsGroup] = useState(invitedToGroup);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;

  function finish() {
    startTransition(async () => {
      try {
        await completeOnboarding({
          focusGoal: selectedGoal,
          habit: selectedHabit,
          createGroup: wantsGroup && !inviteCode,
          inviteCode,
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Streakly
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
          <h1 className="text-2xl font-semibold">One habit to start</h1>
          <p className="mt-2 text-muted-foreground">
            Small steps beat extreme plans.
          </p>
          <ul className="mt-6 space-y-2">
            {habitOptions.map((habit) => (
              <li key={habit}>
                <button
                  type="button"
                  onClick={() => setSelectedHabit(habit)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    selectedHabit === habit
                      ? "border-primary bg-secondary/60 font-medium"
                      : "border-border bg-surface",
                  )}
                >
                  {habit}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-fade-up flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold">Accountability (optional)</h1>
          <p className="mt-2 text-muted-foreground">
            Join a small group or stay solo — both work.
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
                  {invitedToGroup ? "Join my friend’s group" : "Start a group"}
                </p>
                <p className="text-sm text-muted-foreground">
                  4–8 members · invite link for friends
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

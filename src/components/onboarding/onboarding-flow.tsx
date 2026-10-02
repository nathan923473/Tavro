"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { ArrowRight, Check, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const goalOptions = [
  "Move more consistently",
  "Improve energy & sleep",
  "Build mindful eating habits",
  "Stay accountable with friends",
];

const habitOptions = ["Daily walk", "Water goal", "Strength or mobility", "Evening wind-down"];

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const invitedToGroup = searchParams.get("group") === "1";
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(goalOptions[0]);
  const [selectedHabit, setSelectedHabit] = useState(habitOptions[0]);
  const [wantsGroup, setWantsGroup] = useState(invitedToGroup);

  const totalSteps = 3;

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
            Free for everyone at launch. Pick one focus — you can change it anytime.
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
            Small steps beat extreme plans. Skip days without losing your progress
            story.
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
            Join a small group or stay solo — both are fully supported.
          </p>
          <Card className="mt-6">
            <button
              type="button"
              className={cn(
                "flex w-full items-start gap-3 text-left",
                wantsGroup && "opacity-100",
              )}
              onClick={() => setWantsGroup(true)}
            >
              <Users className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="font-medium">
                  {invitedToGroup ? "Join my friend’s group" : "Find or create a group"}
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
          <Link href="/" className="block">
            <Button fullWidth>Go to my dashboard</Button>
          </Link>
        )}
        {step > 0 ? (
          <Button variant="ghost" fullWidth onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
      </div>
    </div>
  );
}

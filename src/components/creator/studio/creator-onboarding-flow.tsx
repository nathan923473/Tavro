"use client";

import { completeCreatorOnboardingAction } from "@/app/(app)/studio/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CreatorOnboardingFlow({
  communitySlug,
  skipped,
}: {
  communitySlug: string | null;
  skipped: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(skipped ? 3 : 0);
  const [pending, startTransition] = useTransition();

  if (step === 0) {
    return (
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Welcome to Creator Studio</h2>
        <p className="text-sm text-muted-foreground">
          Run free fitness challenges, build your community, and keep your audience engaged.
        </p>
        <Button type="button" fullWidth onClick={() => setStep(1)}>
          Get started
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground"
          onClick={() =>
            startTransition(async () => {
              await completeCreatorOnboardingAction();
              router.push("/studio");
            })
          }
        >
          Skip for now
        </button>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <Card className="space-y-4">
        <h2 className="font-semibold">Step 1 — Your creator page</h2>
        <p className="text-sm text-muted-foreground">
          Add your brand name, photo, banner, bio, and links so followers trust you on Instagram.
        </p>
        <Link
          href={communitySlug ? "/studio/community" : "/studio/community/setup"}
          className="flex min-h-11 items-center justify-center rounded-xl border border-border text-sm font-semibold"
        >
          Edit creator page
        </Link>
        <Button type="button" fullWidth onClick={() => setStep(2)}>
          Continue
        </Button>
      </Card>
    );
  }

  if (step === 2) {
    return (
      <Card className="space-y-4">
        <h2 className="font-semibold">Step 2 — Create your first challenge</h2>
        <p className="text-sm text-muted-foreground">
          Launch a free challenge your audience can join in one tap from your link.
        </p>
        <div className="grid gap-2">
          <Link
            href="/studio/challenges/templates"
            className="flex min-h-10 items-center justify-center rounded-xl bg-muted text-sm font-medium"
          >
            Choose a template
          </Link>
          <Link
            href="/studio/challenges/new?template=scratch"
            className="flex min-h-10 items-center justify-center rounded-xl bg-muted text-sm font-medium"
          >
            Start from scratch
          </Link>
        </div>
        <Button type="button" variant="outline" fullWidth onClick={() => setStep(3)}>
          I already published a challenge
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Step 3 — Share your link</h2>
      <p className="text-sm text-muted-foreground">
        After you publish, copy your challenge URL to your Instagram bio, Story, or send it to
        your community.
      </p>
      <Link href="/studio/challenges" className="block text-center text-sm font-semibold text-primary">
        Open my challenges →
      </Link>
      <Button
        type="button"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await completeCreatorOnboardingAction();
            router.push("/studio");
          })
        }
      >
        Done — go to Studio
      </Button>
    </Card>
  );
}

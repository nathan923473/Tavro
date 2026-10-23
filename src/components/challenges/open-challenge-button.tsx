"use client";

import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

/** Reliable navigation to the participant hub (works better than Link in some PWA taps). */
export function OpenChallengeButton({
  challengeId,
  className,
  children,
}: {
  challengeId: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={cn(
        "focus-ring flex min-h-10 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/15 transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60",
        className,
      )}
      onClick={() =>
        startTransition(() => {
          router.push(`/challenges/${challengeId}`);
        })
      }
    >
      {pending ? "Opening…" : children}
    </button>
  );
}

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
        "flex min-h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60",
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

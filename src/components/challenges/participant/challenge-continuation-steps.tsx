"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";

export function ChallengeContinuationSteps({
  hasGroup,
}: {
  hasGroup: boolean;
}) {
  return (
    <Card className="space-y-3 border-[#3156E8]/25 bg-[#3156E8]/5">
      <div>
        <h2 className="text-base font-semibold text-[#1B2440]">What&apos;s next?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional steps — pick what helps you keep the momentum you built.
        </p>
      </div>
      <ul className="space-y-2">
        <li>
          <Link
            href="/progress#habits-manage-heading"
            className="flex min-h-11 flex-col justify-center rounded-xl border border-border bg-surface px-3 py-2 text-left hover:border-primary/40"
          >
            <span className="text-sm font-semibold text-[#1B2440]">Continue your habits</span>
            <span className="text-xs text-muted-foreground">
              Keep the routines you started during the challenge.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/groups"
            className="flex min-h-11 flex-col justify-center rounded-xl border border-border bg-surface px-3 py-2 text-left hover:border-primary/40"
          >
            <span className="text-sm font-semibold text-[#1B2440]">Stay accountable</span>
            <span className="text-xs text-muted-foreground">
              {hasGroup
                ? "Check in with your existing group."
                : "Join or create a small group for support."}
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/challenges"
            className="flex min-h-11 flex-col justify-center rounded-xl border border-border bg-surface px-3 py-2 text-left hover:border-primary/40"
          >
            <span className="text-sm font-semibold text-[#1B2440]">Join another challenge</span>
            <span className="text-xs text-muted-foreground">
              Explore another free creator challenge when you&apos;re ready.
            </span>
          </Link>
        </li>
      </ul>
    </Card>
  );
}

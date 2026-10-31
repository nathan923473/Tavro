"use client";

import { userFacingErrorMessage } from "@/lib/errors/user-message";

import { updateMemberGoalPreferencesAction } from "@/app/(app)/member/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GROWTH_FRICTION_OPTIONS,
  WORK_TOWARDS_OPTIONS,
  type GrowthFriction,
  type WorkTowards,
} from "@/lib/member/preferences";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MemberGoalPreferencesCard({
  workTowards,
  growthFriction,
}: {
  workTowards: WorkTowards | null;
  growthFriction: GrowthFriction | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [work, setWork] = useState<WorkTowards>(
    workTowards ?? "healthier_habits",
  );
  const [friction, setFriction] = useState<GrowthFriction | "">(
    growthFriction ?? "",
  );
  const [status, setStatus] = useState<string | null>(null);

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold">Your goals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Helps Tavro highlight habits, challenges and groups that fit you. No weight or medical
          info required.
        </p>
      </div>
      <label className="block text-sm">
        <span className="font-medium">What would you like to work towards?</span>
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={work}
          disabled={pending}
          onChange={(e) => setWork(e.target.value as WorkTowards)}
        >
          {WORK_TOWARDS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">What feels hardest? (optional)</span>
        <select
          className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={friction}
          disabled={pending}
          onChange={(e) => setFriction(e.target.value as GrowthFriction | "")}
        >
          <option value="">Prefer not to say</option>
          {GROWTH_FRICTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="button"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await updateMemberGoalPreferencesAction({
                workTowards: work,
                growthFriction: friction || null,
              });
              setStatus("Saved.");
              router.refresh();
            } catch (e) {
              setStatus(userFacingErrorMessage(e, "Could not save."));
            }
          })
        }
      >
        Save preferences
      </Button>
      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
}

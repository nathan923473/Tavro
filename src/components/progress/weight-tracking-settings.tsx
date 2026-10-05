"use client";

import {
  deleteWeighInAction,
  setWeightTrackingEnabledAction,
} from "@/app/(app)/progress/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WeeklyWeighIn } from "@/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function WeightTrackingSettings({
  enabled,
  weighIns,
}: {
  enabled: boolean;
  weighIns: WeeklyWeighIn[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <h3 className="font-semibold">Weight tracking</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional and private — never shared with groups or creators by default.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setWeightTrackingEnabledAction(!enabled);
            router.refresh();
          })
        }
      >
        {enabled ? "Turn off weight tracking" : "Turn on weight tracking"}
      </Button>
      {enabled && weighIns.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {weighIns.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2">
              <span>
                {w.date}: {w.weight} lb
              </span>
              <button
                type="button"
                className="text-xs text-red-600"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteWeighInAction(w.id);
                    router.refresh();
                  })
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

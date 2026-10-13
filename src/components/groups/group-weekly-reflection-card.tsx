"use client";

import { saveGroupWeeklyReflectionAction } from "@/app/(app)/groups/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AccountabilityGroup } from "@/types";
import { useState } from "react";

export function GroupWeeklyReflectionCard({
  group,
  pending,
  run,
}: {
  group: AccountabilityGroup;
  pending: boolean;
  run: (action: () => Promise<unknown>) => void;
}) {
  const own = group.weeklyReflections.find((r) => r.isOwn);
  const [wentWell, setWentWell] = useState(own?.wentWell ?? "");
  const [struggled, setStruggled] = useState(own?.struggledWith ?? "");
  const [focusNext, setFocusNext] = useState(own?.focusNext ?? "");

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-semibold">Weekly check-in</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional — share what went well and what you want to improve. No rankings or public
          shaming.
        </p>
      </div>

      {group.weeklyReflections.filter((r) => !r.isOwn).length > 0 ? (
        <ul className="space-y-2 border-b border-border pb-3 text-sm">
          {group.weeklyReflections
            .filter((r) => !r.isOwn)
            .map((r) => (
              <li key={r.id} className="rounded-xl bg-muted/30 px-3 py-2">
                <p className="font-medium">{r.displayName}</p>
                {r.wentWell ? (
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-medium text-foreground">Went well:</span> {r.wentWell}
                  </p>
                ) : null}
                {r.struggledWith ? (
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-medium text-foreground">Hard part:</span>{" "}
                    {r.struggledWith}
                  </p>
                ) : null}
                {r.focusNext ? (
                  <p className="mt-1 text-muted-foreground">
                    <span className="font-medium text-foreground">Next week:</span> {r.focusNext}
                  </p>
                ) : null}
              </li>
            ))}
        </ul>
      ) : null}

      <label className="block text-sm">
        What went well this week?
        <textarea
          className="mt-1 min-h-[64px] w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <label className="block text-sm">
        What was hard?
        <textarea
          className="mt-1 min-h-[64px] w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={struggled}
          onChange={(e) => setStruggled(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <label className="block text-sm">
        What do you want to focus on next week?
        <textarea
          className="mt-1 min-h-[64px] w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={focusNext}
          onChange={(e) => setFocusNext(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <Button
        type="button"
        fullWidth
        disabled={pending}
        onClick={() =>
          run(() =>
            saveGroupWeeklyReflectionAction({
              groupId: group.id,
              wentWell,
              struggledWith: struggled,
              focusNext,
            }),
          )
        }
      >
        {own ? "Update weekly check-in" : "Share weekly check-in"}
      </Button>
    </Card>
  );
}

"use client";

import { saveParticipantTimezoneAction } from "@/app/(app)/member/actions";
import { TimezoneSelect } from "@/components/timezone/timezone-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AU_STATE_OPTIONS, type AuStateOrTerritory } from "@/lib/timezone/constants";
import { friendlyTimezoneTitle } from "@/lib/timezone/format";
import { detectBrowserTimezone } from "@/lib/timezone/detect";
import { useState, useTransition } from "react";

export function TimezoneSettingsCard({
  timezone,
  auState,
}: {
  timezone: string | null;
  auState: AuStateOrTerritory | null;
}) {
  const detected = detectBrowserTimezone();
  const [tz, setTz] = useState(timezone ?? detected ?? "Australia/Melbourne");
  const [state, setState] = useState<AuStateOrTerritory | "">(auState ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-semibold">Timezone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We use this to show challenge times and personal reminders in your local time.
        </p>
      </div>
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="font-medium">{friendlyTimezoneTitle(tz)}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{tz}</span>
      </p>
      <label className="block text-sm">
        <span className="text-xs font-medium text-muted-foreground">Where are you based?</span>
        <select
          className="mt-0.5 w-full rounded-lg border border-border px-3 py-2 text-sm"
          value={state}
          onChange={(e) => setState(e.target.value as AuStateOrTerritory | "")}
        >
          <option value="">Prefer not to say</option>
          {AU_STATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <TimezoneSelect value={tz} onChange={setTz} label="Your timezone" />
      {detected && detected !== tz ? (
        <Button
          type="button"
          variant="outline"
          fullWidth
          disabled={pending}
          onClick={() => setTz(detected)}
        >
          Use detected timezone ({detected})
        </Button>
      ) : null}
      <Button
        type="button"
        fullWidth
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await saveParticipantTimezoneAction({
                timezone: tz,
                auStateOrTerritory: state || null,
                timezoneSource: "manual",
                confirmed: true,
              });
              setMessage("Timezone saved.");
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Could not save.");
            }
          })
        }
      >
        {pending ? "Saving…" : "Save timezone"}
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </Card>
  );
}

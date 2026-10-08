"use client";

import type { FounderEventHealth } from "@/types/founder-analytics";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function AdminDiagnosticsPanel({
  health,
  trackingStartedAt,
  schemaReady,
}: {
  health: FounderEventHealth | null;
  trackingStartedAt: string | null;
  schemaReady: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trackingWeak =
    !schemaReady || !health || health.totalEvents === 0 || health.eventsInRange === 0;

  return (
    <div className="rounded-lg border border-border bg-muted/20">
      {trackingWeak ? (
        <p className="px-3 py-2 text-xs text-amber-900">
          Analytics event tracking is incomplete for this period — some metrics use database
          records (profiles, joins) instead of events.
        </p>
      ) : null}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>Admin diagnostics (event pipeline)</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {!health ? (
            <p>Cannot read events — check service role and migration 023.</p>
          ) : (
            <>
              <p>
                <span className="font-medium text-foreground">In range:</span>{" "}
                {health.eventsInRange.toLocaleString()} events
              </p>
              <p>
                <span className="font-medium text-foreground">All time:</span>{" "}
                {health.totalEvents.toLocaleString()} events
              </p>
              <p>
                <span className="font-medium text-foreground">Last event:</span>{" "}
                {health.lastEventAt
                  ? new Date(health.lastEventAt).toLocaleString()
                  : "None recorded"}
              </p>
              {trackingStartedAt ? (
                <p>
                  <span className="font-medium text-foreground">First stored event:</span>{" "}
                  {new Date(trackingStartedAt).toLocaleString()}
                </p>
              ) : null}
              {health.topTypes.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-0.5">
                  {health.topTypes.map((t) => (
                    <li key={t.eventType}>
                      {t.eventType}: {t.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No event types in this date range yet.</p>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

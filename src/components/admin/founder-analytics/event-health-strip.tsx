import type { FounderEventHealth } from "@/types/founder-analytics";

export function EventHealthStrip({
  health,
  trackingStartedAt,
}: {
  health: FounderEventHealth | null;
  trackingStartedAt: string | null;
}) {
  if (!health) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        Event ingestion not verified — service role or migration 023 may be missing.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Event pipeline</p>
      <p className="mt-0.5">
        {health.eventsInRange.toLocaleString()} events in range ·{" "}
        {health.totalEvents.toLocaleString()} all-time
        {health.lastEventAt
          ? ` · last ${new Date(health.lastEventAt).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}`
          : ""}
      </p>
      {trackingStartedAt ? (
        <p className="mt-0.5">Tracking since {new Date(trackingStartedAt).toLocaleDateString()}</p>
      ) : (
        <p className="mt-0.5 text-amber-800">No events stored yet — visit a challenge landing while logged out.</p>
      )}
      {health.topTypes.length > 0 ? (
        <p className="mt-1 truncate">
          Top: {health.topTypes.map((t) => `${t.eventType} (${t.count})`).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

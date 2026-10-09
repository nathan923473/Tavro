import { Card } from "@/components/ui/card";

export function StudioPerformanceSummary({
  followers,
  registrations,
  activeParticipants,
  linkClicks,
}: {
  followers: number;
  registrations: number;
  activeParticipants: number;
  linkClicks: number | null;
}) {
  const items = [
    { label: "Followers", value: followers },
    { label: "Challenge registrations", value: registrations },
    { label: "Active participants", value: activeParticipants },
    {
      label: "Link clicks",
      value: linkClicks,
      emptyHint: "Add shop links to track clicks",
    },
  ] as const;

  return (
    <section aria-labelledby="performance-summary-heading">
      <h2 id="performance-summary-heading" className="mb-2 text-base font-semibold">
        Performance summary
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Card key={item.label} padding="sm" className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            {"emptyHint" in item && item.value === null ? (
              <p className="text-sm font-medium leading-snug">{item.emptyHint}</p>
            ) : (
              <p className="text-xl font-semibold tabular-nums">
                {(item.value ?? 0).toLocaleString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

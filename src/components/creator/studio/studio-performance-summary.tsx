import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

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
    <section aria-labelledby="performance-summary-heading" className="section-stack">
      <SectionHeader
        titleId="performance-summary-heading"
        title="Performance summary"
        description="Last 30 days across your community"
      />
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Card key={item.label} padding="sm" variant="muted" className="space-y-0.5">
            <p className="text-caption">{item.label}</p>
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

import { Card } from "@/components/ui/card";

export function ReportMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card padding="sm" className="space-y-0.5">
      <p className="text-xs text-muted-foreground" title={hint}>
        {label}
        {hint ? <span className="sr-only"> — {hint}</span> : null}
      </p>
      <p className="text-xl font-semibold tabular-nums text-[#1B2440]">{value}</p>
      {hint ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}

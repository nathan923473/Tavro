import { Card } from "@/components/ui/card";
import type { ConsistencySnapshot } from "@/types";

type ConsistencyCardProps = {
  metrics: ConsistencySnapshot[];
};

export function ConsistencyCard({ metrics }: ConsistencyCardProps) {
  return (
    <section className="space-y-3" aria-labelledby="consistency-heading">
      <h2 id="consistency-heading" className="px-1 text-base font-semibold">
        Consistency
      </h2>
      <div className="grid gap-2">
        {metrics.map((metric) => {
          const pct = Math.min(
            100,
            Math.round((metric.value / metric.target) * 100),
          );
          return (
            <Card key={metric.label} padding="sm">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-semibold tabular-nums">
                  {metric.value}/{metric.target}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

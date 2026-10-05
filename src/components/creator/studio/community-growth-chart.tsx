"use client";

import { Card } from "@/components/ui/card";

export function CommunityGrowthChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card>
      <div className="flex h-36 items-end justify-between gap-1">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className="w-full max-w-[2rem] rounded-t-md bg-primary/80"
                style={{ height: `${Math.max(8, (d.count / max) * 100)}%` }}
                title={`${d.count} new followers`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

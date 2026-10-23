"use client";

import { Card } from "@/components/ui/card";

export function DailyEngagementChart({
  data,
  ariaLabel,
}: {
  data: { label: string; activeParticipants: number }[];
  ariaLabel: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.activeParticipants));
  const width = Math.max(280, data.length * 28);
  const height = 120;
  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padding + innerH - (d.activeParticipants / max) * innerH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Card className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + 28}`}
        className="min-w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill="var(--primary)" />
        ))}
        {points.map((p, i) =>
          i % Math.ceil(data.length / 8) === 0 || i === data.length - 1 ? (
            <text
              key={`${p.label}-t`}
              x={p.x}
              y={height + 18}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WeightProgressSummary, WeeklyWeighIn } from "@/types";
import { Lock, Scale } from "lucide-react";

type WeightProgressChartProps = {
  weighIns: WeeklyWeighIn[];
  summary: WeightProgressSummary;
};

const CHART = {
  width: 320,
  height: 160,
  padX: 8,
  padY: 12,
};

export function WeightProgressChart({
  weighIns,
  summary,
}: WeightProgressChartProps) {
  const weights = weighIns.map((w) => w.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;

  const plotW = CHART.width - CHART.padX * 2;
  const plotH = CHART.height - CHART.padY * 2;

  const points = weighIns.map((entry, i) => {
    const x =
      CHART.padX +
      (weighIns.length <= 1 ? plotW / 2 : (i / (weighIns.length - 1)) * plotW);
    const y =
      CHART.padY + ((maxW - entry.weight) / range) * plotH;
    return { x, y, entry };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(1) ?? 0} ${CHART.height - CHART.padY} L ${points[0]?.x.toFixed(1) ?? 0} ${CHART.height - CHART.padY} Z`;

  const totalChange = summary.currentWeight - summary.startWeight;
  const unit = summary.unit;

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-secondary p-2 text-secondary-foreground">
            <Scale className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold">Weight trend</h3>
            <p className="text-xs text-muted-foreground">Weekly weigh-ins · private</p>
          </div>
        </div>
        <Badge tone="muted" className="gap-1">
          <Lock className="h-3 w-3" aria-hidden />
          Only you
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Start
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {summary.startWeight} {unit}
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Current
          </p>
          <p className="text-sm font-semibold tabular-nums text-primary">
            {summary.currentWeight} {unit}
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Change
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {totalChange <= 0 ? "" : "+"}
            {totalChange.toFixed(1)} {unit}
          </p>
        </div>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="mx-auto h-40 w-full max-w-md"
          role="img"
          aria-label={`Weight trend from ${summary.startWeight} to ${summary.currentWeight} ${unit} over ${weighIns.length} weekly weigh-ins`}
        >
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = CHART.padY + t * plotH;
            return (
              <line
                key={t}
                x1={CHART.padX}
                x2={CHART.width - CHART.padX}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}
          <path d={areaPath} fill="url(#weightFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map(({ x, y, entry }) => (
            <g key={entry.id}>
              <circle cx={x} cy={y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
              <title>
                {entry.label}: {entry.weight} {unit}
              </title>
            </g>
          ))}
        </svg>
      </div>

      <ul className="mt-2 flex justify-between gap-1 px-1 text-[10px] text-muted-foreground">
        {weighIns.map((entry, i) =>
          i === 0 || i === weighIns.length - 1 || i === Math.floor(weighIns.length / 2) ? (
            <li key={entry.id}>{entry.label}</li>
          ) : (
            <li key={entry.id} className="sr-only">
              {entry.label}
            </li>
          ),
        )}
      </ul>

      {summary.goalWeight != null ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Personal goal: {summary.goalWeight} {unit} — steady progress beats quick drops.
        </p>
      ) : null}

      <Button className="mt-4" variant="secondary" fullWidth aria-disabled>
        Log weekly weigh-in
      </Button>
    </Card>
  );
}

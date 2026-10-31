"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WeightUnitToggle } from "@/components/progress/weight-unit-toggle";
import {
  convertWeight,
  readStoredWeightUnit,
  storeWeightUnit,
  subscribeWeightUnit,
} from "@/lib/weight-units";
import { WeighInForm } from "@/components/progress/weigh-in-form";
import type { WeightProgressSummary, WeightUnit, WeeklyWeighIn } from "@/types";
import { Lock, Scale } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

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

/** Weigh-ins in mock/API data are stored in `summary.unit` (lb for demo). */
function toDisplayWeight(
  value: number,
  storageUnit: WeightUnit,
  displayUnit: WeightUnit,
): number {
  return convertWeight(value, storageUnit, displayUnit);
}

export function WeightProgressChart({
  weighIns,
  summary,
}: WeightProgressChartProps) {
  const [logging, setLogging] = useState(false);
  const storageUnit = summary.unit;

  const displayUnit = useSyncExternalStore(
    subscribeWeightUnit,
    readStoredWeightUnit,
    (): WeightUnit => "kg",
  );

  function handleUnitChange(unit: WeightUnit) {
    storeWeightUnit(unit);
  }

  const displayWeighIns = useMemo(
    () =>
      weighIns.map((entry) => ({
        ...entry,
        weight: toDisplayWeight(entry.weight, storageUnit, displayUnit),
      })),
    [weighIns, storageUnit, displayUnit],
  );

  const displaySummary = useMemo(
    () => ({
      startWeight: toDisplayWeight(
        summary.startWeight,
        storageUnit,
        displayUnit,
      ),
      currentWeight: toDisplayWeight(
        summary.currentWeight,
        storageUnit,
        displayUnit,
      ),
      goalWeight:
        summary.goalWeight != null
          ? toDisplayWeight(summary.goalWeight, storageUnit, displayUnit)
          : undefined,
    }),
    [summary, storageUnit, displayUnit],
  );

  const weights = displayWeighIns.map((w) => w.weight);
  const pad = displayUnit === "kg" ? 0.8 : 2;
  const minW = Math.min(...weights) - pad;
  const maxW = Math.max(...weights) + pad;
  const range = maxW - minW || 1;

  const plotW = CHART.width - CHART.padX * 2;
  const plotH = CHART.height - CHART.padY * 2;

  const points = displayWeighIns.map((entry, i) => {
    const x =
      CHART.padX +
      (displayWeighIns.length <= 1
        ? plotW / 2
        : (i / (displayWeighIns.length - 1)) * plotW);
    const y = CHART.padY + ((maxW - entry.weight) / range) * plotH;
    return { x, y, entry };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(1) ?? 0} ${CHART.height - CHART.padY} L ${points[0]?.x.toFixed(1) ?? 0} ${CHART.height - CHART.padY} Z`;

  const totalChange =
    displaySummary.currentWeight - displaySummary.startWeight;

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
        <div className="flex flex-col items-end gap-2">
          <WeightUnitToggle value={displayUnit} onChange={handleUnitChange} />
          <Badge tone="muted" className="gap-1">
            <Lock className="h-3 w-3" aria-hidden />
            Only you
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Start
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {displaySummary.startWeight.toFixed(1)} {displayUnit}
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Current
          </p>
          <p className="text-sm font-semibold tabular-nums text-primary">
            {displaySummary.currentWeight.toFixed(1)} {displayUnit}
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Change
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {totalChange <= 0 ? "" : "+"}
            {totalChange.toFixed(1)} {displayUnit}
          </p>
        </div>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="mx-auto h-40 w-full max-w-md"
          role="img"
          aria-label={`Weight trend from ${displaySummary.startWeight.toFixed(1)} to ${displaySummary.currentWeight.toFixed(1)} ${displayUnit} over ${displayWeighIns.length} weekly weigh-ins`}
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
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="var(--surface)"
                stroke="var(--primary)"
                strokeWidth="2"
              />
              <title>
                {entry.label}: {entry.weight.toFixed(1)} {displayUnit}
              </title>
            </g>
          ))}
        </svg>
      </div>

      <ul className="mt-2 flex justify-between gap-1 px-1 text-[10px] text-muted-foreground">
        {displayWeighIns.map((entry, i) =>
          i === 0 ||
          i === displayWeighIns.length - 1 ||
          i === Math.floor(displayWeighIns.length / 2) ? (
            <li key={entry.id}>{entry.label}</li>
          ) : (
            <li key={entry.id} className="sr-only">
              {entry.label}
            </li>
          ),
        )}
      </ul>

      {displaySummary.goalWeight != null ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Personal goal: {displaySummary.goalWeight.toFixed(1)} {displayUnit} —
          steady progress beats quick drops.
        </p>
      ) : null}

      {logging ? (
        <WeighInForm
          defaultValue={Number(displaySummary.currentWeight.toFixed(1))}
          submitLabel="Save weigh-in"
          onDone={() => setLogging(false)}
        />
      ) : (
        <Button
          className="mt-4"
          variant="primary"
          fullWidth
          onClick={() => setLogging(true)}
        >
          Log weekly weigh-in ({displayUnit})
        </Button>
      )}
    </Card>
  );
}

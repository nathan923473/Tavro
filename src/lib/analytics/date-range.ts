export type FounderDatePreset = "7d" | "30d" | "90d" | "12m" | "custom";

export type FounderDateRange = {
  preset: FounderDatePreset;
  start: Date;
  end: Date;
  /** Same-length period immediately before `start`. */
  previousStart: Date;
  previousEnd: Date;
  label: string;
};

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

export function parseFounderDateRange(input: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): FounderDateRange {
  const now = new Date();
  const end = endOfUtcDay(now);
  let preset = (input.preset ?? "30d") as FounderDatePreset;
  let start: Date;

  if (preset === "custom" && input.from && input.to) {
    const from = new Date(`${input.from}T00:00:00.000Z`);
    const to = new Date(`${input.to}T23:59:59.999Z`);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to) {
      start = from;
      return buildRange("custom", start, to, `${input.from} – ${input.to}`);
    }
    preset = "30d";
  }

  const endDay = startOfUtcDay(end);
  if (preset === "7d") {
    start = new Date(endDay);
    start.setUTCDate(start.getUTCDate() - 6);
    return buildRange("7d", start, end, "Last 7 days");
  }
  if (preset === "90d") {
    start = new Date(endDay);
    start.setUTCDate(start.getUTCDate() - 89);
    return buildRange("90d", start, end, "Last 90 days");
  }
  if (preset === "12m") {
    start = new Date(endDay);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    start.setUTCDate(start.getUTCDate() + 1);
    return buildRange("12m", start, end, "Last 12 months");
  }

  start = new Date(endDay);
  start.setUTCDate(start.getUTCDate() - 29);
  return buildRange("30d", start, end, "Last 30 days");
}

function buildRange(
  preset: FounderDatePreset,
  start: Date,
  end: Date,
  label: string,
): FounderDateRange {
  const spanMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - spanMs);
  return {
    preset,
    start,
    end,
    previousStart,
    previousEnd,
    label,
  };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}

export function safeRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

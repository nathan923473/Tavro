import { cn } from "@/lib/cn";

type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackClassName?: string;
  /** When true, ring uses light strokes for dark backgrounds */
  onDark?: boolean;
  label?: string;
};

export function ProgressRing({
  value,
  size = 88,
  stroke = 7,
  className,
  trackClassName,
  onDark = false,
  label,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={cn(
            onDark ? "stroke-white/25" : "stroke-muted",
            trackClassName,
          )}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500 ease-out",
            onDark ? "stroke-accent" : "stroke-primary",
          )}
          style={{ stroke: onDark ? undefined : "var(--primary)" }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center tabular-nums",
          onDark ? "text-primary-foreground" : "text-foreground",
        )}
      >
        <span className="text-xl font-bold leading-none">{clamped}</span>
        <span className={cn("text-[10px] font-medium", onDark ? "text-white/80" : "text-muted-foreground")}>
          %
        </span>
      </span>
    </div>
  );
}

import { formatChallengeDateRange } from "@/lib/timezone/format";

type ChallengeDateRangeProps = {
  startDate: string;
  endDate: string;
  challengeTimezone?: string | null;
  className?: string;
};

/** User-facing challenge schedule dates (not ISO keys). */
export function ChallengeDateRange({
  startDate,
  endDate,
  challengeTimezone,
  className,
}: ChallengeDateRangeProps) {
  return (
    <span className={className}>
      {formatChallengeDateRange(startDate, endDate, challengeTimezone)}
    </span>
  );
}

import { todayDateKey } from "@/lib/dates";

/** UTC midnight on the challenge start date (matches app date keys). */
export function challengeStartTimestampMs(startDateKey: string): number {
  return Date.parse(`${startDateKey}T00:00:00.000Z`);
}

export function isChallengeUpcoming(startDateKey: string, todayKey = todayDateKey()): boolean {
  return startDateKey > todayKey;
}

export function msUntilChallengeStart(startDateKey: string, nowMs = Date.now()): number {
  if (!isChallengeUpcoming(startDateKey)) return 0;
  return Math.max(0, challengeStartTimestampMs(startDateKey) - nowMs);
}

export function formatChallengeCountdown(ms: number): string {
  if (ms <= 0) return "Starting now";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  return `${minutes}m ${pad(seconds)}s`;
}

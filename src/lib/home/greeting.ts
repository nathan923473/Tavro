import { TZDate } from "@date-fns/tz";
import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";
import { normalizeTimezone } from "@/lib/timezone/validate";
import { greetingForHour } from "@/lib/home/primary-action";

export function greetingForTimezone(timezone: string | null | undefined, now = new Date()): string {
  const tz = normalizeTimezone(timezone ?? DEFAULT_FALLBACK_TIMEZONE);
  const local = new TZDate(now.getTime(), tz);
  return greetingForHour(local.getHours());
}

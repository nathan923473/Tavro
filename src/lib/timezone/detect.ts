import {
  DEFAULT_FALLBACK_TIMEZONE,
  STATE_TO_IANA,
  type AuStateOrTerritory,
} from "@/lib/timezone/constants";
import { isValidIanaTimezone, normalizeTimezone } from "@/lib/timezone/validate";

export function detectBrowserTimezone(): string | null {
  if (typeof Intl === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidIanaTimezone(tz) ? tz : null;
  } catch {
    return null;
  }
}

export function timezoneFromAuState(state: AuStateOrTerritory | null | undefined): string | null {
  if (!state || state === "outside_australia") return null;
  return STATE_TO_IANA[state];
}

export function resolveInitialTimezone(input: {
  detected?: string | null;
  auState?: AuStateOrTerritory | null;
  stored?: string | null;
}): { timezone: string; source: "device" | "state_fallback" | "stored" | "default" } {
  if (isValidIanaTimezone(input.stored)) {
    return { timezone: input.stored, source: "stored" };
  }
  if (isValidIanaTimezone(input.detected)) {
    return { timezone: input.detected, source: "device" };
  }
  const fromState = timezoneFromAuState(input.auState ?? null);
  if (fromState) {
    return { timezone: fromState, source: "state_fallback" };
  }
  return { timezone: DEFAULT_FALLBACK_TIMEZONE, source: "default" };
}

export function normalizeParticipantTimezone(iana: string | null | undefined): string {
  return normalizeTimezone(iana, DEFAULT_FALLBACK_TIMEZONE);
}

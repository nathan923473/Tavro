import { DEFAULT_FALLBACK_TIMEZONE } from "@/lib/timezone/constants";

const supportedCache = new Set<string>();

function loadSupported(): Set<string> {
  if (supportedCache.size > 0) return supportedCache;
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      for (const z of Intl.supportedValuesOf("timeZone")) {
        supportedCache.add(z);
      }
    }
  } catch {
    /* older runtimes */
  }
  return supportedCache;
}

/** True if `iana` is a known IANA timezone identifier on this runtime. */
export function isValidIanaTimezone(iana: string | null | undefined): iana is string {
  if (!iana || typeof iana !== "string" || !iana.includes("/")) return false;
  const supported = loadSupported();
  if (supported.size > 0) return supported.has(iana);
  try {
    Intl.DateTimeFormat(undefined, { timeZone: iana });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimezone(
  iana: string | null | undefined,
  fallback = DEFAULT_FALLBACK_TIMEZONE,
): string {
  if (isValidIanaTimezone(iana)) return iana;
  return fallback;
}

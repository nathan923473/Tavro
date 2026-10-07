/** Australian state/territory codes stored on profiles (UX + fallback only). */
export type AuStateOrTerritory =
  | "vic"
  | "nsw"
  | "qld"
  | "sa"
  | "wa"
  | "tas"
  | "act"
  | "nt"
  | "outside_australia";

export const AU_STATE_OPTIONS: { value: AuStateOrTerritory; label: string }[] = [
  { value: "vic", label: "Victoria" },
  { value: "nsw", label: "New South Wales" },
  { value: "qld", label: "Queensland" },
  { value: "sa", label: "South Australia" },
  { value: "wa", label: "Western Australia" },
  { value: "tas", label: "Tasmania" },
  { value: "act", label: "Australian Capital Territory" },
  { value: "nt", label: "Northern Territory" },
  { value: "outside_australia", label: "Outside Australia" },
];

/** Sensible default IANA zone when detection fails (AU onboarding). */
export const STATE_TO_IANA: Record<Exclude<AuStateOrTerritory, "outside_australia">, string> = {
  vic: "Australia/Melbourne",
  nsw: "Australia/Sydney",
  qld: "Australia/Brisbane",
  sa: "Australia/Adelaide",
  wa: "Australia/Perth",
  tas: "Australia/Hobart",
  act: "Australia/Sydney",
  nt: "Australia/Darwin",
};

export const DEFAULT_FALLBACK_TIMEZONE = "Australia/Melbourne";

/** Australia-first picker entries; full list extended via search. */
export const AU_TIMEZONE_PICKER: { iana: string; label: string; region: string }[] = [
  { iana: "Australia/Melbourne", label: "Melbourne", region: "Victoria" },
  { iana: "Australia/Sydney", label: "Sydney", region: "New South Wales & ACT" },
  { iana: "Australia/Brisbane", label: "Brisbane", region: "Queensland" },
  { iana: "Australia/Adelaide", label: "Adelaide", region: "South Australia" },
  { iana: "Australia/Perth", label: "Perth", region: "Western Australia" },
  { iana: "Australia/Hobart", label: "Hobart", region: "Tasmania" },
  { iana: "Australia/Darwin", label: "Darwin", region: "Northern Territory" },
  { iana: "Australia/Lord_Howe", label: "Lord Howe Island", region: "NSW" },
  { iana: "Australia/Eucla", label: "Eucla", region: "WA" },
  { iana: "Pacific/Auckland", label: "Auckland", region: "New Zealand" },
];

export const COMMON_GLOBAL_TIMEZONES: { iana: string; label: string }[] = [
  { iana: "Pacific/Auckland", label: "Auckland" },
  { iana: "Europe/London", label: "London" },
  { iana: "Europe/Paris", label: "Paris" },
  { iana: "America/New_York", label: "New York" },
  { iana: "America/Chicago", label: "Chicago" },
  { iana: "America/Denver", label: "Denver" },
  { iana: "America/Los_Angeles", label: "Los Angeles" },
  { iana: "America/Toronto", label: "Toronto" },
  { iana: "Asia/Singapore", label: "Singapore" },
  { iana: "Asia/Tokyo", label: "Tokyo" },
];

/** Monday = 0 … Sunday = 6 (matches UI row order). */
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const ALL_DAYS_MASK = 127;

export function dayIndexFromDateKey(dateKey: string): number {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  const js = d.getUTCDay();
  return js === 0 ? 6 : js - 1;
}

export function todayDayIndex(): number {
  return dayIndexFromDateKey(new Date().toISOString().slice(0, 10));
}

export function isDayInMask(mask: number, dayIndex: number): boolean {
  if (dayIndex < 0 || dayIndex > 6) return false;
  return (mask & (1 << dayIndex)) !== 0;
}

export function isScheduledOnDayIndex(mask: number, dayIndex: number): boolean {
  const m = normalizeScheduleMask(mask);
  return isDayInMask(m, dayIndex);
}

export function normalizeScheduleMask(mask: number | null | undefined): number {
  if (typeof mask !== "number" || !Number.isFinite(mask)) return ALL_DAYS_MASK;
  const clamped = Math.min(127, Math.max(1, Math.floor(mask)));
  return clamped;
}

export function popcountDays(mask: number): number {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    if (isDayInMask(mask, i)) n++;
  }
  return n;
}

export function toggleDayInMask(mask: number, dayIndex: number): number {
  const m = normalizeScheduleMask(mask);
  return m ^ (1 << dayIndex);
}

export function maskFromSelectedDays(selected: boolean[]): number {
  let mask = 0;
  for (let i = 0; i < 7; i++) {
    if (selected[i]) mask |= 1 << i;
  }
  return mask || ALL_DAYS_MASK;
}

export function selectedDaysFromMask(mask: number): boolean[] {
  const m = normalizeScheduleMask(mask);
  return WEEKDAY_SHORT.map((_, i) => isDayInMask(m, i));
}

export function formatScheduleDaysLabel(mask: number): string {
  const m = normalizeScheduleMask(mask);
  if (m === ALL_DAYS_MASK) return "Every day";
  const names = WEEKDAY_SHORT.filter((_, i) => isDayInMask(m, i));
  if (names.length === 0) return "No days";
  if (names.length <= 3) return names.join(", ");
  return `${names.length} days/week`;
}

/** Parse Postgres time or HH:MM to display e.g. "7:30 AM". */
export function formatReminderTimeLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}

/** DB time → value for input[type=time]. */
export function reminderTimeForInput(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

/** From input[type=time] value "HH:MM" for DB. */
export function reminderTimeForDb(hhmm: string): string | null {
  const trimmed = hhmm.trim();
  if (!trimmed) return null;
  if (!/^\d{2}:\d{2}$/.test(trimmed)) return null;
  return `${trimmed}:00`;
}

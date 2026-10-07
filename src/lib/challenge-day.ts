/** 1-based challenge day index from start date (UTC date keys). */
export function challengeDayIndex(startDate: string, todayKey: string): number {
  const start = new Date(`${startDate}T12:00:00Z`).getTime();
  const today = new Date(`${todayKey}T12:00:00Z`).getTime();
  const diff = Math.floor((today - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

export function challengeTotalDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00Z`).getTime();
  const end = new Date(`${endDate}T12:00:00Z`).getTime();
  return Math.max(1, Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1);
}

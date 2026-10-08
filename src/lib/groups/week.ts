/** ISO week start (Monday) in UTC date key YYYY-MM-DD */
export function currentWeekStartKey(reference = new Date()): string {
  const d = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function previousWeekStartKey(weekStart: string): string {
  const d = new Date(`${weekStart}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

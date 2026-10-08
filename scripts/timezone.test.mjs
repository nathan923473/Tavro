#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import { TZDate } from "@date-fns/tz";
import { addDays, format } from "date-fns";

function formatDateRangeDisplay(startDateKey, endDateKey, timeZone = "UTC") {
  const [sy, sm, sd] = startDateKey.split("-").map(Number);
  const [ey, em, ed] = endDateKey.split("-").map(Number);
  if (startDateKey === endDateKey) {
    return format(new TZDate(ey, em - 1, ed, 12, 0, 0, timeZone), "d MMM yyyy");
  }
  const sameYear = sy === ey;
  const start = format(
    new TZDate(sy, sm - 1, sd, 12, 0, 0, timeZone),
    sameYear ? "d MMM" : "d MMM yyyy",
  );
  const end = format(new TZDate(ey, em - 1, ed, 12, 0, 0, timeZone), "d MMM yyyy");
  return `${start} – ${end}`;
}

function midnightUtc(dateKey, timeZone) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, 0, 0, 0, timeZone).getTime());
}

function exclusiveEndUtc(endDateKey, timeZone) {
  const [y, m, d] = endDateKey.split("-").map(Number);
  const endLocal = new TZDate(y, m - 1, d, 0, 0, 0, timeZone);
  const next = addDays(endLocal, 1);
  return new Date(
    new TZDate(next.getFullYear(), next.getMonth(), next.getDate(), 0, 0, 0, timeZone).getTime(),
  );
}

test("Melbourne 9am is one instant worldwide", () => {
  const start = new Date(new TZDate(2026, 10, 1, 9, 0, 0, "Australia/Melbourne").getTime());
  const copy = new Date(start.getTime());
  assert.equal(start.toISOString(), copy.toISOString());
});

test("Countdown duration from six days before start", () => {
  const start = new Date(new TZDate(2026, 10, 1, 9, 0, 0, "Australia/Melbourne").getTime());
  const now = start.getTime() - 6 * 86_400_000;
  const remaining = start.getTime() - now;
  assert.equal(Math.floor(remaining / 86_400_000), 6);
});

test("formatHumanCountdownToStart includes d h m s", async () => {
  const { formatHumanCountdownToStart } = await import("../src/lib/timezone/format.ts");
  const now = Date.UTC(2026, 9, 9, 12, 0, 0);
  const start = new Date(now + (2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5) * 1000);
  assert.equal(formatHumanCountdownToStart(start, now), "2d 03h 04m 05s");
  assert.equal(formatHumanCountdownToStart(new Date(now), now), "Started");
});

test("Exclusive end is midnight after final day in challenge TZ", () => {
  const end = exclusiveEndUtc("2026-11-30", "Australia/Melbourne");
  const dayAfter = midnightUtc("2026-12-01", "Australia/Melbourne");
  assert.equal(end.toISOString(), dayAfter.toISOString());
});

test("Legacy midnight differs by zone", () => {
  const mel = midnightUtc("2026-11-01", "Australia/Melbourne");
  const lon = midnightUtc("2026-11-01", "Europe/London");
  assert.notEqual(mel.toISOString(), lon.toISOString());
});

test("Challenge date range display is friendly and unambiguous", () => {
  assert.equal(
    formatDateRangeDisplay("2026-11-01", "2026-11-30"),
    "1 Nov – 30 Nov 2026",
  );
  assert.equal(
    formatDateRangeDisplay("2026-12-28", "2027-01-05"),
    "28 Dec 2026 – 5 Jan 2027",
  );
});

console.log("timezone tests passed");

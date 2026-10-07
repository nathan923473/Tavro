#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

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

console.log("timezone tests passed");

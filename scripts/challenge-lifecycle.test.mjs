#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function findConflict(candidate, existing) {
  for (const other of existing) {
    if (candidate.id && other.id === candidate.id) continue;
    if (
      intervalsOverlap(
        candidate.start,
        candidate.end,
        other.start,
        other.end,
      )
    ) {
      return other;
    }
  }
  return null;
}

test("non-overlapping adjacent months allowed", () => {
  const nov = { id: "a", start: Date.parse("2026-11-01T00:00:00Z"), end: Date.parse("2026-12-01T00:00:00Z") };
  const dec = { id: "b", start: Date.parse("2026-12-01T00:00:00Z"), end: Date.parse("2027-01-01T00:00:00Z") };
  assert.equal(findConflict(dec, [nov]), null);
});

test("overlapping schedules rejected", () => {
  const a = { id: "a", start: Date.parse("2026-11-01T00:00:00Z"), end: Date.parse("2026-12-01T00:00:00Z") };
  const b = { id: "b", start: Date.parse("2026-11-20T00:00:00Z"), end: Date.parse("2026-12-21T00:00:00Z") };
  assert.equal(findConflict(b, [a])?.id, "a");
});

console.log("challenge lifecycle tests passed");

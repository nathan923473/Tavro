#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";

function safeRate(numerator, denominator) {
  if (denominator <= 0) return null;
  return (numerator / denominator) * 100;
}

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

test("safeRate handles zero denominator", () => {
  assert.equal(safeRate(1, 0), null);
  assert.equal(safeRate(1, 4), 25);
});

test("percentChange", () => {
  assert.equal(percentChange(10, 5), 100);
  assert.equal(percentChange(0, 0), 0);
});

console.log("founder-analytics.test.mjs OK");

import assert from "node:assert/strict";
import test from "node:test";
import { challengePhaseFromChallenge } from "../src/lib/timezone/challenge-fields.ts";

const melbourne = {
  startDate: "2026-10-16",
  endDate: "2026-10-20",
  startAt: null,
  endAt: null,
  challengeTimezone: "Australia/Melbourne",
};

test("phase uses challenge midnight, not UTC calendar date", () => {
  // 16 Oct 2026 08:30 in Melbourne is still 15 Oct UTC.
  // UTC-today comparison would treat the challenge as not started.
  const now = new Date("2026-10-15T21:30:00.000Z");
  assert.equal(challengePhaseFromChallenge(melbourne, now), "active");
});

test("phase stays upcoming before challenge-timezone midnight", () => {
  const now = new Date("2026-10-15T12:30:00.000Z");
  assert.equal(challengePhaseFromChallenge(melbourne, now), "upcoming");
});

test("start_at wins over the calendar date", () => {
  const now = new Date("2026-10-16T00:30:00.000Z");
  assert.equal(
    challengePhaseFromChallenge(
      {
        ...melbourne,
        startAt: "2026-10-16T22:00:00.000Z",
        endAt: "2026-10-21T13:00:00.000Z",
      },
      now,
    ),
    "upcoming",
  );
});

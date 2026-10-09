import assert from "node:assert/strict";
import test from "node:test";
import {
  isPersonalGoalScheduledToday,
  utcWeekday,
} from "../src/lib/groups/goal-schedule.ts";

test("every_n_days respects anchor", () => {
  const goal = {
    userId: "u1",
    title: "Push-ups",
    scheduleType: "every_n_days",
    scheduleInterval: 2,
    scheduleWeekdays: [],
    timesPerWeek: 3,
    scheduleAnchor: "2026-10-01",
    scheduleLabel: "",
  };
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-01", 0), true);
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-02", 0), false);
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-03", 0), true);
});

test("weekdays schedule", () => {
  const goal = {
    userId: "u1",
    title: "Gym",
    scheduleType: "weekdays",
    scheduleInterval: 1,
    scheduleWeekdays: [1, 3, 5],
    timesPerWeek: 3,
    scheduleAnchor: "2026-10-01",
    scheduleLabel: "",
  };
  assert.equal(utcWeekday("2026-10-05"), 1);
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-05", 0), true);
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-06", 0), false);
});

test("times_per_week flex until quota met", () => {
  const goal = {
    userId: "u1",
    title: "Walk",
    scheduleType: "times_per_week",
    scheduleInterval: 1,
    scheduleWeekdays: [],
    timesPerWeek: 3,
    scheduleAnchor: "2026-10-01",
    scheduleLabel: "",
  };
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-08", 0), true);
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-08", 2), true);
  assert.equal(isPersonalGoalScheduledToday(goal, "2026-10-08", 3), false);
});

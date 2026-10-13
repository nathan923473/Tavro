import assert from "node:assert/strict";
import test from "node:test";
import {
  habitsScheduledToday,
  isHabitScheduledToday,
} from "../src/lib/habits/schedule.ts";

const daily = {
  id: "1",
  title: "Walk",
  category: "movement",
  completedToday: false,
  streakDays: 0,
  weeklyCompletion: 3,
  templateKey: null,
  frequencyType: "daily",
  frequencyTarget: 7,
  paused: false,
  linkedChallengeId: null,
};

const weekly = {
  ...daily,
  id: "2",
  frequencyType: "times_per_week",
  frequencyTarget: 3,
  weeklyCompletion: 3,
};

test("daily always scheduled", () => {
  assert.equal(isHabitScheduledToday(daily), true);
});

test("times_per_week rest when quota met", () => {
  assert.equal(isHabitScheduledToday(weekly), false);
  assert.equal(habitsScheduledToday([weekly]).length, 0);
});

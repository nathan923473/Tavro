import assert from "node:assert/strict";
import test from "node:test";
import {
  dateMatchesDaysMask,
  formatReminderTime,
  habitDaysLabel,
  habitsScheduledToday,
  isHabitScheduledOnDate,
  isHabitScheduledToday,
  scheduledDaysPerWeek,
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

const monday = new Date("2026-10-05T12:00:00.000Z");
const tuesday = new Date("2026-10-06T12:00:00.000Z");

test("weekday mask limits which days a daily habit appears", () => {
  const gym = { ...daily, scheduleDaysMask: 1, reminderTime: "07:30" };
  assert.equal(isHabitScheduledToday(gym, monday), true);
  assert.equal(isHabitScheduledToday(gym, tuesday), false);
  assert.equal(dateMatchesDaysMask("2026-10-05", 1), true);
  assert.equal(dateMatchesDaysMask("2026-10-11", 64), true);
  assert.equal(habitDaysLabel(31), "Weekdays");
  assert.equal(scheduledDaysPerWeek(gym), 1);
});

test("weekday mask still applies when a weekly quota remains", () => {
  const gym = {
    ...weekly,
    weeklyCompletion: 0,
    scheduleDaysMask: 21,
    reminderTime: null,
  };
  assert.equal(isHabitScheduledToday(gym, monday), true);
  assert.equal(isHabitScheduledToday(gym, tuesday), false);
  assert.equal(
    isHabitScheduledOnDate(gym, "2026-10-06", new Map()),
    false,
  );
  assert.equal(scheduledDaysPerWeek({ ...daily, scheduleDaysMask: 21 }), 3);
  assert.equal(formatReminderTime("07:30:00"), "7:30 AM");
  assert.equal(formatReminderTime("23:15"), "11:15 PM");
});

#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findLibraryTemplate,
  libraryTemplates,
  templateByKey,
} from "../src/lib/creator/challenge-templates.ts";

test("library has the six starter templates with full schedules", () => {
  const templates = libraryTemplates();
  assert.deepEqual(
    templates.map((template) => template.key),
    [
      "walking_7",
      "healthy_habits_14",
      "consistency_30",
      "beginner_fitness_14",
      "movement_21",
      "kickstart_7",
    ],
  );
  for (const template of templates) {
    assert.equal(template.schedule.length, template.durationDays);
    assert.ok(template.title.length > 2);
    assert.ok(template.shortDescription.length > 2);
    assert.ok(template.participantSummary.length > 2);
    assert.ok(template.goalDescription.length > 2);
    assert.ok(template.schedule.every((day) => day.weekTheme));
  }
});

test("old template links resolve to the new plans", () => {
  assert.equal(templateByKey("walking").key, "walking_7");
  assert.equal(templateByKey("healthy_habits").durationDays, 14);
  assert.equal(templateByKey("general_fitness").key, "beginner_fitness_14");
  assert.equal(templateByKey("scratch").schedule.length, 0);
  assert.equal(findLibraryTemplate("scratch"), null);
  assert.equal(findLibraryTemplate("missing"), null);
});

test("template schedules are independent copies", () => {
  const first = templateByKey("walking_7");
  const second = templateByKey("walking_7");
  first.schedule[0].title = "Changed";
  assert.notEqual(second.schedule[0].title, "Changed");
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  challengeHasCover,
} from "../src/lib/challenge-lifecycle/cover-required.ts";

test("challengeHasCover", () => {
  assert.equal(challengeHasCover(null), false);
  assert.equal(challengeHasCover(""), false);
  assert.equal(challengeHasCover("   "), false);
  assert.equal(challengeHasCover("https://example.com/cover.jpg"), true);
});

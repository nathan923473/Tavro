#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  challengeCreatorSubtitle,
  creatorCommunityBrandLabel,
  looksLikeFullPersonalName,
} from "../src/lib/creator-display-name.ts";

test("looksLikeFullPersonalName", () => {
  assert.equal(looksLikeFullPersonalName("Nathan Stone"), true);
  assert.equal(looksLikeFullPersonalName("Jack Smith"), true);
  assert.equal(looksLikeFullPersonalName("Stride Club"), false);
  assert.equal(looksLikeFullPersonalName("Sarah"), false);
});

test("challengeCreatorSubtitle hides Jack Smith under Nathan Stone", () => {
  assert.equal(
    challengeCreatorSubtitle("Nathan Stone", "Jack Smith"),
    null,
  );
  assert.equal(
    challengeCreatorSubtitle("Nathan Stone", "Nathan Stone Fitness"),
    "Nathan Stone Fitness",
  );
});

test("creatorCommunityBrandLabel hides stale personal community title", () => {
  assert.equal(
    creatorCommunityBrandLabel("Jack Smith", "Nathan Stone"),
    null,
  );
  assert.equal(
    creatorCommunityBrandLabel("Stride Club", "Nathan Stone"),
    "Stride Club",
  );
  assert.equal(creatorCommunityBrandLabel("Nathan Stone", "Nathan Stone"), null);
});

console.log("creator-display-name.test.mjs OK");

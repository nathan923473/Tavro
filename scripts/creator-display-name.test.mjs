#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  creatorCommunityBrandLabel,
  looksLikeFullPersonalName,
} from "../src/lib/creator-display-name.ts";

test("looksLikeFullPersonalName", () => {
  assert.equal(looksLikeFullPersonalName("Nathan Stone"), true);
  assert.equal(looksLikeFullPersonalName("Jack Smith"), true);
  assert.equal(looksLikeFullPersonalName("Stride Club"), false);
  assert.equal(looksLikeFullPersonalName("Sarah"), false);
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

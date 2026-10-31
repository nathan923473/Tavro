#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import { canSeeCreatorStudio } from "../src/lib/auth/creator-access.ts";

test("creator studio tab is limited to creators and admins", () => {
  assert.equal(canSeeCreatorStudio("creator"), true);
  assert.equal(canSeeCreatorStudio("admin"), true);
  assert.equal(canSeeCreatorStudio("member"), false);
  assert.equal(canSeeCreatorStudio("creator_pending"), false);
  assert.equal(canSeeCreatorStudio("guest"), false);
  assert.equal(canSeeCreatorStudio(null), false);
  assert.equal(canSeeCreatorStudio(undefined), false);
});

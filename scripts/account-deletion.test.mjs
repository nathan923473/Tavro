#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickAccountabilityGroupSuccessor } from "../src/lib/account-deletion/group-successor.ts";

test("pickAccountabilityGroupSuccessor chooses earliest other member", () => {
  const members = [
    { user_id: "a", joined_at: "2025-01-01" },
    { user_id: "b", joined_at: "2025-02-01" },
    { user_id: "c", joined_at: "2025-01-15" },
  ];
  assert.equal(pickAccountabilityGroupSuccessor(members, "a"), "c");
  assert.equal(pickAccountabilityGroupSuccessor(members, "b"), "a");
});

test("pickAccountabilityGroupSuccessor returns null when alone", () => {
  assert.equal(
    pickAccountabilityGroupSuccessor([{ user_id: "solo", joined_at: "2025-01-01" }], "solo"),
    null,
  );
});

function validateDeleteConfirmation(confirmation) {
  return confirmation.trim() === "DELETE";
}

test("validateDeleteConfirmation", () => {
  assert.equal(validateDeleteConfirmation("DELETE"), true);
  assert.equal(validateDeleteConfirmation(" delete "), false);
  assert.equal(validateDeleteConfirmation("delete"), false);
});

console.log("account-deletion.test.mjs OK");

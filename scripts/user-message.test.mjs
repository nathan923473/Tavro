#!/usr/bin/env node
import assert from "node:assert/strict";
import { test } from "node:test";
import { userFacingErrorMessage } from "../src/lib/errors/user-message.ts";

const MINIFIED =
  "Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";

test("hides minified React errors", () => {
  assert.equal(
    userFacingErrorMessage(new Error(MINIFIED), "Could not join this challenge. Please try again."),
    "Could not join this challenge. Please try again.",
  );
});

test("keeps a registration sentence", () => {
  assert.equal(
    userFacingErrorMessage(
      new Error("Registration closed when this challenge started."),
      "Could not join this challenge. Please try again.",
    ),
    "Registration closed when this challenge started.",
  );
});

test("hides database errors", () => {
  assert.equal(
    userFacingErrorMessage(
      new Error('duplicate key value violates unique constraint "challenge_participants_pkey"'),
      "Could not join this challenge. Please try again.",
    ),
    "Could not join this challenge. Please try again.",
  );
});

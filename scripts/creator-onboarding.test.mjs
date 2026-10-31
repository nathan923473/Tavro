#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { hashCreatorInvitationToken, isCreatorInvitationToken } from "../src/lib/creator/invitation-token.ts";
import {
  applicantNextStep,
  applicantStatusCopy,
  creatorInvitationExpiry,
  creatorSetupChecklist,
  invitationPreviewCopy,
  isInviteEmail,
  normalizeInviteEmail,
  validateOrganicApplication,
  verificationCodeExpired,
} from "../src/lib/creator/onboarding-rules.ts";

test("invitation tokens are 64 hex chars and hash stably", () => {
  const token = "ab".repeat(32);
  assert.equal(isCreatorInvitationToken(token), true);
  assert.equal(isCreatorInvitationToken(token.toUpperCase()), false);
  assert.equal(isCreatorInvitationToken("short"), false);
  assert.equal(hashCreatorInvitationToken(token), hashCreatorInvitationToken(token));
  assert.notEqual(hashCreatorInvitationToken(token), token);
  assert.equal(hashCreatorInvitationToken(token).length, 64);
});

test("invite email is trimmed and must look like an email", () => {
  assert.equal(normalizeInviteEmail("  Coach@Example.com "), "coach@example.com");
  assert.equal(isInviteEmail("coach@example.com"), true);
  assert.equal(isInviteEmail("not an email"), false);
});

test("invite expiry is a future Melbourne day within 90 days", () => {
  const now = new Date("2026-10-31T00:00:00.000Z");
  const expires = creatorInvitationExpiry("2026-11-15", now);
  assert.ok(expires > now);
  assert.throws(() => creatorInvitationExpiry("2026-10-01", now), /future/);
  assert.throws(() => creatorInvitationExpiry("2027-06-01", now), /90 days/);
  assert.throws(() => creatorInvitationExpiry("tomorrow", now), /expiry date/);
});

test("organic application keeps the four essential fields", () => {
  assert.equal(
    validateOrganicApplication({
      displayName: "Coach Sarah",
      socialLink: "https://instagram.com/sarah",
      coachingFocus: "Strength",
      motivation: "I want to host a free challenge for beginners.",
    }),
    null,
  );
  assert.match(
    validateOrganicApplication({
      displayName: "A",
      socialLink: "instagram.com/sarah",
      coachingFocus: "",
      motivation: "short",
    }) ?? "",
    /creator name/,
  );
});

test("organic status tells the applicant the next step", () => {
  const now = new Date("2026-10-31T06:00:00.000Z");
  assert.equal(applicantNextStep(null).kind, "form");

  const verifying = applicantNextStep({
    status: "pending_verification",
    verificationState: "pending",
    expiresAt: "2026-11-02T00:00:00.000Z",
    reviewedBy: null,
    reapplyPermitted: false,
    now,
  });
  assert.deepEqual(verifying, { kind: "verify", canRefreshCode: false });
  assert.match(applicantStatusCopy(verifying).body, /admin still approves/i);

  const expired = applicantNextStep({
    status: "rejected",
    verificationState: "expired",
    expiresAt: "2026-10-01T00:00:00.000Z",
    reviewedBy: null,
    reapplyPermitted: false,
    now,
  });
  assert.deepEqual(expired, { kind: "verify", canRefreshCode: true });
  assert.equal(verificationCodeExpired("2026-10-01T00:00:00.000Z", "pending", now), true);

  const review = applicantNextStep({
    status: "awaiting_review",
    verificationState: "verified",
    expiresAt: null,
    reviewedBy: null,
    reapplyPermitted: false,
    now,
  });
  assert.equal(review.kind, "review");
  assert.match(applicantStatusCopy(review).body, /admin will approve or decline/i);

  const rejected = applicantNextStep({
    status: "rejected",
    verificationState: "verified",
    expiresAt: null,
    reviewedBy: "admin-id",
    reapplyPermitted: false,
    now,
  });
  assert.equal(rejected.kind, "rejected");

  const reapply = applicantNextStep({
    status: "rejected",
    verificationState: "verified",
    expiresAt: null,
    reviewedBy: "admin-id",
    reapplyPermitted: true,
    now,
  });
  assert.deepEqual(reapply, { kind: "form", reapply: true });
});

test("setup checklist is optional progress, not a gate", () => {
  const steps = creatorSetupChecklist({
    profileComplete: false,
    profileHref: "/studio/community/setup",
    challengeCount: 0,
    publishedCount: 0,
    createHref: "/studio/challenges/new",
    publishHref: "/studio/challenges/new",
    shareHref: null,
    shared: false,
  });
  assert.deepEqual(
    steps.map((step) => step.id),
    ["profile", "create", "publish", "share"],
  );
  assert.equal(steps.every((step) => step.done), false);
  assert.equal(steps[1].href, "/studio/challenges/new");

  const done = creatorSetupChecklist({
    profileComplete: true,
    profileHref: "/creator/sarah/edit",
    challengeCount: 1,
    publishedCount: 1,
    createHref: "/studio/challenges/new",
    publishHref: "/studio/challenges",
    shareHref: "/creator/sarah/challenges/spring",
    shared: true,
  });
  assert.equal(done.every((step) => step.done), true);
});

test("invite preview copy does not grant access by itself", () => {
  assert.match(invitationPreviewCopy("ready").body, /Sign in/);
  assert.match(invitationPreviewCopy("used").body, /once/);
  assert.match(invitationPreviewCopy("invalid").title, /not valid/);
});

test("migration keeps approval on the server and invitations single-use", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/051_creator_invites_and_onboarding.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /token_hash text not null unique/);
  assert.match(sql, /for update/);
  assert.match(sql, /account_email <> inv\.intended_email/);
  assert.match(sql, /if not public\.is_admin\(admin_id\)/);
  assert.match(sql, /social verification required before approval/);
  assert.match(sql, /app\.status <> 'awaiting_review'/);
  assert.match(sql, /Only an admin rejection can be opened for reapply/);
  assert.match(sql, /Your verification code is still active/);
  assert.match(sql, /revoke all on table public\.creator_invitations from public, anon, authenticated/);
  assert.doesNotMatch(sql, /delete from public\.creator_applications/i);
  assert.doesNotMatch(sql, /delete from public\.profiles/i);
});

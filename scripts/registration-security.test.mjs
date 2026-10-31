import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  accessDecisionForAccount,
  accountAccessDecision,
  classifySignUp,
  normalizeAuthEmail,
  passwordIssue,
  shouldDeleteAutoconfirmedUser,
  signupBlockedWithoutRateLimit,
  turnstileMode,
} from "../src/lib/auth/email-verification.ts";
import { AUTH_RATE_LIMITS } from "../src/lib/auth/rate-limit.ts";
import { canonicalAuthOrigin, safeInternalPath } from "../src/lib/site-url.ts";
import { verifyTurnstileToken } from "../src/lib/auth/turnstile.ts";

test("new passwords are 8 to 72 bytes with no composition rule", () => {
  assert.match(passwordIssue("short"), /8 characters/);
  assert.equal(passwordIssue("password"), null);
  assert.equal(passwordIssue("a".repeat(72)), null);
  assert.match(passwordIssue("a".repeat(73)), /72 characters/);
  assert.match(passwordIssue("🙂".repeat(20)), /72 characters/);
});

test("access stays open for signed-out visitors and blocks unproven inboxes", () => {
  assert.equal(
    accountAccessDecision({
      hasUser: false,
      emailConfirmedAt: null,
      ownershipVerifiedAt: null,
    }),
    "anonymous",
  );
  assert.equal(
    accountAccessDecision({
      hasUser: true,
      emailConfirmedAt: null,
      ownershipVerifiedAt: null,
    }),
    "needs_confirmation",
  );
  assert.equal(
    accountAccessDecision({
      hasUser: true,
      emailConfirmedAt: "2026-01-01T00:00:00Z",
      ownershipVerifiedAt: null,
    }),
    "needs_reverify",
  );
  assert.equal(
    accountAccessDecision({
      hasUser: true,
      emailConfirmedAt: "2026-01-01T00:00:00Z",
      ownershipVerifiedAt: undefined,
    }),
    "ok",
  );
  assert.equal(
    accessDecisionForAccount({
      hasUser: true,
      emailConfirmedAt: "2026-01-01T00:00:00Z",
      ownershipVerifiedAt: null,
      enforceOwnership: false,
    }),
    "ok",
  );
});

test("immediate confirmed sessions are rejected and only fresh users are deleted", () => {
  assert.equal(
    classifySignUp({ hasSession: false, emailConfirmedAt: null, identityCount: 1 }),
    "confirm_email",
  );
  assert.equal(
    classifySignUp({ hasSession: true, emailConfirmedAt: "2026-01-01T00:00:00Z", identityCount: 1 }),
    "reject_autoconfirm",
  );
  assert.equal(
    classifySignUp({ hasSession: false, emailConfirmedAt: null, identityCount: 0 }),
    "already_registered",
  );
  const now = Date.parse("2026-10-31T00:00:00Z");
  assert.equal(shouldDeleteAutoconfirmedUser("2026-10-31T00:00:30Z", now), false);
  assert.equal(shouldDeleteAutoconfirmedUser(new Date(now - 30_000).toISOString(), now), true);
  assert.equal(shouldDeleteAutoconfirmedUser(new Date(now - 10 * 60_000).toISOString(), now), false);
});

test("auth redirects stay on an allowlisted origin", () => {
  assert.equal(safeInternalPath("/invite/creator/" + "ab".repeat(32)), "/invite/creator/" + "ab".repeat(32));
  assert.equal(safeInternalPath("https://evil.example"), "/");
  assert.equal(safeInternalPath("//evil.example"), "/");
  assert.equal(safeInternalPath("/%2F%2Fevil.example"), "/");
  assert.equal(
    canonicalAuthOrigin({ host: "jointavro.app", protocol: "https:" }),
    "https://www.jointavro.app",
  );
  assert.equal(
    canonicalAuthOrigin({ host: "www.jointavro.app", protocol: "https:" }),
    "https://www.jointavro.app",
  );
  assert.equal(
    canonicalAuthOrigin({
      host: "evil.example",
      protocol: "https:",
      nodeEnv: "production",
      appUrl: "https://www.jointavro.app",
    }),
    "https://www.jointavro.app",
  );
  assert.equal(
    canonicalAuthOrigin({
      host: "127.0.0.1:43123",
      protocol: "http:",
      nodeEnv: "development",
    }),
    "http://127.0.0.1:43123",
  );
  assert.equal(
    canonicalAuthOrigin({
      host: "localhost:43123",
      protocol: "http:",
      nodeEnv: "production",
    }),
    "https://www.jointavro.app",
  );
});

test("production sign-up fails closed without Turnstile or the rate-limit migration", async () => {
  assert.equal(turnstileMode({ NODE_ENV: "production" }), "required");
  assert.equal(turnstileMode({ NODE_ENV: "development" }), "skip");
  assert.equal(signupBlockedWithoutRateLimit("production"), true);
  assert.equal(signupBlockedWithoutRateLimit("development"), false);
  let called = false;
  const result = await verifyTurnstileToken(
    "token",
    "127.0.0.1",
    { NODE_ENV: "production" },
    async () => {
      called = true;
      return new Response(JSON.stringify({ success: true }));
    },
  );
  assert.equal(result.ok, false);
  assert.equal(called, false);
  assert.equal(AUTH_RATE_LIMITS["signup:ip"].limit, 5);
  assert.equal(AUTH_RATE_LIMITS["resend:email"].limit, 3);
  assert.equal(AUTH_RATE_LIMITS["login:email"].limit, 10);
});

test("normal sign-up does not confirm emails, and ownership cannot be self-set", () => {
  const actions = readFileSync(new URL("../src/app/(auth)/actions.ts", import.meta.url), "utf8");
  assert.equal(actions.includes("email_confirm:"), false);
  assert.equal(actions.includes("createUser"), false);
  const migration = readFileSync(
    new URL("../supabase/migrations/052_email_ownership_and_auth_limits.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /email_ownership_verified_at/);
  assert.match(migration, /cannot change email verification/);
  assert.match(migration, /grant execute on function public.consume_auth_rate_limit/);
  assert.match(migration, /to service_role/);
  assert.match(migration, /Confirm your email before accepting this invitation/);
  assert.doesNotMatch(migration, /delete from public\.profiles/i);
  assert.doesNotMatch(migration, /delete from auth\.users/i);
  const ensure = readFileSync(new URL("../src/lib/auth/ensure-profile.ts", import.meta.url), "utf8");
  assert.equal(ensure.includes("email_ownership_verified_at"), false);
  assert.equal(ensure.includes("email_confirm"), false);
});

test("email addresses are normalized without accepting blanks", () => {
  assert.equal(normalizeAuthEmail("  Coach@Example.com "), "coach@example.com");
  assert.equal(normalizeAuthEmail("not-an-email"), null);
});

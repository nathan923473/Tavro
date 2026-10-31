export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

/** New passwords only. Login still accepts whatever Supabase already stored. */
export function passwordIssue(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Use at least 8 characters.";
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return "Use 72 characters or fewer. That's the longest password Tavro can store safely.";
  }
  return null;
}

export type AccountAccess = "anonymous" | "ok" | "needs_confirmation" | "needs_reverify";

/**
 * ownershipVerifiedAt undefined: column not migrated, or the ownership gate is off.
 * null: column exists and this inbox has not been proven.
 */
export function accountAccessDecision(input: {
  hasUser: boolean;
  emailConfirmedAt: string | null;
  ownershipVerifiedAt: string | null | undefined;
}): AccountAccess {
  if (!input.hasUser) return "anonymous";
  if (!input.emailConfirmedAt) return "needs_confirmation";
  if (input.ownershipVerifiedAt === undefined) return "ok";
  if (!input.ownershipVerifiedAt) return "needs_reverify";
  return "ok";
}

export function accessDecisionForAccount(input: {
  hasUser: boolean;
  emailConfirmedAt: string | null;
  ownershipVerifiedAt: string | null | undefined;
  enforceOwnership: boolean;
}): AccountAccess {
  return accountAccessDecision({
    hasUser: input.hasUser,
    emailConfirmedAt: input.emailConfirmedAt,
    ownershipVerifiedAt: input.enforceOwnership ? input.ownershipVerifiedAt : undefined,
  });
}

export function accountNeedsVerification(decision: AccountAccess): boolean {
  return decision === "needs_confirmation" || decision === "needs_reverify";
}

/** Legacy re-verification needs the service role to record the proof. */
export function ownershipGateEnabled(
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
): boolean {
  return Boolean(serviceRoleKey);
}

export type SignUpClassification =
  | "confirm_email"
  | "reject_autoconfirm"
  | "already_registered";

export function classifySignUp(input: {
  hasSession: boolean;
  emailConfirmedAt: string | null;
  identityCount: number | null;
}): SignUpClassification {
  if (input.identityCount === 0) return "already_registered";
  if (input.hasSession && input.emailConfirmedAt) return "reject_autoconfirm";
  return "confirm_email";
}

/** Only a user created in this request may be removed when confirmation is switched off. */
export function shouldDeleteAutoconfirmedUser(
  createdAt: string | null,
  nowMs: number,
): boolean {
  if (!createdAt) return false;
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return false;
  const age = nowMs - created;
  return age >= 0 && age < 2 * 60 * 1000;
}

export function normalizeAuthEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (value.length < 3 || value.length > 320) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return null;
  return value;
}

export function turnstileMode(env: {
  NODE_ENV?: string;
  TURNSTILE_SECRET_KEY?: string;
}): "skip" | "required" {
  if (env.NODE_ENV === "production") return "required";
  if (env.TURNSTILE_SECRET_KEY) return "required";
  return "skip";
}

export function signupBlockedWithoutRateLimit(nodeEnv: string | undefined): boolean {
  return nodeEnv === "production";
}

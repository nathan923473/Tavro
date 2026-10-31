import { createHash } from "node:crypto";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

/** Same SHA-256 hex digest as public.creator_invitation_token_hash. */
export function hashCreatorInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isCreatorInvitationToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

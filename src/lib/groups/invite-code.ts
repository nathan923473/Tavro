import { randomBytes } from "node:crypto";

/** Unambiguous uppercase chars for shareable invite codes. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGroupInviteCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export function normalizeGroupInviteCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

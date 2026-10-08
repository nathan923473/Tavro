import { randomBytes, randomInt } from "node:crypto";

/** Unambiguous uppercase chars (no O, 0, I, 1). */
export const GROUP_INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Secure random code, 6–8 characters (server only). */
export function generateGroupInviteCode(): string {
  const length = randomInt(6, 9);
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += GROUP_INVITE_CODE_ALPHABET[bytes[i]! % GROUP_INVITE_CODE_ALPHABET.length];
  }
  return out;
}

export {
  formatGroupInviteCodeDisplay,
  isFriendlyInviteCode,
  normalizeGroupInviteCode,
} from "@/lib/groups/invite-code-display";

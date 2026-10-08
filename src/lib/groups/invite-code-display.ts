const LEGACY_HEX_CODE = /^[a-f0-9]{8,12}$/i;

export function normalizeGroupInviteCode(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (LEGACY_HEX_CODE.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed.toUpperCase();
}

export function formatGroupInviteCodeDisplay(code: string): string {
  const normalized = normalizeGroupInviteCode(code);
  if (LEGACY_HEX_CODE.test(code.trim())) {
    return normalized.toUpperCase();
  }
  return normalized;
}

export function isFriendlyInviteCode(code: string): boolean {
  return !LEGACY_HEX_CODE.test(code.trim());
}

/**
 * Embed challenge membership rows (not joined_challenge_id attribution mirror).
 * Required after 023_founder_analytics added a second FK to challenges.
 */
export const CHALLENGE_PARTICIPANTS_EMBED =
  "challenge_participants!challenge_participants_challenge_id_fkey";

/** Supabase embedded relations may return object or single-element array. */
export function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

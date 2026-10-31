const UNREADABLE =
  /minified react error|react\.dev\/errors|reactjs\.org\/docs\/error-decoder|server components render|specific message is omitted|schema cache|syntax error at or near|duplicate key value|violates |row-level security|permission denied|jwt|econnrefused|enotfound|node_modules|\bat (?:async )?[A-Za-z0-9_$./<>]+\(/i;

/** Turn a thrown error into a sentence a member can read. */
export function userFacingErrorMessage(error: unknown, fallback: string): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const message = raw.replace(/\s+/g, " ").trim();
  if (!message || message.length > 240 || UNREADABLE.test(message)) return fallback;
  return message;
}

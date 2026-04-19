/**
 * Privacy sanitizer: strips PII before logging or any external transmission.
 * Only aggregate transactional summaries (categories, amounts, scores) pass through.
 *
 * Rule: no email, name, merchant name, or any direct identifier should appear
 * in logs, AI prompts, or external event payloads.
 */

const REDACTED_KEYS = new Set([
  "email",
  "name",
  "picture",
  "given_name",
  "family_name",
  "nickname",
  "phone_number",
  "address",
  "merchant",
]);

export function sanitizeForLog(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(sanitizeForLog);
  if (typeof data !== "object" || data === null) return data;
  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACTED_KEYS.has(k) ? "[REDACTED]" : sanitizeForLog(v),
    ])
  );
}

/**
 * Returns a stable pseudonymous token for a userId — safe for logs.
 * Uses FNV-1a hash: not reversible, no external deps.
 */
export function pseudonymize(userId: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `usr_${h.toString(16).padStart(8, "0")}`;
}

/** @module pii-mask
 *
 * Masks the four high-precision, deterministically-detectable PII types
 * before any text reaches OpenRouter, and restores them afterward. The
 * returned map is per-call only — callers must never persist or log it.
 */

export type PiiType = "EMAIL" | "BANK" | "ID" | "PHONE";

export type PiiMap = Map<string, string>;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const BANK_RE = /\bGE\d{2}[A-Z]{2}\d{16}\b/g;
const ID_RE = /\b\d{11}\b/g;
const PHONE_RE = /\b5\d{8}\b/g;

/** Order matters: EMAIL must run before ID/PHONE — an email whose local
 * part is 11 digits (e.g. `12345678901@gmail.com`) would otherwise get
 * consumed by the ID regex first, since the digits sit at a word boundary
 * either way. BANK before ID/PHONE keeps intent explicit even though IBAN's
 * digit run can't actually collide (it's preceded by letters, so `\b` never
 * lands mid-token there). */
const PASSES: { type: PiiType; re: RegExp }[] = [
  { type: "EMAIL", re: EMAIL_RE },
  { type: "BANK", re: BANK_RE },
  { type: "ID", re: ID_RE },
  { type: "PHONE", re: PHONE_RE },
];

/** Matches any tag this module can produce — reused by pii-unmask-stream.ts
 * so both modules agree on exactly what counts as a tag. */
export const TAG_RE = /\[(?:EMAIL|BANK|ID|PHONE)_\d+\]/g;

/** Scan `text` for the 4 PII types and replace each match with a `[TYPE_n]`
 * tag. The same original value always reuses the same tag within one call. */
export function maskPII(text: string): { masked: string; map: PiiMap } {
  const map: PiiMap = new Map();
  const valueToTag = new Map<string, string>();
  const counts: Record<PiiType, number> = { EMAIL: 0, BANK: 0, ID: 0, PHONE: 0 };

  let masked = text;
  for (const { type, re } of PASSES) {
    masked = masked.replace(re, (match) => {
      const existing = valueToTag.get(match);
      if (existing) return existing;
      counts[type] += 1;
      const tag = `[${type}_${counts[type]}]`;
      valueToTag.set(match, tag);
      map.set(tag, match);
      return tag;
    });
  }

  return { masked, map };
}

/** Replace every `[TYPE_n]` tag in `text` with its original value from
 * `map`. A tag with no map entry (the model hallucinated one, or wrote a
 * number that doesn't exist) is left as-is rather than stripped. */
export function unmaskPII(text: string, map: PiiMap): string {
  return text.replace(TAG_RE, (tag) => map.get(tag) ?? tag);
}

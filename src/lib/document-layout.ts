/**
 * Shared layout rules applied to every generated document (all doc types),
 * across every renderer (docx/pdf export in export-document.ts, on-screen
 * preview in markdown-bold.tsx):
 * - line 1 (the title) is centered
 * - the next line, when it has a city/date pair (e.g. "ქ. CITY   DATE"), is
 *   split into a left-aligned city and a right-aligned date
 * - every other paragraph is justified
 * - `**bold**` markers render as bold text
 * - `[წითელი: ...]` / `[RED: ...]` placeholders — missing-info fields the
 *   "custom" free-form drafting flow (see /api/generate's missingInfoAddendum)
 *   leaves for the user to fill in — render in red, same detection logic in
 *   every renderer.
 */

/** Missing-info placeholder the model is instructed to write for details it
 * wasn't given (custom/free-form documents only — fixed doc types never
 * leave one). Requires the literal "წითელი:"/"RED:" prefix the drafting
 * prompt mandates, rather than matching any bracketed text — precise
 * detection instead of accidentally coloring an unrelated bracket the model
 * wrote for some other reason. Capturing group so `String.split` keeps the
 * match itself. */
export const PLACEHOLDER_RE = /(\[(?:წითელი|RED):[^[\]\n]{1,140}\])/giu;

/** The "წითელი:"/"RED:" marker word itself is only there for PLACEHOLDER_RE
 * to detect the bracket reliably — showing it to the user is redundant with
 * the red color it triggers, so it's stripped before display, leaving just
 * the concrete field name (e.g. "[ქალაქი]" instead of "[წითელი: ქალაქი]"). */
const PLACEHOLDER_MARKER_RE = /^\[(?:წითელი|RED):\s*/iu;

export type TextSegment = { text: string; bold: boolean; placeholder: boolean };

/** Splits a line into runs by `**bold**` markers and `[placeholder]`
 * brackets (which may nest inside a bold run), so every renderer highlights
 * missing-info placeholders the same way from one shared detection pass. */
export function parseRuns(line: string): TextSegment[] {
  const runs: TextSegment[] = [];
  for (const boldPart of line.split(/(\*\*[^*]+\*\*)/g)) {
    if (!boldPart) continue;
    const isBold = boldPart.startsWith("**") && boldPart.endsWith("**");
    const inner = isBold ? boldPart.slice(2, -2) : boldPart;
    for (const part of inner.split(PLACEHOLDER_RE)) {
      if (!part) continue;
      const isPlaceholder = part.startsWith("[") && part.endsWith("]");
      const text = isPlaceholder ? part.replace(PLACEHOLDER_MARKER_RE, "[") : part;
      runs.push({ text, bold: isBold, placeholder: isPlaceholder });
    }
  }
  return runs;
}

export function findTitleIndex(lines: string[]): number {
  return lines.findIndex((l) => l.trim() !== "");
}

export function findHeaderIndex(lines: string[], titleIndex: number): number {
  return lines.findIndex((l, idx) => idx > titleIndex && l.trim() !== "");
}

/** City/date header line looks like "ქ. CITY<big gap>DATE" — split on the gap. */
export function splitHeaderLine(line: string): { left: string; right: string } | null {
  const gap = line.match(/\s{3,}/);
  if (!gap || gap.index === undefined) return null;
  return {
    left: line.slice(0, gap.index).trimEnd(),
    right: line.slice(gap.index + gap[0].length).trimStart(),
  };
}

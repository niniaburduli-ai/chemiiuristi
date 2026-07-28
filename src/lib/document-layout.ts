/**
 * Shared layout rules applied to every generated document (all doc types),
 * across every renderer (docx/pdf export in export-document.ts, on-screen
 * preview in markdown-bold.tsx):
 * - line 1 (the title) is centered
 * - the next line, when it has a city/date pair (e.g. "ქ. CITY   DATE"), is
 *   split into a left-aligned city and a right-aligned date
 * - every other paragraph is justified
 */

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

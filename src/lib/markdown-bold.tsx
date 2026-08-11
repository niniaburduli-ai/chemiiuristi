import type { ReactNode } from "react";
import { findTitleIndex, findHeaderIndex, splitHeaderLine, parseRuns } from "@/lib/document-layout";

/** Strips `**bold**` markers for plain-text editing (a <textarea> can't render
 * <strong> inline), so the edit view never shows literal asterisks. Leaves
 * `[placeholder]` brackets as-is — plain text is exactly what's editable there. */
export function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/** Renders the model's `**bold**` markdown as <strong>. When
 * `highlightPlaceholders` is true — only the "custom" free-form document
 * generation result passes true; every other caller (document analysis/
 * review, chat, consultations, etc.) defaults to false and is unaffected —
 * any `[missing-info placeholder]` also renders in red. */
export function renderMarkdownBold(text: string, highlightPlaceholders = false): ReactNode[] {
  return parseRuns(text).map((r, i) => {
    const isPlaceholder = r.placeholder && highlightPlaceholders;
    if (r.bold && isPlaceholder) {
      return (
        <strong key={i}>
          <span className="text-red-600 dark:text-red-500">{r.text}</span>
        </strong>
      );
    }
    if (r.bold) return <strong key={i}>{r.text}</strong>;
    if (isPlaceholder) {
      return (
        <span key={i} className="text-red-600 dark:text-red-500">
          {r.text}
        </span>
      );
    }
    return r.text;
  });
}

/**
 * Renders document content line by line, mirroring the layout rules in
 * lib/document-layout.ts (also applied by export-document.ts's docx/pdf
 * export) so the on-screen preview matches the exported file:
 * - the title (first non-empty line) is centered
 * - the next line, when it's a city/date pair, splits into a left-aligned
 *   city and a right-aligned date
 * - every other paragraph is justified
 * Consecutive lines containing tab characters (emitted by static templates
 * for itemized tables, e.g. invoice line items) render as a real HTML table
 * with aligned columns instead of raw tab characters running together.
 * `highlightPlaceholders` — see renderMarkdownBold — defaults to false so
 * only the custom-generation call site needs to opt in.
 */
export function renderDocumentBody(text: string, highlightPlaceholders = false): ReactNode[] {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  const titleIndex = findTitleIndex(lines);
  const headerIndex = findHeaderIndex(lines, titleIndex);
  const header = headerIndex >= 0 ? splitHeaderLine(lines[headerIndex]) : null;

  let i = 0;
  while (i < lines.length) {
    if (i === titleIndex) {
      out.push(
        <div key={`title-${i}`} className="text-center">
          {renderMarkdownBold(lines[i], highlightPlaceholders)}
        </div>
      );
      i++;
      continue;
    }
    if (i === headerIndex && header) {
      out.push(
        <div key={`header-${i}`} className="flex justify-between gap-4">
          <span>{renderMarkdownBold(header.left, highlightPlaceholders)}</span>
          <span>{renderMarkdownBold(header.right, highlightPlaceholders)}</span>
        </div>
      );
      i++;
      continue;
    }
    if (lines[i].includes("\t")) {
      const tableLines: string[] = [];
      const start = i;
      while (i < lines.length && lines[i].includes("\t")) {
        tableLines.push(lines[i]);
        i++;
      }
      out.push(
        <table key={`table-${start}`} className="w-full text-sm border-collapse my-2">
          <tbody>
            {tableLines.map((line, r) => (
              <tr key={r} className={r === 0 ? "font-medium border-b border-border" : "border-b border-border/40"}>
                {line.split("\t").map((cell, c) => (
                  <td key={c} className={`py-1 pr-4 align-top ${c > 0 ? "text-right" : "text-left"}`}>
                    {renderMarkdownBold(cell, highlightPlaceholders)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }
    if (lines[i].trim() === "") {
      out.push(<div key={`blank-${i}`}>&nbsp;</div>);
      i++;
      continue;
    }
    out.push(
      <div key={`line-${i}`} className="text-justify whitespace-pre-wrap">
        {renderMarkdownBold(lines[i], highlightPlaceholders)}
      </div>
    );
    i++;
  }
  return out;
}

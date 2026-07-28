import type { ReactNode } from "react";
import { findTitleIndex, findHeaderIndex, splitHeaderLine } from "@/lib/document-layout";

/** Renders the model's `**bold**` markdown as <strong> instead of literal asterisks. */
export function renderMarkdownBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    )
  );
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
 */
export function renderDocumentBody(text: string): ReactNode[] {
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
          {renderMarkdownBold(lines[i])}
        </div>
      );
      i++;
      continue;
    }
    if (i === headerIndex && header) {
      out.push(
        <div key={`header-${i}`} className="flex justify-between gap-4">
          <span>{renderMarkdownBold(header.left)}</span>
          <span>{renderMarkdownBold(header.right)}</span>
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
                    {renderMarkdownBold(cell)}
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
        {renderMarkdownBold(lines[i])}
      </div>
    );
    i++;
  }
  return out;
}

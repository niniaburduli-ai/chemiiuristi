/** Client-side .docx / .pdf export for generated documents. Parses the
 * model's `**bold**` markdown into real bold runs instead of literal asterisks,
 * and renders consecutive tab-separated lines (e.g. invoice line items) as
 * real tables instead of raw tab characters. When callers opt in via
 * `highlightPlaceholders` (only the "custom" free-form generation result
 * does — never document analysis/review), also colors `[missing-info
 * placeholder]` brackets red, matching the on-screen preview.
 *
 * Shared layout rules applied to every generated document (all doc types):
 * - line 1 (the title) is centered
 * - the next line, when it has a city/date pair (e.g. "ქ. CITY   DATE"), is
 *   split into a left-aligned city and a right-aligned date
 * - every other paragraph is justified with 1.5 line spacing
 */
"use client";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  LineRuleType,
  TabStopType,
  TabStopPosition,
} from "docx";
import { jsPDF } from "jspdf";
import { findTitleIndex, findHeaderIndex, splitHeaderLine, parseRuns, type TextSegment } from "@/lib/document-layout";

type Run = TextSegment;

/** Word hex (no `#`) matching the PDF's rgb(192,0,0) / the on-screen `text-red-600`. */
const PLACEHOLDER_COLOR_HEX = "C00000";
const PLACEHOLDER_COLOR_RGB: [number, number, number] = [192, 0, 0];

/** Parses a line into runs, clearing the `placeholder` flag unless the
 * caller explicitly opted in — see the module doc comment. */
function boldRuns(line: string, highlightPlaceholders: boolean): Run[] {
  const runs = parseRuns(line);
  return highlightPlaceholders ? runs : runs.map((r) => ({ ...r, placeholder: false }));
}

function docxTextRun(r: Run, extraBold = false): TextRun {
  return new TextRun({
    text: r.text,
    bold: r.bold || extraBold,
    color: r.placeholder ? PLACEHOLDER_COLOR_HEX : undefined,
  });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildDocxChildren(content: string, highlightPlaceholders: boolean): (Paragraph | Table)[] {
  const lines = content.split("\n");
  const children: (Paragraph | Table)[] = [];
  const titleIndex = findTitleIndex(lines);
  const headerIndex = findHeaderIndex(lines, titleIndex);
  const header = headerIndex >= 0 ? splitHeaderLine(lines[headerIndex]) : null;

  let i = 0;
  while (i < lines.length) {
    if (i === titleIndex) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: boldRuns(lines[i], highlightPlaceholders).map((r) => docxTextRun(r)),
        })
      );
      i++;
      continue;
    }
    if (i === headerIndex && header) {
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            ...boldRuns(header.left, highlightPlaceholders).map((r) => docxTextRun(r)),
            new TextRun({ text: "\t" }),
            ...boldRuns(header.right, highlightPlaceholders).map((r) => docxTextRun(r)),
          ],
        })
      );
      i++;
      continue;
    }
    if (lines[i].includes("\t")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("\t")) {
        tableLines.push(lines[i]);
        i++;
      }
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableLines.map(
            (line, r) =>
              new TableRow({
                children: line.split("\t").map(
                  (cell) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: boldRuns(cell, highlightPlaceholders).map((run) => docxTextRun(run, r === 0)),
                        }),
                      ],
                    })
                ),
              })
          ),
        })
      );
      children.push(new Paragraph({ text: "" }));
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, lineRule: LineRuleType.AUTO },
          children: lines[i]
            ? boldRuns(lines[i], highlightPlaceholders).map((r) => docxTextRun(r))
            : [new TextRun("")],
        })
      );
      i++;
    }
  }
  return children;
}

export async function exportAsDocx(content: string, filename: string, highlightPlaceholders = false) {
  const doc = new Document({
    sections: [
      {
        children: buildDocxChildren(content, highlightPlaceholders),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}

/** Sets font weight + text color for one run — every draw/measure call below
 * goes through this so a placeholder's red never leaks onto the next run. */
function setRunStyle(pdf: jsPDF, run: Run) {
  pdf.setFont("helvetica", run.bold ? "bold" : "normal");
  if (run.placeholder) pdf.setTextColor(...PLACEHOLDER_COLOR_RGB);
  else pdf.setTextColor(0, 0, 0);
}

function wordWidth(pdf: jsPDF, run: Run): number {
  setRunStyle(pdf, run);
  return pdf.getTextWidth(run.text);
}

/** Greedy word-wrap that keeps each word's bold/placeholder flags, so justify can still mix runs. */
function wrapRuns(pdf: jsPDF, runs: Run[], maxWidth: number): Run[][] {
  const words: Run[] = [];
  for (const run of runs) {
    for (const w of run.text.split(/\s+/).filter(Boolean)) {
      words.push({ text: w, bold: run.bold, placeholder: run.placeholder });
    }
  }
  pdf.setFont("helvetica", "normal");
  const spaceWidth = pdf.getTextWidth(" ");

  const lines: Run[][] = [];
  let current: Run[] = [];
  let currentWidth = 0;
  for (const word of words) {
    const w = wordWidth(pdf, word);
    const added = current.length ? spaceWidth + w : w;
    if (current.length && currentWidth + added > maxWidth) {
      lines.push(current);
      current = [word];
      currentWidth = w;
    } else {
      current.push(word);
      currentWidth += added;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

/** Draws one wrapped line, stretching inter-word gaps to fill maxWidth unless it's the paragraph's last line. */
function drawJustifiedLine(pdf: jsPDF, words: Run[], justify: boolean, x0: number, y: number, maxWidth: number) {
  if (words.length === 0) return;
  const widths = words.map((w) => wordWidth(pdf, w));
  const totalWordWidth = widths.reduce((a, b) => a + b, 0);
  pdf.setFont("helvetica", "normal");
  const normalSpaceWidth = pdf.getTextWidth(" ");
  const gap =
    justify && words.length > 1 ? (maxWidth - totalWordWidth) / (words.length - 1) : normalSpaceWidth;

  let x = x0;
  words.forEach((word, idx) => {
    setRunStyle(pdf, word);
    pdf.text(word.text, x, y);
    x += widths[idx] + gap;
  });
}

/** Draws a run sequence left-to-right starting at x0, returning the total width drawn. */
function drawRunsFrom(pdf: jsPDF, runs: Run[], x0: number, y: number): number {
  let x = x0;
  for (const run of runs) {
    setRunStyle(pdf, run);
    pdf.text(run.text, x, y);
    x += pdf.getTextWidth(run.text);
  }
  return x - x0;
}

function runsWidth(pdf: jsPDF, runs: Run[]): number {
  let total = 0;
  for (const run of runs) {
    setRunStyle(pdf, run);
    total += pdf.getTextWidth(run.text);
  }
  return total;
}

export function exportAsPdf(content: string, filename: string, highlightPlaceholders = false) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const marginTop = 56;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  const fontSize = 11;
  const lineHeight = fontSize * 1.5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);

  let y = marginTop;
  const lines = content.split("\n");
  const titleIndex = findTitleIndex(lines);
  const headerIndex = findHeaderIndex(lines, titleIndex);
  const header = headerIndex >= 0 ? splitHeaderLine(lines[headerIndex]) : null;

  let i = 0;
  while (i < lines.length) {
    if (i === titleIndex) {
      const wrapped = wrapRuns(pdf, boldRuns(lines[i], highlightPlaceholders), maxWidth);
      for (const words of wrapped) {
        if (y > pageHeight - marginTop) {
          pdf.addPage();
          y = marginTop;
        }
        const textWidths = words.map((w) => wordWidth(pdf, w));
        const total = textWidths.reduce((a, b) => a + b, 0) + pdf.getTextWidth(" ") * Math.max(words.length - 1, 0);
        drawJustifiedLine(pdf, words, false, marginX + (maxWidth - total) / 2, y, maxWidth);
        y += lineHeight;
      }
      i++;
      continue;
    }
    if (i === headerIndex && header) {
      if (y > pageHeight - marginTop) {
        pdf.addPage();
        y = marginTop;
      }
      const leftRuns = boldRuns(header.left, highlightPlaceholders);
      const rightRuns = boldRuns(header.right, highlightPlaceholders);
      drawRunsFrom(pdf, leftRuns, marginX, y);
      drawRunsFrom(pdf, rightRuns, pageWidth - marginX - runsWidth(pdf, rightRuns), y);
      y += lineHeight;
      i++;
      continue;
    }
    if (lines[i].includes("\t")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("\t")) {
        tableLines.push(lines[i]);
        i++;
      }
      const colCount = tableLines[0].split("\t").length;
      const firstColWidth = maxWidth * 0.4;
      const otherColWidth = (maxWidth - firstColWidth) / Math.max(colCount - 1, 1);
      for (let r = 0; r < tableLines.length; r++) {
        if (y > pageHeight - marginTop) {
          pdf.addPage();
          y = marginTop;
        }
        const cells = tableLines[r].split("\t");
        let x = marginX;
        pdf.setFont("helvetica", r === 0 ? "bold" : "normal");
        cells.forEach((cell, c) => {
          const w = c === 0 ? firstColWidth : otherColWidth;
          pdf.text(cell, x, y, { maxWidth: w - 4 });
          x += w;
        });
        y += lineHeight;
      }
      y += lineHeight * 0.5;
    } else {
      if (lines[i].trim() === "") {
        y += lineHeight;
        i++;
        continue;
      }
      const wrapped = wrapRuns(pdf, boldRuns(lines[i], highlightPlaceholders), maxWidth);
      for (let li = 0; li < wrapped.length; li++) {
        if (y > pageHeight - marginTop) {
          pdf.addPage();
          y = marginTop;
        }
        drawJustifiedLine(pdf, wrapped[li], li < wrapped.length - 1, marginX, y, maxWidth);
        y += lineHeight;
      }
      i++;
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

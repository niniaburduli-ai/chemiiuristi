/** Client-side .docx / .pdf export for generated documents. Parses the
 * model's `**bold**` markdown into real bold runs instead of literal asterisks,
 * and renders consecutive tab-separated lines (e.g. invoice line items) as
 * real tables instead of raw tab characters. */
"use client";

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from "docx";
import { jsPDF } from "jspdf";

function boldRuns(line: string): { text: string; bold: boolean }[] {
  return line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false }
    );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildDocxChildren(content: string): (Paragraph | Table)[] {
  const lines = content.split("\n");
  const children: (Paragraph | Table)[] = [];
  let i = 0;
  while (i < lines.length) {
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
                          children: boldRuns(cell).map(
                            (run) => new TextRun({ text: run.text, bold: run.bold || r === 0 })
                          ),
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
          children: lines[i] ? boldRuns(lines[i]).map((r) => new TextRun({ text: r.text, bold: r.bold })) : [new TextRun("")],
        })
      );
      i++;
    }
  }
  return children;
}

export async function exportAsDocx(content: string, filename: string) {
  const doc = new Document({
    sections: [
      {
        children: buildDocxChildren(content),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, filename.endsWith(".docx") ? filename : `${filename}.docx`);
}

export function exportAsPdf(content: string, filename: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const marginTop = 56;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  const lineHeight = 16;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  let y = marginTop;
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length) {
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
      const runs = lines[i] ? boldRuns(lines[i]) : [{ text: "", bold: false }];
      let x = marginX;
      for (const run of runs) {
        pdf.setFont("helvetica", run.bold ? "bold" : "normal");
        const wrapped = pdf.splitTextToSize(run.text, maxWidth - (x - marginX));
        for (let w = 0; w < wrapped.length; w++) {
          if (y > pageHeight - marginTop) {
            pdf.addPage();
            y = marginTop;
          }
          pdf.text(wrapped[w], x, y);
          if (w < wrapped.length - 1) {
            y += lineHeight;
            x = marginX;
          } else {
            x += pdf.getTextWidth(wrapped[w]);
          }
        }
      }
      y += lineHeight;
      i++;
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/** Client-side .docx / .pdf export for generated documents. Parses the
 * model's `**bold**` markdown into real bold runs instead of literal asterisks. */
"use client";

import { Document, Packer, Paragraph, TextRun } from "docx";
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

export async function exportAsDocx(content: string, filename: string) {
  const doc = new Document({
    sections: [
      {
        children: content.split("\n").map(
          (line) =>
            new Paragraph({
              children: line
                ? boldRuns(line).map((r) => new TextRun({ text: r.text, bold: r.bold }))
                : [new TextRun("")],
            })
        ),
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
  for (const rawLine of content.split("\n")) {
    const runs = rawLine ? boldRuns(rawLine) : [{ text: "", bold: false }];
    let x = marginX;
    for (const run of runs) {
      pdf.setFont("helvetica", run.bold ? "bold" : "normal");
      const wrapped = pdf.splitTextToSize(run.text, maxWidth - (x - marginX));
      for (let i = 0; i < wrapped.length; i++) {
        if (y > pageHeight - marginTop) {
          pdf.addPage();
          y = marginTop;
        }
        pdf.text(wrapped[i], x, y);
        if (i < wrapped.length - 1) {
          y += lineHeight;
          x = marginX;
        } else {
          x += pdf.getTextWidth(wrapped[i]);
        }
      }
    }
    y += lineHeight;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

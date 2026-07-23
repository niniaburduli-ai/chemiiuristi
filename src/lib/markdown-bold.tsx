import type { ReactNode } from "react";

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
 * Renders document content line by line. Consecutive lines containing tab
 * characters (emitted by static templates for itemized tables, e.g. invoice
 * line items) render as a real HTML table with aligned columns instead of
 * raw tab characters running together as text.
 */
export function renderDocumentBody(text: string): ReactNode[] {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
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
    } else {
      out.push(<span key={`line-${i}`}>{renderMarkdownBold(lines[i])}</span>);
      if (i < lines.length - 1) out.push(<br key={`br-${i}`} />);
      i++;
    }
  }
  return out;
}

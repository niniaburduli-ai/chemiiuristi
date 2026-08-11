import type { DiffSegment } from "@/lib/diff-text";
import { renderMarkdownBold } from "@/lib/markdown-bold";

export function TextDiff({ segments }: { segments: DiffSegment[] }) {
  return (
    <pre className="whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
      {segments.map((seg, i) => {
        if (seg.type === "added") {
          return (
            <span key={i} className="bg-green-500/20 text-green-800 dark:text-green-300 rounded-sm">
              {renderMarkdownBold(seg.text)}
            </span>
          );
        }
        if (seg.type === "removed") {
          return (
            <span
              key={i}
              className="bg-red-500/10 text-red-700 dark:text-red-400 line-through rounded-sm"
            >
              {renderMarkdownBold(seg.text)}
            </span>
          );
        }
        return <span key={i}>{renderMarkdownBold(seg.text)}</span>;
      })}
    </pre>
  );
}

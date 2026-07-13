import { diffWords } from "diff";

export type DiffSegment = { type: "same" | "added" | "removed"; text: string };

export function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  return diffWords(oldText ?? "", newText ?? "").map((part) => ({
    type: part.added ? "added" : part.removed ? "removed" : "same",
    text: part.value,
  }));
}

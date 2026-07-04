/** ~1800 chars (roughly 300 words) per printed A4 page for a standard legal doc. */
export function estimatePageCount(content: string): number {
  return Math.max(1, Math.ceil(content.trim().length / 1800));
}

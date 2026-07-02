export type RiskBadge = { label: string; className: string };

export function riskBadge(score: number | null | undefined): RiskBadge | null {
  if (score == null) return null;
  if (score >= 70) return { label: `🔴 ${score}/100`, className: "text-destructive border-destructive/30" };
  if (score >= 40) return { label: `🟡 ${score}/100`, className: "text-yellow-600 border-yellow-400/30" };
  return { label: `🟢 ${score}/100`, className: "text-green-600 border-green-400/30" };
}

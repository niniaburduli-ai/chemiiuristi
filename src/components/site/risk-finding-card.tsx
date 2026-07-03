import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskCategory, RiskFinding, RiskSeverity } from "@/lib/legal/document-analysis";

export function isStructuredFinding(f: unknown): f is RiskFinding {
  return typeof f === "object" && f !== null && "category" in f && "severity" in f;
}

const CATEGORY_LABELS: Record<"ka" | "en", Record<RiskCategory, string>> = {
  ka: {
    liability: "პასუხისმგებლობა და ჯარიმები",
    financial: "ფინანსური პირობები",
    termination: "შეწყვეტა და გაგრძელება",
    compliance: "სამართლებრივი შესაბამისობა",
    confidentiality: "მონაცემები და კონფიდენციალურობა",
    obligations: "ვალდებულებები და ვადები",
  },
  en: {
    liability: "Liability & Penalties",
    financial: "Financial Terms",
    termination: "Termination & Renewal",
    compliance: "Compliance & Legal",
    confidentiality: "Data & Confidentiality",
    obligations: "Obligations & Deadlines",
  },
};

const SEVERITY_LABELS: Record<"ka" | "en", Record<RiskSeverity, string>> = {
  ka: { low: "დაბალი", medium: "საშუალო", high: "მაღალი", critical: "კრიტიკული" },
  en: { low: "Low", medium: "Medium", high: "High", critical: "Critical" },
};

const SEVERITY_BORDER: Record<RiskSeverity, string> = {
  low: "border-t-green-500",
  medium: "border-t-yellow-500",
  high: "border-t-orange-500",
  critical: "border-t-destructive",
};

const SEVERITY_BADGE: Record<RiskSeverity, string> = {
  low: "bg-green-500/10 text-green-700 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

export function RiskFindingCard({
  finding,
  locale,
}: {
  finding: RiskFinding;
  locale: "ka" | "en";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 border-t-[3px]",
        SEVERITY_BORDER[finding.severity]
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant="outline" className={SEVERITY_BADGE[finding.severity]}>
          {SEVERITY_LABELS[locale][finding.severity]}
        </Badge>
        <Badge variant="secondary">{CATEGORY_LABELS[locale][finding.category]}</Badge>
      </div>
      <p className="font-semibold text-sm text-foreground">{finding.title}</p>
      {finding.explanation && (
        <p className="text-sm text-muted-foreground mt-1">{finding.explanation}</p>
      )}
      {finding.recommendation && (
        <p className="text-sm mt-2 flex items-start gap-1.5">
          <span className="font-semibold text-primary shrink-0">→</span>
          <span>{finding.recommendation}</span>
        </p>
      )}
    </div>
  );
}

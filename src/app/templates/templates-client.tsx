"use client";

import { useState } from "react";
import { FileText, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubPageHeader } from "@/components/site/SubPageHeader";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { COMMON_FIELDS, QUESTION_SCHEMAS } from "@/lib/legal/document-fields";
import { DocumentResultPanel, type DocumentResult } from "@/components/site/DocumentResultPanel";
import { UpgradeRequiredDialog } from "@/components/site/upgrade-required-dialog";

type LineItemRow = { desc: string; qty: string; price: string };

/** Invoice "items" answer is stored as "desc;qty;price" lines (parsed by
 * buildInvoiceItemsTable in lib/legal/templates.ts) — this UI edits that same
 * string as separate name/quantity/price columns instead of raw text. */
function parseItemRows(raw: string): LineItemRow[] {
  const rows = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [desc = "", qty = "", price = ""] = line.split(";").map((p) => p.trim());
      return { desc, qty, price };
    });
  return rows.length > 0 ? rows : [{ desc: "", qty: "", price: "" }];
}

function serializeItemRows(rows: LineItemRow[]): string {
  return rows
    .filter((r) => r.desc.trim() || r.qty.trim() || r.price.trim())
    .map((r) => `${r.desc};${r.qty};${r.price}`)
    .join("\n");
}

const QUOTA_STRINGS = {
  title: "კრედიტები ამოწურულია",
  body: "თქვენ გამოწურეთ ამ სერვისის უფასო კრედიტები. გასაგრძელებლად გთხოვთ განაახლოთ პაკეტი.",
  upgradeCta: "გეგმის განახლება",
  close: "დახურვა",
};

export const TEMPLATE_DOC_TYPES = [
  { value: "rental-agreement", label: "ქირავნობის ხელშეკრულება" },
  { value: "employment-contract", label: "შრომის ხელშეკრულება" },
  { value: "service-agreement", label: "მომსახურების ხელშეკრულება" },
  { value: "power-of-attorney", label: "მინდობილობა" },
  { value: "termination-notice", label: "სამსახურიდან გათავისუფლება" },
  { value: "claim-letter", label: "წერილი-პრეტენზია" },
  { value: "debt-claim", label: "დავალიანების დაფარვის მოთხოვნა" },
  { value: "child-travel-consent", label: "თანხმობა არასრულწლოვნის საზღვარგარეთ გაყვანაზე" },
  { value: "invoice", label: "ინვოისი" },
  { value: "acceptance-act", label: "მიღება-ჩაბარების აქტი" },
];

export function TemplatesClient({ initialType }: { initialType?: string } = {}) {
  const [type, setType] = useState(
    initialType && QUESTION_SCHEMAS[initialType] ? initialType : "rental-agreement"
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const fields = [...COMMON_FIELDS, ...(QUESTION_SCHEMAS[type] ?? [])];
  const missingRequired = fields.filter((f) => f.required && !answers[f.key]?.trim());

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function fill() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setQuotaExceeded(true);
          return;
        }
        setError(data.error ?? "შეცდომა");
        return;
      }
      setResult(data);
      toast.success("დოკუმენტი შეივსო");
    } catch {
      setError("სერვისთან კავშირი ვერ დამყარდა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <SubPageHeader
        backHref="/services?tab=templatesFill"
        icon={<FileText className="h-5 w-5 text-gold" />}
        title="მზა შაბლონები"
        subtitle="შეავსე ველები — დოკუმენტი მზადდება მყისიერად, AI-ს გარეშე"
      />

      <div className="grid gap-6 lg:grid-cols-[460px_1fr] items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">შაბლონის ტიპი და დეტალები</CardTitle>
            <CardDescription>აირჩიე ტიპი და შეავსე მონაცემები</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[8rem_1fr] gap-3 items-center">
              <Label htmlFor="template-type">დოკუმენტის ტიპი</Label>
              <select
                id="template-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setAnswers({});
                  setResult(null);
                }}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TEMPLATE_DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {fields.map((f) => {
              if (f.key === "items") {
                const rows = parseItemRows(answers.items ?? "");
                const updateRow = (idx: number, patch: Partial<LineItemRow>) => {
                  const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
                  setAnswer("items", serializeItemRows(next));
                };
                const addRow = () => setAnswer("items", serializeItemRows([...rows, { desc: "", qty: "", price: "" }]));
                const removeRow = (idx: number) => {
                  const next = rows.filter((_, i) => i !== idx);
                  setAnswer("items", serializeItemRows(next.length ? next : [{ desc: "", qty: "", price: "" }]));
                };
                return (
                  <div key={f.key} className="grid grid-cols-[8rem_1fr] gap-3 items-start">
                    <Label className="pt-2">{f.label}</Label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_5rem_6rem_1.75rem] gap-2 px-0.5 text-xs text-muted-foreground">
                        <span>დასახელება</span>
                        <span>რაოდ.</span>
                        <span>ერთ. ფასი</span>
                        <span />
                      </div>
                      <div className="space-y-2">
                        {rows.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_5rem_6rem_1.75rem] gap-2">
                            <Input
                              value={row.desc}
                              onChange={(e) => updateRow(idx, { desc: e.target.value })}
                            />
                            <Input
                              value={row.qty}
                              onChange={(e) => updateRow(idx, { qty: e.target.value })}
                            />
                            <Input
                              value={row.price}
                              onChange={(e) => updateRow(idx, { price: e.target.value })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-7"
                              disabled={rows.length <= 1}
                              onClick={() => removeRow(idx)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addRow}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> პოზიციის დამატება
                      </Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={f.key} className="grid grid-cols-[8rem_1fr] gap-3 items-start">
                  <Label htmlFor={`field-${f.key}`} className="pt-2">{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={`field-${f.key}`}
                      value={answers[f.key] ?? ""}
                      onChange={(e) => setAnswer(f.key, e.target.value)}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <Input
                      id={`field-${f.key}`}
                      type={f.type}
                      value={answers[f.key] ?? ""}
                      onChange={(e) => setAnswer(f.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}

            {missingRequired.length > 0 && (
              <p className="text-xs text-muted-foreground">
                შესავსებია: {missingRequired.map((f) => f.label).join(", ")}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={fill} disabled={loading || missingRequired.length > 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ივსება...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  შექმენი დოკუმენტი
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <DocumentResultPanel
          key={result?.id ?? "empty"}
          result={result}
          setResult={setResult}
          emptyHint={<>შეავსე დეტალები და დააჭირე „შექმენი დოკუმენტი”</>}
        />
      </div>
      <UpgradeRequiredDialog open={quotaExceeded} onOpenChange={setQuotaExceeded} strings={QUOTA_STRINGS} />
    </div>
  );
}

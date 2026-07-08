# Service Split Phase 3: Frontend Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the shared result/edit/export panel and field-schema data out of `generate-client.tsx`, narrow `/generate` to `complaint`/`demand-letter` only, and build the new `/templates` page for the 4 static-template types — reusing the extracted pieces so nothing is duplicated between the two pages.

**Architecture:** `src/lib/legal/document-fields.ts` becomes the single source of truth for all 6 document types' form field schemas (both pages import from it, each defining its own narrower `DOC_TYPES` UI list). `src/components/site/DocumentResultPanel.tsx` becomes the single result/edit/export UI, fully self-contained (it already has everything it needs from `result` alone — the existing `/api/generate/[id]` PATCH endpoint is content-only and not type-specific, confirmed by reading it, so it works unchanged for template-sourced documents saved to the same `GeneratedDocument` collection).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind + shadcn/ui. No test runner — verify via `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual browser testing (`npm run dev`).

## Global Constraints

- Depends on Phase 1 (`docTemplatesRemaining`, `templates` feature flag) and Phase 2 (`POST /api/templates`, `renderTemplate`) being merged first.
- `DocumentResultPanel` must render identically to today's `/generate` result panel — this is a refactor (extraction), not a redesign. No visual/behavioral change to `/generate`'s existing result UI.
- The 4 template types keep their exact existing field labels/keys from today's `QUESTION_SCHEMAS` — `/templates` and `/generate` must produce byte-identical form UX for any type they both used to share access to (moving, not rewriting).
- `/api/generate/[id]` PATCH stays untouched and generic (content-only) — do not add a type-specific branch to it; that genericity is what lets one shared component serve both pages.

---

### Task 1: Shared document-fields module

**Files:**
- Create: `src/lib/legal/document-fields.ts`
- Modify: `src/app/generate/generate-client.tsx` (remove the moved definitions, import from the new module instead — see Task 4, not duplicated here)

**Interfaces:**
- Produces: `FieldType`, `QuestionField`, `COMMON_FIELDS: QuestionField[]`, `QUESTION_SCHEMAS: Record<string, QuestionField[]>` (all 6 document types, unchanged content) — consumed by Task 4 (`/generate`) and Task 6 (`/templates`).

- [ ] **Step 1: Create the module (exact move, zero content changes)**

```ts
/**
 * Form field schemas for every document type across BOTH document-producing
 * pages (/generate for AI-drafted complaint/demand-letter, /templates for
 * the 4 static types). Single source of truth so the two pages never drift
 * on field keys/labels for a type they both reference.
 */

export type FieldType = "text" | "textarea" | "date";
export type QuestionField = { key: string; label: string; type: FieldType; required?: boolean };

export const COMMON_FIELDS: QuestionField[] = [
  { key: "city", label: "ქალაქი", type: "text", required: true },
  { key: "docDate", label: "დოკუმენტის თარიღი", type: "date", required: true },
];

export const QUESTION_SCHEMAS: Record<string, QuestionField[]> = {
  complaint: [
    { key: "yourName", label: "შენი სახელი და გვარი", type: "text", required: true },
    { key: "yourId", label: "შენი პირადი ნომერი", type: "text", required: true },
    { key: "yourAddress", label: "შენი მისამართი", type: "text", required: true },
    { key: "respondent", label: "ვის ეხება საჩივარი", type: "text", required: true },
    { key: "amount", label: "თანხა/ზიანი (ასეთის არსებობისას)", type: "text" },
    { key: "paymentMethod", label: "გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა) — თანხის მოთხოვნისას", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვას ითხოვ)", type: "text" },
    { key: "incidentDate", label: "მოვლენის თარიღი", type: "date" },
  ],
  "rental-agreement": [
    { key: "landlord", label: "გამქირავებელი (სახელი, გვარი)", type: "text", required: true },
    { key: "landlordId", label: "გამქირავებლის პირადი ნომერი", type: "text", required: true },
    { key: "landlordAddress", label: "გამქირავებლის მისამართი", type: "text", required: true },
    { key: "landlordPhone", label: "გამქირავებლის ტელეფონი", type: "text" },
    { key: "tenant", label: "დამქირავებელი (სახელი, გვარი)", type: "text", required: true },
    { key: "tenantId", label: "დამქირავებლის პირადი ნომერი", type: "text", required: true },
    { key: "tenantAddress", label: "დამქირავებლის მისამართი", type: "text", required: true },
    { key: "tenantPhone", label: "დამქირავებლის ტელეფონი", type: "text" },
    { key: "address", label: "ბინის მისამართი", type: "text", required: true },
    { key: "rent", label: "ქირის ოდენობა", type: "text", required: true },
    { key: "paymentMethod", label: "ქირის გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", type: "text", required: true },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვაა)", type: "text" },
    { key: "duration", label: "ხელშეკრულების ვადა", type: "text", required: true },
  ],
  "employment-contract": [
    { key: "employer", label: "დამსაქმებელი", type: "text", required: true },
    { key: "employerId", label: "დამსაქმებლის საიდენტიფიკაციო/პირადი ნომერი", type: "text", required: true },
    { key: "employerAddress", label: "დამსაქმებლის მისამართი", type: "text", required: true },
    { key: "employee", label: "თანამშრომელი", type: "text", required: true },
    { key: "employeeId", label: "თანამშრომლის პირადი ნომერი", type: "text", required: true },
    { key: "employeeAddress", label: "თანამშრომლის მისამართი", type: "text", required: true },
    { key: "position", label: "პოზიცია", type: "text", required: true },
    { key: "salary", label: "ხელფასი", type: "text", required: true },
    { key: "salaryPaymentMethod", label: "ხელფასის გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", type: "text", required: true },
    { key: "bankAccount", label: "თანამშრომლის საბანკო ანგარიშის № (თუ გადარიცხვაა)", type: "text" },
    { key: "startDate", label: "დაწყების თარიღი", type: "date", required: true },
  ],
  "power-of-attorney": [
    { key: "principal", label: "მინდობელი", type: "text", required: true },
    { key: "idNumber", label: "მინდობელის პირადი ნომერი", type: "text", required: true },
    { key: "principalAddress", label: "მინდობელის მისამართი", type: "text", required: true },
    { key: "agent", label: "მინდობილი პირი", type: "text", required: true },
    { key: "agentId", label: "მინდობილი პირის პირადი ნომერი", type: "text", required: true },
    { key: "agentAddress", label: "მინდობილი პირის მისამართი", type: "text", required: true },
    { key: "scope", label: "მინდობის ფარგლები", type: "textarea", required: true },
  ],
  "demand-letter": [
    { key: "yourName", label: "შენი სახელი და გვარი", type: "text", required: true },
    { key: "yourAddress", label: "შენი მისამართი", type: "text", required: true },
    { key: "recipient", label: "ადრესატი", type: "text", required: true },
    { key: "amount", label: "მოთხოვნილი თანხა", type: "text" },
    { key: "paymentMethod", label: "გადახდის სასურველი მეთოდი (ნაღდი/საბანკო გადარიცხვა)", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვას ითხოვ)", type: "text" },
    { key: "reason", label: "მოთხოვნის საფუძველი", type: "textarea", required: true },
    { key: "deadline", label: "ვადა", type: "text", required: true },
  ],
  "termination-notice": [
    { key: "employer", label: "დამსაქმებელი", type: "text", required: true },
    { key: "employee", label: "თანამშრომელი", type: "text", required: true },
    { key: "employeeId", label: "თანამშრომლის პირადი ნომერი", type: "text", required: true },
    { key: "employeeAddress", label: "თანამშრომლის მისამართი", type: "text", required: true },
    { key: "reason", label: "საფუძველი", type: "text", required: true },
    { key: "lastDay", label: "ბოლო სამუშაო დღე", type: "date", required: true },
  ],
};
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected clean (this module isn't imported anywhere yet, so it's inert until Task 4/6).

- [ ] **Step 3: Commit**

```bash
git add src/lib/legal/document-fields.ts
git commit -m "refactor: extract shared document field schemas into their own module"
```

---

### Task 2: Shared `DocumentResultPanel` component

**Files:**
- Create: `src/components/site/DocumentResultPanel.tsx`

**Interfaces:**
- Produces: `DocumentResultData = { id: string; title: string; content: string; legalBasis?: string }`, `DocumentResultPanel({ result, emptyStateHint }: { result: DocumentResultData | null; emptyStateHint: string })` — consumed by Task 4 (`/generate`) and Task 6 (`/templates`).
- Consumes: `parseDocumentLegalBasis` (`@/lib/legal/citations`), `exportAsDocx`/`exportAsPdf` (`@/lib/export-document`), `estimatePageCount` (`@/lib/page-count`), `renderMarkdownBold` (`@/lib/markdown-bold`) — all pre-existing, unchanged.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useRef, useState } from "react";
import { Copy, Download, Eye, Maximize2, BookOpen, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { renderMarkdownBold } from "@/lib/markdown-bold";
import { parseDocumentLegalBasis } from "@/lib/legal/citations";
import { exportAsDocx, exportAsPdf } from "@/lib/export-document";
import { estimatePageCount } from "@/lib/page-count";

export type DocumentResultData = { id: string; title: string; content: string; legalBasis?: string };

function normalizeSpacing(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

/**
 * Shared result/preview/edit/export panel for any generated document.
 * Works for both AI-drafted (/api/generate) and static-template
 * (/api/templates) results — both save to the same GeneratedDocument
 * collection, and /api/generate/[id]'s PATCH is content-only (not
 * type-specific), so editing works identically regardless of source.
 * Pass `key={result?.id ?? "empty"}` from the parent so switching to a
 * different result resets internal edit state cleanly.
 */
export function DocumentResultPanel({
  result,
  emptyStateHint,
}: {
  result: DocumentResultData | null;
  emptyStateHint: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(result?.content ?? "");
  const [previewOpen, setPreviewOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!result) {
    return (
      <Card className="flex items-center justify-center min-h-[300px] border-dashed">
        <CardContent className="text-center text-muted-foreground text-sm py-12">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
          {emptyStateHint}
        </CardContent>
      </Card>
    );
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const pageCount = estimatePageCount(content);

  function copy() {
    navigator.clipboard.writeText(content);
    toast.success("კოპირებულია");
  }

  async function saveContent(newContent: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/generate/${result!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) toast.error("ცვლილება ვერ შენახულა");
    } catch {
      toast.error("ცვლილება ვერ შენახულა");
    } finally {
      setSaving(false);
    }
  }

  function scheduleSave(newContent: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveContent(newContent), 1000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">{result.title}</CardTitle>
              <CardDescription>
                დოკუმენტი შეიქმნა და შენახულია ანგარიშში · {wordCount} სიტყვა · ~{pageCount} გვერდი
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing((e) => !e)}>
                {editing ? (
                  <><Eye className="h-4 w-4 mr-1" /> მზა ტექსტი</>
                ) : (
                  <><Pencil className="h-4 w-4 mr-1" /> რედაქტირება</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="h-4 w-4 mr-1" /> კოპირება
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" /> ჩამოტვირთვა
                    </Button>
                  }
                />
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportAsDocx(content, result.title)}>
                    Word (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportAsPdf(content, result.title)}>
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Maximize2 className="h-4 w-4 mr-1" /> სრულ ეკრანზე
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <Textarea
              value={content}
              onChange={(e) => {
                const next = e.target.value;
                setContent(next);
                scheduleSave(next);
              }}
              onBlur={() => {
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                saveContent(content);
              }}
              className="min-h-[70vh] font-mono text-sm"
            />
          ) : (
            <div className="text-sm whitespace-pre-wrap bg-muted/40 rounded p-4 leading-relaxed max-h-[70vh] overflow-y-auto">
              {renderMarkdownBold(normalizeSpacing(content))}
            </div>
          )}
          {saving && <p className="text-xs text-muted-foreground mt-2">ინახება...</p>}
        </CardContent>
      </Card>

      {result.legalBasis?.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> სამართლებრივი საფუძვლები და წყაროები
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parseDocumentLegalBasis(result.legalBasis).map((g, i) => (
              <div key={`${g.lawName}|${i}`} className="space-y-1">
                {g.lawName && <p className="text-sm font-medium">{g.lawName}</p>}
                {g.articles.length > 0 && (
                  <ul className="ml-1 space-y-0.5">
                    {g.articles.map((a, j) => (
                      <li key={j} className="text-xs text-muted-foreground">
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{result.title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {renderMarkdownBold(normalizeSpacing(content))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> ჩამოტვირთვა
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportAsDocx(content, result.title)}>
                  Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsPdf(content, result.title)}>
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected clean (unused until Task 4).

- [ ] **Step 3: Commit**

```bash
git add src/components/site/DocumentResultPanel.tsx
git commit -m "refactor: extract shared DocumentResultPanel component"
```

---

### Task 3: Narrow `/generate`'s validators to complaint + demand-letter

**Files:**
- Modify: `src/lib/validators.ts:68-90`

**Interfaces:**
- Produces: `DOC_TYPES` (2 entries only), `DocType`, `GenerateDocSchema` (2-value enum) — consumed by `src/app/api/generate/route.ts` (unchanged import) and Task 4.

- [ ] **Step 1: Narrow the type list and schema**

Current (lines 68-90):
```ts
export const DOC_TYPES = {
  complaint: "საჩივარი",
  "rental-agreement": "ქირავნობის ხელშეკრულება",
  "employment-contract": "შრომის ხელშეკრულება",
  "power-of-attorney": "მინდობილობა",
  "demand-letter": "სამართლებრივი მოთხოვნა",
  "termination-notice": "სამსახურიდან გათავისუფლება",
} as const;

export type DocType = keyof typeof DOC_TYPES;

export const GenerateDocSchema = z.object({
  type: z.enum([
    "complaint",
    "rental-agreement",
    "employment-contract",
    "power-of-attorney",
    "demand-letter",
    "termination-notice",
  ]),
  details: z.string().min(10).max(2000),
});
export type GenerateDocInput = z.infer<typeof GenerateDocSchema>;
```

Replace with:
```ts
// Narrowed to the 2 types that genuinely need AI drafting (fixed-structure
// types moved to /api/templates — see src/lib/legal/templates.ts).
export const DOC_TYPES = {
  complaint: "საჩივარი",
  "demand-letter": "სამართლებრივი მოთხოვნა",
} as const;

export type DocType = keyof typeof DOC_TYPES;

export const GenerateDocSchema = z.object({
  type: z.enum(["complaint", "demand-letter"]),
  details: z.string().min(10).max(2000),
});
export type GenerateDocInput = z.infer<typeof GenerateDocSchema>;
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected type errors in `generate-client.tsx` at this point (its own local `DOC_TYPES`/`QUESTION_SCHEMAS` still reference the removed 4 types) — that's expected and fixed by Task 4 next. Do not attempt to fix generate-client.tsx here; Task 3 and Task 4 are split for reviewability but land together in practice.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat: narrow /api/generate to complaint and demand-letter only"
```

---

### Task 4: Rewrite `/generate`'s client to use shared modules + narrowed types

**Files:**
- Modify: `src/app/generate/generate-client.tsx` (full-file rewrite)

**Interfaces:**
- Consumes: `COMMON_FIELDS`, `QUESTION_SCHEMAS`, `QuestionField` (Task 1), `DocumentResultPanel`, `DocumentResultData` (Task 2), narrowed `GenerateDocSchema`/`DOC_TYPES` (Task 3, via the existing `/api/generate` route — no direct import needed, the client posts `{type, details}` same as before).

- [ ] **Step 1: Replace the full file**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { DocumentResultPanel, type DocumentResultData } from "@/components/site/DocumentResultPanel";

// Narrowed to the 2 types that genuinely need AI drafting — see
// src/lib/validators.ts's GenerateDocSchema for the server-side mirror, and
// src/app/templates for the other 4 (static, no-AI) types.
export const DOC_TYPES = [
  { value: "complaint", label: "საჩივარი" },
  { value: "demand-letter", label: "სამართლებრივი მოთხოვნა" },
];

export function GenerateClient({ initialType }: { initialType?: string } = {}) {
  const validTypes = new Set(DOC_TYPES.map((t) => t.value));
  const [type, setType] = useState(
    initialType && validTypes.has(initialType) ? initialType : "complaint"
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = [...COMMON_FIELDS, ...(QUESTION_SCHEMAS[type] ?? [])];

  function buildDetails(): string {
    const lines = fields
      .map((f) => (answers[f.key]?.trim() ? `${f.label}: ${answers[f.key].trim()}` : null))
      .filter((line): line is string => line !== null);
    if (extra.trim()) lines.push(extra.trim());
    return lines.join("\n");
  }

  const details = buildDetails();
  const missingRequired = fields.filter((f) => f.required && !answers[f.key]?.trim());

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function generate() {
    if (details.trim().length < 10) {
      toast.error("შეავსე მინიმუმ ერთი ველი დეტალური ინფორმაციით");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, details }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "შეცდომა");
        return;
      }
      setResult(data);
      toast.success("დოკუმენტი შეიქმნა");
    } catch {
      setError("სერვისთან კავშირი ვერ დამყარდა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> დოკუმენტის გენერაცია
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI ქმნის სრულ ქართულ იურიდიულ დოკუმენტს
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 mb-6 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>ხელშეკრულება შეინახება ისტორიაში 1 თვის ვადით, რის შემდეგაც ავტომატურად წაიშლება.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">დოკუმენტის ტიპი და დეტალები</CardTitle>
            <CardDescription>
              აირჩიე ტიპი და შეავსე ცნობილი დეტალები
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-type">დოკუმენტის ტიპი</Label>
              <select
                id="doc-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setAnswers({});
                  setExtra("");
                  setResult(null);
                }}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`field-${f.key}`}>{f.label}</Label>
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
            ))}

            <div className="space-y-2">
              <Label htmlFor="extra">დამატებითი დეტალები</Label>
              <Textarea
                id="extra"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="დაამატე ნებისმიერი სხვა მნიშვნელოვანი დეტალი"
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">{details.length} / 2000 სიმბოლო</p>
            </div>

            {missingRequired.length > 0 && (
              <p className="text-xs text-muted-foreground">
                შესავსებია: {missingRequired.map((f) => f.label).join(", ")}
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button onClick={generate} disabled={loading || missingRequired.length > 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  იქმნება...
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
          emptyStateHint='შეავსე დეტალები და დააჭირე „შექმენი დოკუმენტი"'
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint` — expected clean (this resolves the transient errors from Task 3).

- [ ] **Step 3: Manual check**

`npm run dev`, visit `/generate`, confirm: only "საჩივარი" and "სამართლებრივი მოთხოვნა" appear in the type dropdown, generating a complaint still works end-to-end (form → AI draft → result panel → edit → save → export .docx/.pdf → fullscreen preview), and visiting `/generate?type=rental-agreement` (an old bookmark/link to a now-removed type) falls back to "complaint" instead of erroring.

- [ ] **Step 4: Commit**

```bash
git add src/app/generate/generate-client.tsx
git commit -m "refactor: generate-client uses shared field schemas and result panel"
```

---

### Task 5: Tag AI-drafted documents with `source: "ai"`

**Files:**
- Modify: `src/app/api/generate/route.ts` (the `GeneratedDocument.create({...})` call)

**Interfaces:**
- Consumes: `GeneratedDocumentDoc.source` (Phase 1 Task 2).

- [ ] **Step 1: Add the field**

Find the existing `GeneratedDocument.create({ userId, title, type: parsed.data.type, content, legalBasis })` call (per Phase 1's research, this is around line 122 of the file) and add `source: "ai"`:

```ts
    const doc = await GeneratedDocument.create({
      userId: session.user.id,
      title,
      type: parsed.data.type,
      content,
      legalBasis,
      source: "ai",
    });
```

(Match the exact existing variable names in the surrounding code — this is additive, adjust only the object literal passed to `.create()`, nothing else in the route changes.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected clean. Manually generate a complaint via `/generate`, then check the new `GeneratedDocument` row in Mongo has `source: "ai"`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: tag AI-drafted documents with source: ai"
```

---

### Task 6: New `/templates` page

**Files:**
- Create: `src/app/templates/page.tsx`
- Create: `src/app/templates/templates-client.tsx`

**Interfaces:**
- Consumes: `COMMON_FIELDS`, `QUESTION_SCHEMAS` (Task 1), `DocumentResultPanel`, `DocumentResultData` (Task 2), `TEMPLATE_TYPES`, `TemplateType` (Phase 2 Task 1), `POST /api/templates` (Phase 2 Task 2).

- [ ] **Step 1: Create the client component**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { DocumentResultPanel, type DocumentResultData } from "@/components/site/DocumentResultPanel";
import { TEMPLATE_TYPES, type TemplateType } from "@/lib/legal/templates";

const DOC_TYPES = (Object.keys(TEMPLATE_TYPES) as TemplateType[]).map((value) => ({
  value,
  label: TEMPLATE_TYPES[value],
}));

export function TemplatesClient({ initialType }: { initialType?: string } = {}) {
  const validTypes = new Set(DOC_TYPES.map((t) => t.value));
  const [type, setType] = useState<TemplateType>(
    initialType && validTypes.has(initialType) ? (initialType as TemplateType) : DOC_TYPES[0].value
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = [...COMMON_FIELDS, ...(QUESTION_SCHEMAS[type] ?? [])];
  const missingRequired = fields.filter((f) => f.required && !answers[f.key]?.trim());

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function generate() {
    if (missingRequired.length > 0) {
      toast.error("შეავსე ყველა სავალდებულო ველი");
      return;
    }
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
        setError(data.error ?? "შეცდომა");
        return;
      }
      setResult(data);
      toast.success("დოკუმენტი მზადაა");
    } catch {
      setError("სერვისთან კავშირი ვერ დამყარდა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> დოკუმენტის შაბლონები
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            შეავსე ველები — დოკუმენტი მზადდება მყისიერად, AI-ის გარეშე
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
        <Card className="lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">შაბლონის ტიპი და დეტალები</CardTitle>
            <CardDescription>აირჩიე შაბლონი და შეავსე ველები</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-type">შაბლონის ტიპი</Label>
              <select
                id="template-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TemplateType);
                  setAnswers({});
                  setResult(null);
                }}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`field-${f.key}`}>{f.label}</Label>
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
            ))}

            {missingRequired.length > 0 && (
              <p className="text-xs text-muted-foreground">
                შესავსებია: {missingRequired.map((f) => f.label).join(", ")}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={generate} disabled={loading || missingRequired.length > 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  მზადდება...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  დოკუმენტის შექმნა
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <DocumentResultPanel
          key={result?.id ?? "empty"}
          result={result}
          emptyStateHint='შეავსე ველები და დააჭირე „დოკუმენტის შექმნა"'
        />
      </div>
    </div>
  );
}
```

Note: no `extra`/`buildDetails()`/character-count logic here — unlike `/generate`, `/api/templates` takes the raw `answers` object directly (no free-text blob for an AI to parse), so that entire layer of `/generate`'s client doesn't apply here. This is intentionally NOT identical to `generate-client.tsx` beyond the parts that generalize (field rendering, result panel) — the request-building logic is genuinely different because the backend contract is different (Phase 2 Task 2).

- [ ] **Step 2: Create the page**

`src/app/generate/page.tsx` (the pattern to mirror) is, in full:
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeatureFlags } from "@/lib/features";
import { GenerateClient } from "./generate-client";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function GeneratePage({ searchParams }: Props) {
  const [session, flags, { type }] = await Promise.all([auth(), getFeatureFlags(), searchParams]);
  if (!flags.generate) redirect("/");
  if (!session?.user?.id) redirect("/login?callbackUrl=/generate");
  return <GenerateClient initialType={type} />;
}
```

Create `src/app/templates/page.tsx` as the same shape, gated on the new `templates` flag (Phase 1 Task 7) instead of `generate`:
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeatureFlags } from "@/lib/features";
import { TemplatesClient } from "./templates-client";

type Props = { searchParams: Promise<{ type?: string }> };

export default async function TemplatesPage({ searchParams }: Props) {
  const [session, flags, { type }] = await Promise.all([auth(), getFeatureFlags(), searchParams]);
  if (!flags.templates) redirect("/");
  if (!session?.user?.id) redirect("/login?callbackUrl=/templates");
  return <TemplatesClient initialType={type} />;
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint` — expected clean.

- [ ] **Step 4: Manual check**

`npm run dev`, visit `/templates`, confirm: all 4 template types selectable, filling required fields and submitting produces an instant result (no loading delay beyond the network round-trip — no AI "drafting" wait), the result panel's edit/copy/export/fullscreen all work identically to `/generate`'s, and `docTemplatesRemaining` visibly decrements (check via `/api/user/me` in devtools, dashboard card comes in Phase 4). Also confirm leaving an optional field blank (e.g. `landlordPhone`) renders `—` in the output, not a blank or bracket.

- [ ] **Step 5: Commit**

```bash
git add src/app/templates
git commit -m "feat: add /templates page for static document generation"
```

---

### Task 7: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: all clean.

- [ ] **Step 2: Manual regression across both pages**

Confirm `/generate` (complaint + demand-letter, AI path) and `/templates` (4 static types) both work end-to-end, independently, with their own quota counters (`docGenerationRemaining` vs `docTemplatesRemaining`) decrementing correctly and not affecting each other.

- [ ] **Step 3: Report back**

Confirm to the user: `/generate` is narrower now (2 AI types), `/templates` is live (4 instant types), both share the same polished result/edit/export UI, and the next phase (nav, dashboard, pricing, admin) is what surfaces this to users outside of directly visiting `/templates`.

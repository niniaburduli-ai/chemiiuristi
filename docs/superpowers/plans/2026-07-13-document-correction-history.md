# Document Correction, Diff View, Download & Correspondence History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing document-correction flow visible end-to-end (shorter risk text, colored diff, download, full history) and add a "view previous correspondence" panel plus tab-switch state persistence to the AI consultation chat.

**Architecture:** Reuse the existing `DocumentReview.revisions[]` data (no new model). Add one pure diff-computation helper used both live (in the correction modal) and historically (in the dashboard reviews page). Add one new read-only API route (`GET /api/consultations`) so client components can fetch past Q&A. Fix `/services` tab switching to hide-not-unmount so component state survives.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui (`Sheet`, `Dialog`, `Button`, `Textarea`), Mongoose, the `diff` npm package (new dependency).

## Global Constraints

- No test runner is configured in this repo (see CLAUDE.md) — every task's verification step is `npx tsc --noEmit -p .`, `npm run lint`, and where noted, a manual check (curl or a described click-through), NOT an automated test file.
- Follow existing i18n pattern: `documentAnalysis` dict block (ka at `src/lib/i18n/dictionaries.ts:276`, en at `:629`) is used by the live modal; `dashboard/reviews/page.tsx` is plain hardcoded Georgian today (no `getDict`) — new additions there must match that existing convention, not introduce `getDict` there.
- Downloads must be the clean final text (no diff markup baked in) — diff coloring is in-app only.
- Diff always compares a revision against its immediate predecessor (`revisions[i-1]?.text ?? sourceText`), never against the original for later rounds.
- No changes to quota/billing logic in `/api/review/improve` (stays 1 credit/round).

---

### Task 1: Diff engine

**Files:**
- Modify: `package.json` (add `diff` dependency)
- Create: `src/lib/diff-text.ts`

**Interfaces:**
- Produces: `export type DiffSegment = { type: "same" | "added" | "removed"; text: string }` and `export function computeWordDiff(oldText: string, newText: string): DiffSegment[]` — used by Task 5 (API) and Task 11 (history page).

- [ ] **Step 1: Install the `diff` package**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm install diff`

Expected: `package.json` gains a `"diff": "^..."` entry under `dependencies`, `package-lock.json` updates, exit code 0.

- [ ] **Step 2: Write `src/lib/diff-text.ts`**

```ts
import { diffWords } from "diff";

export type DiffSegment = { type: "same" | "added" | "removed"; text: string };

export function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  return diffWords(oldText ?? "", newText ?? "").map((part) => ({
    type: part.added ? "added" : part.removed ? "removed" : "same",
    text: part.value,
  }));
}
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors mentioning `diff-text.ts` or the `diff` module (confirms the package ships its own types).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/diff-text.ts
git commit -m "feat(review): add word-diff helper for corrected documents"
```

---

### Task 2: `TextDiff` render component

**Files:**
- Create: `src/components/site/text-diff.tsx`

**Interfaces:**
- Consumes: `DiffSegment` from Task 1 (`src/lib/diff-text.ts`).
- Produces: `export function TextDiff({ segments }: { segments: DiffSegment[] })` — used by Task 6 (modal) and Task 11 (history page).

- [ ] **Step 1: Write the component**

```tsx
import type { DiffSegment } from "@/lib/diff-text";

export function TextDiff({ segments }: { segments: DiffSegment[] }) {
  return (
    <pre className="whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
      {segments.map((seg, i) => {
        if (seg.type === "added") {
          return (
            <span key={i} className="bg-green-500/20 text-green-800 dark:text-green-300 rounded-sm">
              {seg.text}
            </span>
          );
        }
        if (seg.type === "removed") {
          return (
            <span
              key={i}
              className="bg-red-500/10 text-red-700 dark:text-red-400 line-through rounded-sm"
            >
              {seg.text}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </pre>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi\" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/text-diff.tsx
git commit -m "feat(review): add TextDiff component for colored diff rendering"
```

---

### Task 3: i18n — diff legend + download label

**Files:**
- Modify: `src/lib/i18n/dictionaries.ts:276-320` (ka `documentAnalysis` block)
- Modify: `src/lib/i18n/dictionaries.ts:629-673` (en `documentAnalysis` block)

**Interfaces:**
- Produces: two new keys, `improveDiffLegendAdded` and `improveDiffLegendRemoved`, on `Dict["documentAnalysis"]` — consumed by Task 6.

- [ ] **Step 1: Add the ka keys**

In the ka `documentAnalysis` block, right after the `improveRevisedTitle: "შესწორებული ვერსია",` line (dictionaries.ts:312), add:

```ts
    improveDiffLegendAdded: "დამატებული/შესწორებული",
    improveDiffLegendRemoved: "წაშლილი",
```

- [ ] **Step 2: Add the en keys**

In the en `documentAnalysis` block, right after the `improveRevisedTitle: "Revised version",` line (dictionaries.ts:665), add:

```ts
    improveDiffLegendAdded: "Added/changed",
    improveDiffLegendRemoved: "Removed",
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors (both locale objects must have matching keys, or the shared `Dict` type will fail to unify).

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/dictionaries.ts
git commit -m "feat(review): add diff legend i18n strings"
```

---

### Task 4: Shorter risk explanations (prompt tweak)

**Files:**
- Modify: `src/lib/legal/document-analysis.ts:154-176` (`ANALYSIS_SYSTEM_PROMPT`)
- Modify: `src/lib/legal/document-analysis.ts:244-271` (`IMPROVEMENT_SYSTEM_PROMPT`)

**Interfaces:** none (prompt string content only — no signature changes).

- [ ] **Step 1: Tighten `ANALYSIS_SYSTEM_PROMPT`**

In the `წესები:` list of `ANALYSIS_SYSTEM_PROMPT` (ends at line 176), add a new bullet right after the `category და severity` line:

```ts
- "explanation" ველი დაწერე მაქსიმუმ 1-2 მოკლე წინადადებით (დაახლოებით 25 სიტყვამდე) — მხოლოდ მთავარი პრობლემა და მისი შედეგი, ზედმეტი კონტექსტის გარეშე.
```

- [ ] **Step 2: Tighten `IMPROVEMENT_SYSTEM_PROMPT`**

In the `წესები:` list of `IMPROVEMENT_SYSTEM_PROMPT` (ends at line 271), add the same bullet right after the `findings ასახავდეს` line:

```ts
- "explanation" ველი დაწერე მაქსიმუმ 1-2 მოკლე წინადადებით (დაახლოებით 25 სიტყვამდე) — მხოლოდ მთავარი პრობლემა და მისი შედეგი, ზედმეტი კონტექსტის გარეშე.
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors (template literal edits only).

- [ ] **Step 4: Commit**

```bash
git add src/lib/legal/document-analysis.ts
git commit -m "feat(review): tighten risk-explanation length in analysis/improvement prompts"
```

---

### Task 5: `/api/review/improve` returns the diff

**Files:**
- Modify: `src/app/api/review/improve/route.ts:1-20` (imports)
- Modify: `src/app/api/review/improve/route.ts:120-137` (response)

**Interfaces:**
- Consumes: `computeWordDiff` from Task 1.
- Produces: response body gains a sibling `diff: DiffSegment[]` field (not persisted to Mongo) — consumed by Task 6.

- [ ] **Step 1: Import the diff helper**

At the top of `src/app/api/review/improve/route.ts`, add to the import block (after the existing `document-analysis` import, i.e. after line 15):

```ts
import { computeWordDiff } from "@/lib/diff-text";
```

- [ ] **Step 2: Compute and return the diff**

Replace the tail of the handler (`src/app/api/review/improve/route.ts:120-137`):

```ts
  const revision = {
    text: improvement.text,
    summary: improvement.summary,
    findings: improvement.findings,
    recommendations: improvement.recommendations,
    questions: improvement.questions,
    instruction,
    answers,
    createdAt: new Date(),
  };
  const diff = computeWordDiff(baseText, improvement.text);
  review.revisions.push(revision);
  await review.save();

  if (!isAdmin) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { docReviewRemaining: -1 } });
  }

  return NextResponse.json({ id: String(review._id), revision, diff }, { status: 201 });
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/review/improve/route.ts
git commit -m "feat(review): return word-diff alongside each correction round"
```

---

### Task 6: Modal UI — colored diff + download

**Files:**
- Modify: `src/components/site/document-analysis-modal.tsx`

**Interfaces:**
- Consumes: `TextDiff` (Task 2), `computeWordDiff`'s output shape `DiffSegment[]` (Task 1), `DocumentDownloadButton` (existing, `src/components/site/document-download-button.tsx`), new dict keys from Task 3.

- [ ] **Step 1: Import `TextDiff` and `DocumentDownloadButton`, extend `RevisionResult`**

At the top of `document-analysis-modal.tsx`, add imports (after the existing `RiskFindingCard` import at line 9):

```ts
import { TextDiff } from "@/components/site/text-diff";
import { DocumentDownloadButton } from "@/components/site/document-download-button";
import type { DiffSegment } from "@/lib/diff-text";
```

Extend the `RevisionResult` type (currently lines 32-41) to add the `diff` field:

```ts
type RevisionResult = {
  text: string;
  summary: string;
  findings: RiskFinding[];
  recommendations: string[];
  questions: string[];
  instruction: string;
  answers: Record<string, string>;
  createdAt: string;
  diff: DiffSegment[];
};
```

- [ ] **Step 2: Replace the plain `<pre>` revision block with `TextDiff` + download button**

Replace the revised-text block (currently `document-analysis-modal.tsx:502-515`):

```tsx
                <div className="space-y-4 rounded-lg border border-border p-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {t.improveRevisedTitle}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={copyRevisedText}>
                          {t.improveCopyButton}
                        </Button>
                        <DocumentDownloadButton
                          content={revision.text}
                          filename={`${result.fileName || "document"}-corrected`}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500/40" />
                        {t.improveDiffLegendAdded}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/30" />
                        {t.improveDiffLegendRemoved}
                      </span>
                    </div>
                    <TextDiff segments={revision.diff} />
                  </div>
```

(This is the same opening wrapper `<div className="space-y-4 rounded-lg border border-border p-3">` and inner `<div>` from the original — only the header row and the `<pre>` → legend + `TextDiff` swap changed. Everything below it — the `revision.findings`, `revision.recommendations`, `revision.questions` blocks and the closing tags at lines 516-577 — stays exactly as-is.)

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors. If `revision.diff` is flagged as possibly undefined, confirm Task 5's response always includes `diff` — the API always computes it before returning, so the field is never omitted.

- [ ] **Step 4: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/document-analysis-modal.tsx
git commit -m "feat(review): show colored diff and download button for corrected document"
```

---

### Task 7: `GET /api/consultations` route

**Files:**
- Create: `src/app/api/consultations/route.ts`

**Interfaces:**
- Produces: `GET /api/consultations` → `200 { items: ConsultationItem[] }` (same shape as `ConsultationItem` in `src/app/dashboard/consultations/consultations-grid.tsx:30-36`) or `401 { error: string }` when unauthenticated. Consumed by Task 8.

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Consultation } from "@/lib/models/consultation";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const docs = await Consultation.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const items = docs.map((doc) => {
    const d = doc as unknown as {
      _id: unknown;
      question: string;
      answer: string;
      createdAt?: Date;
      sources?: unknown[];
    };
    return {
      id: String(d._id),
      question: d.question,
      answer: d.answer,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
      sources: d.sources ?? [],
    };
  });

  return NextResponse.json({ items });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Manual check (dev server)**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run dev` (leave running), then in a separate shell:
`curl -i http://localhost:3000/api/consultations`
Expected: `HTTP/1.1 401` with `{"error":"Unauthorized"}` (no session cookie sent) — confirms the route is wired and auth-gated. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/consultations/route.ts
git commit -m "feat(chat): add GET /api/consultations for client-side history fetch"
```

---

### Task 8: "Previous correspondence" panel component

**Files:**
- Create: `src/components/site/previous-correspondence-panel.tsx`

**Interfaces:**
- Consumes: `GET /api/consultations` (Task 7).
- Produces: `export function PreviousCorrespondenceButton({ locale }: { locale: Locale })` — used by Task 9 in both `ChatClient` and `AiConsultPanel`.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import { History, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDict } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { renderMarkdownBold } from "@/lib/markdown-bold";

type ConsultationItem = {
  id: string;
  question: string;
  answer: string;
  createdAt: string | null;
};

type LoadState = "idle" | "loading" | "loaded" | "error" | "unauthorized";

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("ka-GE") : "";
}

export function PreviousCorrespondenceButton({ locale }: { locale: Locale }) {
  const t = getDict(locale).chat;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [items, setItems] = useState<ConsultationItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setState("loading");
    try {
      const res = await fetch("/api/consultations");
      if (res.status === 401) {
        setState("unauthorized");
        toast.error(t.errorGeneric);
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = await res.json();
      setItems(data.items as ConsultationItem[]);
      setState("loaded");
    } catch {
      setState("error");
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && state === "idle") load();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <History className="h-4 w-4 mr-1.5" />
        {t.viewCorrespondence}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{t.viewCorrespondence}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {state === "loading" && (
              <p className="text-sm text-muted-foreground text-center py-8">{t.writing}</p>
            )}
            {state === "error" && (
              <p className="text-sm text-destructive text-center py-8">{t.errorGeneric}</p>
            )}
            {state === "loaded" && items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.correspondenceEmpty}
              </p>
            )}
            {state === "loaded" &&
              items.map((item) => {
                const isOpen = expandedId === item.id;
                return (
                  <div key={item.id} className="border border-border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : item.id)}
                      className="w-full text-left p-3 flex items-start gap-2 hover:bg-muted/50 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug line-clamp-2">
                          {item.question}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed border-t border-border pt-2">
                        {renderMarkdownBold(item.answer)}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 2: Add the `viewCorrespondence`/`correspondenceEmpty` dict keys**

In the ka `chat` block (`src/lib/i18n/dictionaries.ts:121-141`), add right after `howCanIHelp: "რით შემიძლია დაგეხმაროთ დღეს?",` (line 126):

```ts
    viewCorrespondence: "წინა მიმოწერის ნახვა",
    correspondenceEmpty: "ჯერ არცერთი კონსულტაცია არ გაქვთ.",
```

In the en `chat` block (`src/lib/i18n/dictionaries.ts:474-494`), add right after `howCanIHelp: "How can I help you today?",` (line 480):

```ts
    viewCorrespondence: "View previous correspondence",
    correspondenceEmpty: "You don't have any consultations yet.",
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/previous-correspondence-panel.tsx src/lib/i18n/dictionaries.ts
git commit -m "feat(chat): add previous-correspondence slide-over panel"
```

---

### Task 9: Mount the button in both chat surfaces

**Files:**
- Modify: `src/app/chat/chat-client.tsx:157-167`
- Modify: `src/app/services/services-client.tsx:141-151` (`AiConsultPanel` header)

**Interfaces:**
- Consumes: `PreviousCorrespondenceButton` from Task 8.

- [ ] **Step 1: Mount in `ChatClient`**

In `src/app/chat/chat-client.tsx`, add the import (after line 13):

```ts
import { PreviousCorrespondenceButton } from "@/components/site/previous-correspondence-panel";
```

Replace the hero section's opening (currently lines 158-167):

```tsx
      <section className="bg-slate-900">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="flex justify-end mb-4">
            <PreviousCorrespondenceButton locale={locale} />
          </div>
          <p className="animate-fade-up leading-tight">
            <span className="block text-5xl md:text-6xl font-bold text-white leading-tight mb-3">{d.chat.greeting.split(" — ")[0]}</span>
            <br />
            <span className="text-2xl font-semibold text-gold whitespace-nowrap">{d.chat.greeting.split(" — ").slice(1).join(" — ")}</span>
          </p>
        </div>
      </section>
```

- [ ] **Step 2: Mount in `AiConsultPanel`**

In `src/app/services/services-client.tsx`, add the import (near the other `@/components/site/*` imports, after line 27 `PageHero`):

```ts
import { PreviousCorrespondenceButton } from "@/components/site/previous-correspondence-panel";
```

Replace the `AiConsultPanel` header (currently `src/app/services/services-client.tsx:143-151`):

```tsx
      <header className="p-5 border-b border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">{sm.aiTab}</h3>
            <p className="text-xs text-muted-foreground">{sm.aiSubtitle}</p>
          </div>
        </div>
        <PreviousCorrespondenceButton locale={locale} />
      </header>
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/chat/chat-client.tsx src/app/services/services-client.tsx
git commit -m "feat(chat): mount previous-correspondence button in /chat and /services AI tab"
```

---

### Task 10: `/services` tab-switch state persistence

**Files:**
- Modify: `src/app/services/services-client.tsx:412-422` (the canvas `<section>`)

**Interfaces:** none new — purely a rendering-strategy change for the four existing panels (`AiConsultPanel`, `DocumentAnalysisPanel`, `TemplatesPanel`, `TemplatesLinkPanel`).

- [ ] **Step 1: Keep all four panels mounted, toggle visibility instead of conditional render**

Replace the canvas section body (currently `src/app/services/services-client.tsx:413-422`):

```tsx
            <section className="flex-1 min-w-0 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[650px]">
              <div className={activeTab === "ai" ? "contents" : "hidden"}>
                {flags.chat && <AiConsultPanel locale={locale} />}
              </div>
              <div className={activeTab === "docs" ? "contents" : "hidden"}>
                {flags.review && (
                  <div className="p-6 overflow-y-auto">
                    <DocumentAnalysisPanel locale={locale} />
                  </div>
                )}
              </div>
              <div className={activeTab === "templates" ? "contents" : "hidden"}>
                {flags.generate && <TemplatesPanel sm={sm} />}
              </div>
              <div className={activeTab === "templatesFill" ? "contents" : "hidden"}>
                {flags.templates && <TemplatesLinkPanel sm={sm} />}
              </div>
            </section>
```

This keeps every enabled panel's React component instance alive across tab switches (state stays in memory), using `hidden` (CSS `display:none`) to visually hide inactive ones and `contents` on the active wrapper so it doesn't add an extra flex box around `AiConsultPanel`'s own `h-full flex flex-col` layout.

- [ ] **Step 2: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Manual check**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run dev`, open `/services` in a browser, log in, type a message in the AI tab (don't send), switch to the "მზა შაბლონები" tab, switch back to "AI კონსულტაცია" — the typed draft and any prior messages must still be there. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add src/app/services/services-client.tsx
git commit -m "fix(services): keep tab panels mounted so switching tabs preserves chat/upload state"
```

---

### Task 11: History page — full correction-cycle timeline

**Files:**
- Modify: `src/app/dashboard/reviews/page.tsx`
- Create: `src/app/dashboard/reviews/reviews-grid.tsx`

**Interfaces:**
- Consumes: `computeWordDiff` (Task 1), `RiskFindingCard`/`isStructuredFinding` (existing).
- Produces: `export type ReviewItem` and `export function ReviewsGrid({ items }: { items: ReviewItem[] })`.

- [ ] **Step 1: Write `reviews-grid.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Clock, FileSearch, AlertCircle, CheckCircle2, ChevronDown, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskFindingCard, isStructuredFinding } from "@/components/site/risk-finding-card";
import { TextDiff } from "@/components/site/text-diff";
import { DocumentDownloadButton } from "@/components/site/document-download-button";
import type { RiskFinding } from "@/lib/legal/document-analysis";
import type { DiffSegment } from "@/lib/diff-text";

export type ReviewRevisionItem = {
  text: string;
  summary: string;
  findings: RiskFinding[];
  recommendations: string[];
  instruction: string;
  createdAt: string | null;
  diff: DiffSegment[];
};

export type ReviewItem = {
  id: string;
  fileName: string;
  createdAt: string | null;
  summary: string;
  findings: unknown[];
  recommendations: unknown[];
  revisions: ReviewRevisionItem[];
};

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("ka-GE") : "";
}

function RecommendationList({ recommendations }: { recommendations: unknown[] }) {
  return (
    <ul className="space-y-1">
      {recommendations.map((r, i) => (
        <li key={i} className="text-sm flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          {typeof r === "string"
            ? r
            : (r as { recommendation?: string; title?: string }).recommendation ??
              (r as { title?: string }).title ??
              JSON.stringify(r)}
        </li>
      ))}
    </ul>
  );
}

export function ReviewsGrid({ items }: { items: ReviewItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {items.map((review) => {
        const isOpen = expandedId === review.id;
        const findings = review.findings ?? [];
        const recommendations = review.recommendations ?? [];
        return (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSearch className="h-4 w-4 shrink-0" />
                    {review.fileName ?? "document"}
                  </CardTitle>
                  {review.createdAt && (
                    <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDate(review.createdAt)}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isOpen ? null : review.id)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">შეჯამება</p>
                <p className="text-sm leading-relaxed">{review.summary}</p>
              </div>

              {findings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> ნაპოვნი რისკები
                  </p>
                  <div className="space-y-2">
                    {findings.map((f, i) =>
                      isStructuredFinding(f) ? (
                        <RiskFindingCard key={i} finding={f} locale="ka" />
                      ) : (
                        <div key={i} className="text-sm flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                          {String(f)}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> რეკომენდაციები
                  </p>
                  <RecommendationList recommendations={recommendations} />
                </div>
              )}

              {isOpen && review.revisions.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Wand2 className="h-3 w-3" /> შესწორების ისტორია
                  </p>
                  {review.revisions.map((rev, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-border p-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          მოთხოვნა #{i + 1}
                        </p>
                        <p className="text-sm">
                          {rev.instruction.trim() || "შეასწორე ყველა გამოვლენილი რისკი."}
                        </p>
                        {rev.createdAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> {formatDate(rev.createdAt)}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            შესწორებული ვერსია
                          </p>
                          <DocumentDownloadButton
                            content={rev.text}
                            filename={`${review.fileName || "document"}-corrected-${i + 1}`}
                          />
                        </div>
                        <TextDiff segments={rev.diff} />
                      </div>

                      {rev.findings.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            განახლებული რისკები
                          </p>
                          <div className="space-y-2">
                            {rev.findings.map((f, fi) => (
                              <RiskFindingCard key={fi} finding={f} locale="ka" />
                            ))}
                          </div>
                        </div>
                      )}

                      {rev.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            განახლებული რეკომენდაციები
                          </p>
                          <RecommendationList recommendations={rev.recommendations} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `page.tsx` to compute diffs and delegate to `ReviewsGrid`**

Replace the entire body of `src/app/dashboard/reviews/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { DocumentReview } from "@/lib/models/document-review";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewModalTriggerLink } from "@/components/site/review-modal-trigger-link";
import { SubPageHeader } from "@/components/site/SubPageHeader";
import { ReviewsGrid, type ReviewItem } from "./reviews-grid";
import { computeWordDiff } from "@/lib/diff-text";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/reviews");

  await dbConnect();
  const reviews = await DocumentReview.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const items: ReviewItem[] = reviews.map((review) => {
    const r = review as unknown as {
      _id: unknown;
      fileName?: string;
      createdAt?: Date;
      summary: string;
      findings: unknown[];
      recommendations: unknown[];
      sourceText?: string;
      revisions?: Array<{
        text: string;
        summary: string;
        findings: unknown[];
        recommendations: unknown[];
        instruction: string;
        createdAt?: Date;
      }>;
    };
    const revisions = r.revisions ?? [];
    return {
      id: String(r._id),
      fileName: r.fileName ?? "document",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      summary: r.summary,
      findings: r.findings ?? [],
      recommendations: r.recommendations ?? [],
      revisions: revisions.map((rev, i) => {
        const baseText = i === 0 ? r.sourceText ?? "" : revisions[i - 1].text;
        return {
          text: rev.text,
          summary: rev.summary,
          findings: rev.findings as ReviewItem["revisions"][number]["findings"],
          recommendations: rev.recommendations,
          instruction: rev.instruction,
          createdAt: rev.createdAt ? new Date(rev.createdAt).toISOString() : null,
          diff: computeWordDiff(baseText, rev.text),
        };
      }),
    };
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <SubPageHeader
        backHref="/dashboard"
        title="დოკუმენტის მიმოხილვის შედეგები"
        subtitle={`${items.length} ანალიზი`}
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">ჯერ დოკუმენტი არ გაქვს გაანალიზებული.</p>
            <ReviewModalTriggerLink
              label="დოკუმენტის ანალიზი"
              locale="ka"
              className={buttonVariants()}
            />
          </CardContent>
        </Card>
      ) : (
        <ReviewsGrid items={items} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors. If `rev.findings as ReviewItem["revisions"][number]["findings"]` mismatches (the Mongoose `RiskFinding` shape vs. the plain `RiskFinding` import), switch the cast to `rev.findings as unknown as RiskFinding[]` and add `import type { RiskFinding } from "@/lib/legal/document-analysis";` to `page.tsx`.

- [ ] **Step 4: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 5: Manual check**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run dev`, log in as a user with at least one document review that has a correction round (or create one via `/services?tab=docs`), open `/dashboard/reviews`, click the chevron to expand a card — confirm the original findings, the correction request text, the colored diff, and a working download button all appear. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/reviews/page.tsx src/app/dashboard/reviews/reviews-grid.tsx
git commit -m "feat(reviews): show full analyze-correct-correct-again cycle in history"
```

---

### Task 12: Full-project verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: exit code 0, no output.

- [ ] **Step 2: Full lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 3: Production build**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run build`
Expected: build succeeds (exit code 0) — confirms no server/client component boundary violations (e.g. the new `Sheet`-based panel, `hidden`/`contents` tab wrappers) break the build.

- [ ] **Step 4: Final commit (if any stray changes remain)**

```bash
git status
```

Expected: clean tree (everything already committed task-by-task above). If anything is left uncommitted, `git add` it and commit with a message describing what it is.

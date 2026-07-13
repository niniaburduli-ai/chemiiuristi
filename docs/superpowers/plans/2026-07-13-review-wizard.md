# Document Review Wizard + Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `DocumentAnalysisPanel`'s single long-scrolling results screen into a 4-step wizard (Upload → Risks → Fix → Done), and let an in-progress review be resumed from the dashboard history page instead of forcing a fresh upload every time.

**Architecture:** Add one UI-only state (`uiStep: 2 | 3 | 4`, only meaningful once `status === "results"`) to gate which block of the existing render renders — no new state machine library, no new components beyond a tiny progress-bar helper. Add one new read-only API route (`GET /api/review/[id]`) so the panel can hydrate from a saved review instead of only from a fresh `/api/review` POST. Thread an optional `reviewId` query param through `services/page.tsx` → `services-client.tsx` → `DocumentAnalysisPanel`.

**Tech Stack:** Next.js 16 App Router, React 19 (`useEffect` added to this file), TypeScript strict, existing shadcn/ui primitives (`Button`, `Textarea`), existing `TextDiff`/`DocumentDownloadButton`/`RiskFindingCard` components — no new dependencies.

## Global Constraints

- No test runner configured — verification is `npx tsc --noEmit -p .`, `npm run lint`, `npm run build`, and a manual click-through (no automated test files).
- Reuse existing visual language only: `bg-card border border-border rounded-2xl`, `border-t-[3px] border-t-primary`, existing `Button` variants, `bg-gradient-to-r from-primary to-gold` (already used in `how-it-works.tsx`/`service-cards.tsx` section underlines) for the progress bar fill. No new colors, no new component library.
- Scope is `DocumentAnalysisPanel` only (used by both `DocumentAnalysisModal` and inline on `/services?tab=docs`). `DocumentAnalysisModal` itself is NOT touched — it always starts fresh at step 1; resuming only happens via the `/services` route.
- Step 3 shows only the LATEST correction round (no in-wizard round-tab browsing) — older rounds stay visible on `dashboard/reviews` (already built). This is a deliberate simplification over the earlier mockup, per the user's explicit "as simple as possible."
- No new "finished" flag on `DocumentReview` — the history page's "continue" button behaves identically regardless of how many revisions exist.

---

### Task 1: `GET /api/review/[id]` — fetch a saved review for resuming

**Files:**
- Create: `src/app/api/review/[id]/route.ts`

**Interfaces:**
- Consumes: `computeWordDiff` (`src/lib/diff-text.ts`), `DocumentReview` model.
- Produces: `GET /api/review/:id` → `200 { id, fileName, summary, findings, recommendations, revisions: Array<{ text, summary, findings, recommendations, questions, instruction, diff }> }`, or `401`/`403`/`404`. Consumed by Task 3.

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { DocumentReview } from "@/lib/models/document-review";
import { computeWordDiff } from "@/lib/diff-text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();
  const review = await DocumentReview.findById(id).lean();
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (String(review.userId) !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const revisions = review.revisions ?? [];
  const revisionsOut = revisions.map((rev, i) => {
    const baseText = i === 0 ? review.sourceText ?? "" : revisions[i - 1].text;
    return {
      text: rev.text,
      summary: rev.summary,
      findings: rev.findings,
      recommendations: rev.recommendations,
      questions: rev.questions,
      instruction: rev.instruction,
      diff: computeWordDiff(baseText, rev.text),
    };
  });

  return NextResponse.json({
    id: String(review._id),
    fileName: review.fileName ?? "document",
    summary: review.summary,
    findings: review.findings ?? [],
    recommendations: review.recommendations ?? [],
    revisions: revisionsOut,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Manual check**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run dev` (leave running), then in another shell: `curl -i http://localhost:3000/api/review/000000000000000000000000` — expect `401` (no session cookie) since auth is checked before the id lookup. Stop the dev server after checking.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/review/[id]/route.ts
git commit -m "feat(review): add GET /api/review/[id] to fetch a saved review for resuming"
```

---

### Task 2: Wizard progress bar + step state in `DocumentAnalysisPanel`

**Files:**
- Modify: `src/components/site/document-analysis-modal.tsx`

**Interfaces:**
- Produces: local `uiStep` state and a `WizardProgress` render helper, consumed by later steps in this same task and Task 3.

- [ ] **Step 1: Add `uiStep` state and the progress-bar helper**

Add `useEffect` to the React import (`document-analysis-modal.tsx:3`):

```ts
import { useEffect, useRef, useState } from "react";
```

Add the `uiStep` state next to the existing `revision` state (after `document-analysis-modal.tsx:68`):

```ts
  const [uiStep, setUiStep] = useState<2 | 3 | 4>(2);
```

Add a small progress-bar component above `DocumentAnalysisPanel` (after the `extOf` helper, `document-analysis-modal.tsx:56`):

```tsx
function WizardProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex gap-1.5 mb-4">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className={`h-1.5 flex-1 rounded-full ${
            n <= step ? "bg-gradient-to-r from-primary to-gold" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Reset `uiStep` on `reset()` and set it to 2 whenever a fresh analysis lands**

In `reset()` (`document-analysis-modal.tsx:86-101`), add `setUiStep(2);` alongside the other resets (right after `setRevision(null);`).

In `analyze()`'s success path (`document-analysis-modal.tsx:202`, `setResult(data as AnalysisResult);`), add `setUiStep(2);` on the next line, so every fresh upload always starts at the risks step.

- [ ] **Step 3: Render the progress bar**

Right after the title block (`document-analysis-modal.tsx:262-266`, the `<div><h3>...title...</h3><p>...subtitle...</p></div>`), add:

```tsx
      <WizardProgress step={status === "results" ? uiStep : 1} />
```

- [ ] **Step 4: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors (only additive state/JSX so far — the render blocks below aren't gated by `uiStep` yet, that's Task 3).

- [ ] **Step 5: Commit**

```bash
git add src/components/site/document-analysis-modal.tsx
git commit -m "feat(review): add wizard progress bar and step state (no gating yet)"
```

---

### Task 3: Gate the "results" content by `uiStep`

**Files:**
- Modify: `src/components/site/document-analysis-modal.tsx`
- Modify: `src/lib/i18n/dictionaries.ts` (ka `documentAnalysis` block, en `documentAnalysis` block)

**Interfaces:**
- Consumes: `uiStep`/`setUiStep` from Task 2.

- [ ] **Step 1: Add the new dict keys**

In the ka `documentAnalysis` block, right after `resultsSavedNote: "შედეგი ინახება თქვენს ანგარიშში",`, add:

```ts
    stepContinueToFixCta: "მიდით შესწორებაზე",
    stepFinishCta: "✓ ეს კარგად გამოიყურება — დასრულება",
    stepDoneTitle: "თქვენი შესწორებული დოკუმენტი მზადაა",
    stepKeepFixingCta: "მეტის შესწორება",
```

In the en `documentAnalysis` block, right after `resultsSavedNote: "Results are saved to your account",`, add:

```ts
    stepContinueToFixCta: "Continue to fixing",
    stepFinishCta: "✓ This looks good — finish",
    stepDoneTitle: "Your corrected document is ready",
    stepKeepFixingCta: "Keep fixing",
```

- [ ] **Step 2: Split the `results` block into step 2 / step 3 / step 4**

Replace the entire `{status === "results" && result && ( ... )}` block (currently `document-analysis-modal.tsx:430-616`) with:

```tsx
        {status === "results" && result && (
          <div className="space-y-4">
            {typeof result.skippedImages === "number" && result.skippedImages > 0 && (
              <p className="text-xs rounded-lg border border-border bg-muted/50 p-2 text-muted-foreground">
                {t.skippedImagesNote} ({result.skippedImages})
              </p>
            )}

            {uiStep === 2 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.summaryLabel}</p>
                  <p className="text-sm leading-relaxed">{result.summary}</p>
                </div>

                {result.findings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {t.findingsLabel} ({result.findings.length})
                    </p>
                    <div className="space-y-3">
                      {result.findings.map((f, i) => (
                        <RiskFindingCard key={i} finding={f} locale={locale} />
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {t.recommendationsLabel}
                    </p>
                    <ul className="space-y-1.5">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-2 border-t">{t.resultsSavedNote}</p>

                <Button onClick={() => setUiStep(3)} className="w-full">
                  {t.stepContinueToFixCta}
                </Button>
              </>
            )}

            {uiStep === 3 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-muted-foreground">{t.improveTitle}</p>
                <Textarea
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  placeholder={t.improveInstructionPlaceholder}
                  rows={3}
                />
                <Button
                  onClick={() => improve()}
                  disabled={improveStatus === "loading"}
                  variant="outline"
                  className="w-full"
                >
                  {improveStatus === "loading" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {improveStatus === "loading" ? t.improving : t.improveCta}
                </Button>

                {improveStatus === "error" && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {improveErrorKind === "unauthorized" && t.loginRequired}
                      {improveErrorKind === "quota" && t.quotaExceeded}
                      {improveErrorKind === "generic" && t.genericError}
                    </span>
                  </div>
                )}

                {revision && (
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

                    {revision.findings.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          {t.improveFindingsLabel} ({revision.findings.length})
                        </p>
                        <div className="space-y-3">
                          {revision.findings.map((f, i) => (
                            <RiskFindingCard key={i} finding={f} locale={locale} />
                          ))}
                        </div>
                      </div>
                    )}

                    {revision.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          {t.improveRecommendationsLabel}
                        </p>
                        <ul className="space-y-1.5">
                          {revision.recommendations.map((r, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {revision.questions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          {t.improveQuestionsTitle}
                        </p>
                        {revision.questions.map((q, i) => (
                          <div key={i} className="space-y-1">
                            <p className="text-sm">{q}</p>
                            <Textarea
                              value={answersDraft[q] ?? ""}
                              onChange={(e) =>
                                setAnswersDraft((prev) => ({ ...prev, [q]: e.target.value }))
                              }
                              placeholder={t.improveAnswerPlaceholder}
                              rows={2}
                            />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {t.improveFollowUpCommentLabel}
                          </p>
                          <Textarea
                            value={followUpComment}
                            onChange={(e) => setFollowUpComment(e.target.value)}
                            placeholder={t.improveFollowUpCommentPlaceholder}
                            rows={2}
                          />
                        </div>
                        <Button
                          onClick={applyAnswers}
                          disabled={
                            improveStatus === "loading" ||
                            (revision.questions.every((q) => !answersDraft[q]?.trim()) &&
                              !followUpComment.trim())
                          }
                          className="w-full"
                        >
                          {t.improveApplyAnswersCta}
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={() => setUiStep(4)}
                      className="w-full bg-green-600 hover:bg-green-600/90 text-white"
                    >
                      {t.stepFinishCta}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {uiStep === 4 && revision && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-foreground">{t.stepDoneTitle}</h4>
                <pre className="whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-3 max-h-96 overflow-y-auto">
                  {revision.text}
                </pre>
                <DocumentDownloadButton
                  content={revision.text}
                  filename={`${result.fileName || "document"}-corrected`}
                />
                <Button variant="ghost" className="w-full" onClick={() => setUiStep(3)}>
                  {t.stepKeepFixingCta}
                </Button>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={reset}>
              {t.chooseFile}
            </Button>
          </div>
        )}
```

- [ ] **Step 3: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 5: Manual check**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run dev`, log in, open `/services?tab=docs`, upload a document. Confirm: after analysis you land on a "risks" screen with one continue button (not the old wall of text); clicking it shows the instruction box; submitting a correction shows the diff plus a green "finish" button; clicking finish shows a clean final screen with a working download button and a "keep fixing" link back to step 3. Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add src/components/site/document-analysis-modal.tsx src/lib/i18n/dictionaries.ts
git commit -m "feat(review): split results screen into risks/fix/done wizard steps"
```

---

### Task 4: Resume from a saved review (`initialReviewId`)

**Files:**
- Modify: `src/components/site/document-analysis-modal.tsx`

**Interfaces:**
- Consumes: `GET /api/review/[id]` (Task 1).
- Produces: `DocumentAnalysisPanel` gains an optional `initialReviewId?: string` prop — consumed by Task 5.

- [ ] **Step 1: Accept the prop and fetch on mount**

Change the function signature (`document-analysis-modal.tsx:58`):

```tsx
export function DocumentAnalysisPanel({
  locale,
  initialReviewId,
}: {
  locale: Locale;
  initialReviewId?: string;
}) {
```

Add a resume effect right after the state declarations (after the `fileRef`/`imagesRef` lines, before `clearImages()`):

```ts
  useEffect(() => {
    if (!initialReviewId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/review/${initialReviewId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setResult({
          id: data.id,
          fileName: data.fileName,
          summary: data.summary,
          findings: data.findings,
          recommendations: data.recommendations,
        });
        const revisions = data.revisions as RevisionResult[];
        if (revisions.length > 0) {
          setRevision(revisions[revisions.length - 1]);
          setUiStep(3);
        } else {
          setUiStep(2);
        }
        setStatus("results");
      } catch {
        // Resume is best-effort — on failure the panel just stays at step 1 (fresh upload).
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReviewId]);
```

- [ ] **Step 2: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors. If `RevisionResult`'s `answers`/`instruction`/`createdAt` fields are reported missing on the fetched `revisions[number]` objects, that's expected — the API response only carries the subset the resumed UI needs (`text`, `summary`, `findings`, `recommendations`, `questions`, `instruction`, `diff`); adjust the cast to `revisions[revisions.length - 1] as RevisionResult` only if TypeScript complains about excess-property narrowing, not missing ones (it won't, since object literals from `await res.json()` are typed `any` before the cast).

- [ ] **Step 3: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/site/document-analysis-modal.tsx
git commit -m "feat(review): resume a saved review via initialReviewId prop"
```

---

### Task 5: Thread `reviewId` through `/services` and add "continue" button in history

**Files:**
- Modify: `src/app/services/page.tsx`
- Modify: `src/app/services/services-client.tsx`
- Modify: `src/app/dashboard/reviews/reviews-grid.tsx`

**Interfaces:**
- Consumes: `initialReviewId` prop from Task 4.

- [ ] **Step 1: Read `reviewId` in `services/page.tsx`**

Change the `searchParams` type and destructure (mirrors the existing `tab` read added earlier this session):

```tsx
export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; reviewId?: string }>
}) {
  const [locale, flags, plans, { tab, reviewId }] = await Promise.all([
    getLocale(),
    getFeatureFlags(),
    getVisiblePlans(),
    searchParams,
  ])
```

And pass it down where `ServicesPageClient` is rendered:

```tsx
      <ServicesPageClient locale={locale} flags={flags} upgradePlan={upgradePlan} initialTab={tab} initialReviewId={reviewId} />
```

- [ ] **Step 2: Accept and forward it in `services-client.tsx`**

Add `initialReviewId` to `ServicesPageClient`'s props (`services-client.tsx:355-365`):

```tsx
export function ServicesPageClient({
  locale,
  flags,
  upgradePlan,
  initialTab,
  initialReviewId,
}: {
  locale: Locale;
  flags: FeatureFlagsData;
  upgradePlan: PlanData | null;
  initialTab?: string;
  initialReviewId?: string;
}) {
```

Pass it to `DocumentAnalysisPanel` in the docs-tab render (the `<div className={activeTab === "docs" ? ...}>` block added earlier this session):

```tsx
              <div className={activeTab === "docs" ? "contents" : "hidden"}>
                {flags.review && (
                  <div className="p-6 overflow-y-auto">
                    <DocumentAnalysisPanel locale={locale} initialReviewId={initialReviewId} />
                  </div>
                )}
              </div>
```

- [ ] **Step 3: Add the "continue" button to each review card**

In `reviews-grid.tsx`, add the `Link` import and a `Play` icon (alongside the existing `lucide-react` import):

```tsx
import Link from "next/link";
```

and change the lucide import line to include `Play`:

```tsx
import { Clock, FileSearch, AlertCircle, CheckCircle2, ChevronDown, Wand2, Play } from "lucide-react";
```

In the `CardHeader`'s button row (where the `ChevronDown` toggle button is, inside `<div className="flex items-start justify-between gap-3">`), add the continue link right before the existing expand button:

```tsx
                <div className="flex items-center gap-1">
                  <Link
                    href={`/services?tab=docs&reviewId=${review.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2 py-1.5"
                  >
                    <Play className="h-3 w-3" /> განაგრძეთ
                  </Link>
                  {review.revisions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isOpen ? null : review.id)}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </Button>
                  )}
                </div>
```

(This replaces the existing `{review.revisions.length > 0 && (<Button ...ChevronDown.../>)}` block — same condition and button, just wrapped alongside the new "continue" link in a flex row instead of being the sole child.)

- [ ] **Step 4: Typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 5: Lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 6: Manual check**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run dev`, log in, do a document analysis + one correction round, go to `/dashboard/reviews`, click "განაგრძეთ" on that review — confirm it lands on `/services?tab=docs` with the docs tab active and the wizard already showing step 3 with the latest revision loaded (not a blank upload screen). Stop the dev server after checking.

- [ ] **Step 7: Commit**

```bash
git add src/app/services/page.tsx src/app/services/services-client.tsx src/app/dashboard/reviews/reviews-grid.tsx
git commit -m "feat(review): add continue-from-history entry point into the wizard"
```

---

### Task 6: Full-project verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npx tsc --noEmit -p .`
Expected: exit code 0, no output.

- [ ] **Step 2: Full lint**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run lint`
Expected: exit code 0.

- [ ] **Step 3: Production build**

Run: `cd "c:\Users\user\Desktop\chemiiuristi" && npm run build`
Expected: build succeeds (exit code 0).

- [ ] **Step 4: Final status check**

Run: `git status --short` — expected clean (all task commits already made above); if anything stray remains, commit it with a message describing what it is.

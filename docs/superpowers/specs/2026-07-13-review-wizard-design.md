# Document review/correction wizard + resume

Date: 2026-07-13

## Goal

Replace the single long-scrolling "analyze → improve" panel (`DocumentAnalysisPanel`) with a 4-step wizard, and make in-progress reviews resumable from history instead of forcing a fresh upload every time. Validated via clickable mockup (`.superpowers/brainstorm/844-.../content/wizard-full.html`) — user approved the wizard direction over a chat-thread alternative, reasoning: review is a finite pipeline with a clear finish line (a downloadable file), unlike open-ended consultation chat.

Scope: document-review/correction only (`DocumentAnalysisPanel`, used both inside `DocumentAnalysisModal` and inline on `/services?tab=docs`). Generate/templates are NOT touched — out of scope for this round.

## Visual language (match existing site, don't invent new style)

Reuse exactly what's already in the codebase — no new component library, no new color system:
- Cards: `bg-card border border-border rounded-2xl`, `border-t-[3px] border-t-primary` accent (used everywhere: `service-cards.tsx`, `RiskFindingCard`, dashboard cards).
- Buttons: existing `Button` variants (`default`, `outline`, `ghost`) — no new button style.
- Severity badges: reuse `RiskFindingCard` as-is for findings.
- Progress indicator: a thin 4-segment bar using the same `bg-gradient-to-r from-primary to-gold` treatment already used under section headings (`how-it-works.tsx`, homepage cards) — filled segments = completed steps.
- Diff view: existing `TextDiff` component, unchanged.

## Steps

**Step 1 — Upload.** Unchanged: today's mode toggle (document/photos), dropzone/image grid, Analyze button, error states. Same code path (`analyze()`), just now rendered as "step 1 of 4."

**Step 2 — Risks found.** Summary + findings (via `RiskFindingCard`) + recommendations — exactly what "results" shows today, minus the improve UI. One button: "მიდით შესწორებაზე" (continue to fixing) → step 3. No duplication: this step never re-renders once a revision exists (step 3 owns all revision content).

**Step 3 — Fix it (loop).** One round visible at a time:
- Instruction textarea + follow-up-comment box + question-answer inputs (existing logic, unchanged) feeding the existing `improve()` call.
- Only the **latest** round's diff renders as the main content. Earlier rounds collapse into a small horizontal tab strip ("round 1", "round 2", ...) above the diff — clicking an older tab shows that round's diff read-only (no re-editing old rounds); clicking back to the latest tab (or just always defaulting to it) re-enables the instruction box.
- Two buttons: "another change" (stays on step 3, same round-loop) and "this looks good" → step 4. No count restriction — same 1-credit-per-round billing as today, unchanged.

**Step 4 — Done.** Latest revision's clean text (no diff coloring — final, per earlier design decision) + `DocumentDownloadButton` (Word/PDF, existing component). A small "მეტის შესწორება" (keep fixing) link goes back to step 3 if the user changes their mind — this is not a dead end.

**Step derivation:** no new "current step" field is stored. Step is computed from data already on the review:
- No `revisions` yet → step 2 (or step 1 if no `result` at all, i.e. a brand-new upload).
- Has `revisions`, user hasn't clicked "this looks good" yet → step 3.
- User clicked "this looks good" → step 4. This one bit (has the user confirmed satisfaction) is the only new piece of client state (`confirmedDone: boolean`), reset to `false` whenever a fresh `improve()` call adds a new round after being on step 4 (so asking for "one more change" from step 4 correctly drops back to step 3's loop).

## Resume from history

**New API route:** `GET /api/review/[id]` — auth + ownership check (mirrors `/api/review/improve`'s existing checks), returns the same shape the modal needs to hydrate any step: `{ id, fileName, summary, findings, recommendations, revisions: [{ text, summary, findings, recommendations, questions, instruction, diff }] }` — diff computed server-side per revision the same way `dashboard/reviews/page.tsx` already does (against the predecessor, or `sourceText` for round 1).

**`DocumentAnalysisPanel` gets an optional `initialReviewId` prop.** When present, on mount it fetches `/api/review/[id]` instead of starting at step 1, and derives its starting step from the fetched data using the same rule as above (lands on step 3 if there are revisions, since "confirmed done" isn't persisted — resuming always re-opens the fix loop, which is safe: the user can immediately hit "this looks good" again to reach step 4 if they just want to re-download).

**`dashboard/reviews/page.tsx` / `reviews-grid.tsx`:** every review card gets one "▶ განაგრძეთ" (continue) button (not just the expand-history chevron, which stays for read-only past rounds) — same label and behavior regardless of how many revisions exist. No "finished/unfinished" distinction is tracked or shown (would need a new persisted flag with fuzzy semantics — out of scope; "continue" always works, and if the user just wants the file again they land on step 3 and immediately hit "this looks good" to reach step 4's download). It links to `/services?tab=docs&reviewId=<id>`.

**`/services` wiring:** `services/page.tsx` already reads `tab` from `searchParams` (added earlier this session) — extend it to also read `reviewId` and pass both to `ServicesPageClient` → `DocumentAnalysisPanel`.

**`DocumentAnalysisModal`** (the homepage-trigger dialog) does not need `initialReviewId` — resuming always happens via the `/services` route from history, not the modal. The modal keeps working exactly as today (always starts fresh at step 1).

## Out of scope

Generate/templates redesign, a persisted "done" flag (computed from `revisions` presence instead), true chat-thread UI, changing `/api/review/improve` billing.

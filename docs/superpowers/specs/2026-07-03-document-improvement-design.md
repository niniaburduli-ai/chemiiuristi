# Interactive Document Improvement Layer — Design

Date: 2026-07-03
Status: Approved

## Problem

`/api/review` + `DocumentAnalysisModal` currently only produce a passive risk report (summary, findings, recommendations). There's no way for a user to act on the findings — they read risks but can't get a corrected contract. This adds an interactive layer: request an AI-generated corrected version of the document, with placeholders for missing data and follow-up questions for ambiguous data, plus an updated risk analysis on the corrected text.

## Non-goals

- No chat-bubble / multi-turn conversation history UI.
- No separate manual "re-check risks" step — re-analysis happens automatically as part of the same improve call.
- No Vercel AI SDK adoption. Stays consistent with the existing hand-rolled OpenRouter (`callOpenRouterChat`) pattern used by `/api/review` and `/api/chat`. AI SDK is listed in `package.json` but unused everywhere in `src/`; introducing it for one feature would break phase/convention consistency (per CLAUDE.md).
- No redesign of the existing risk-analysis prompt/parsing for the *initial* review — only additive changes (storing `sourceText`).

## Architecture

### New API route: `src/app/api/review/improve/route.ts` (POST)

Follows the same shape as `/api/review/route.ts` and `/api/chat/route.ts`:

1. `auth()` → 401 if unauthenticated.
2. Load `User`, check `docReviewRemaining` quota → 403 unless admin (same gate as `/api/review`; each improve call consumes 1 credit).
3. Zod-validate body: `{ reviewId: string, instruction?: string, answers?: Record<string,string> }`.
4. Load `DocumentReview` by `reviewId`; 404 if missing, 403 if `review.userId !== session.user.id` (ownership check — prevents IDOR).
5. Determine base text: latest entry in `review.revisions` if present, else `review.sourceText`.
6. Build prompt (system + user, Georgian) via new `generateDocumentImprovement()` in `src/lib/legal/document-analysis.ts`:
   - Base text, current findings, prior open `questions` (if any), user's free-text `instruction` (optional), and `answers` (if the user is responding to previous questions).
   - Instruct model: rewrite the document fixing the identified risks; where data is *missing*, insert a bracket placeholder token in `UPPER_SNAKE_CASE` (e.g. `[LESSOR_NAME]`, `[DATE]`, `[ADDRESS]`) rather than inventing a value; where information is *ambiguous or conflicting* (not simply absent), do not guess — instead add a natural-language question to the `questions` array.
   - Require strict JSON output: `{ revisedText, summary, findings: RiskFinding[], recommendations: string[], questions: string[] }`. `findings`/`summary`/`recommendations` reflect risk analysis of the *revised* text (single AI call does correction + re-scoring).
7. Call `callOpenRouterChat` (same default model/env vars as `/api/review`, `max_tokens` raised to accommodate full document + analysis, e.g. 4000).
8. Parse response with new `parseImprovementResponse()` (mirrors existing `parseAnalysisResponse` — lenient JSON extraction, `coerceCategory`/`coerceSeverity` reused, missing strings default to `""`, missing `questions` defaults to `[]`).
9. Push a new entry onto `review.revisions[]`: `{ text, findings, summary, recommendations, questions, instruction, answers, createdAt }`. Save. Decrement `docReviewRemaining`.
10. Return `201` with the new revision (and `docReviewRemaining` for UI display, matching `/api/review`'s response shape conventions).

### Data model changes

`src/lib/legal/document-analysis.ts`:
- New type `DocumentRevision`: `{ text: string; findings: RiskFinding[]; summary: string; recommendations: string[]; questions: string[]; instruction: string; answers: Record<string,string>; createdAt: Date }`.

`src/lib/models/document-review.ts`:
- Add `sourceText: { type: String, default: "" }` — populated at creation time in `/api/review/route.ts` (the already-extracted/truncated text used for the initial analysis). Needed so `improve` has a text basis without re-extracting from the original upload (the file itself isn't persisted).
- Add `revisions: [RevisionSchema]` (mirrors `RiskFindingSchema` embedding pattern already used for `findings`).

`/api/review/route.ts`: minimal change — set `sourceText` on the created `DocumentReview` alongside existing fields. No behavior change to the existing analysis flow.

### Frontend: `src/components/site/document-analysis-modal.tsx`

New "Improve" section rendered below the existing recommendations list in the results view:

- Textarea: optional free-text instruction (e.g. "focus on the termination clause"). Placeholder text explains default behavior (fixes all detected risks if left blank).
- Button: "Ask to improve / edit document" (i18n key). Disabled while a request is in flight.
- On submit → `POST /api/review/improve` with `{ reviewId, instruction }`. Reuses the modal's existing `errorKind` handling (401/403/other) for quota-exhausted / auth errors.
- On success, render the returned revision:
  - Revised text in a read-only, scrollable `<pre>`/textarea block with a copy-to-clipboard button.
  - Updated findings via the existing `RiskFindingCard` list (replaces, doesn't duplicate, the original findings display for the improve section — original analysis stays visible above, revision shown below it).
  - Updated recommendations list.
  - If `questions.length > 0`: a "Needs your input" list — one inline text input per question. An "Apply answers" button collects all answers into `{ reviewId, instruction: "", answers: { [question]: answerText } }` and re-calls the improve endpoint, appending another revision.
- Local component state additions: `revision` (latest `DocumentRevision` or null), `improveStatus` ("idle"|"loading"|"error"), `improveError`, `answers` (Record<string,string> keyed by question text).

### i18n

New `documentAnalysis.improve` block in `src/lib/i18n/dictionaries.ts` (ka default + en mirror): section title, instruction textarea placeholder, submit button label, "needs your input" section title, per-question answer input placeholder, "apply answers" button label, revised-text section title, copy button label. Quota-exhausted / auth errors reuse existing shared error strings already used by the initial analysis flow.

## Error handling / edge cases

- Ownership check on `reviewId` prevents one user improving another's review.
- Quota exhausted mid-flow → same 403 shape and UI messaging as initial analysis (upgrade CTA).
- `sourceText` truncated to `MAX_ANALYSIS_TEXT` at creation time (same constant already used for the initial analysis) — improve operates on the same bounded text, no new truncation logic needed.
- Photos-mode reviews: `sourceText` is the OCR `combinedText` — no special-casing, it's already plain text by the time it reaches the analysis step.
- If the model's JSON is malformed beyond what the lenient parser tolerates, return a 502-style error the modal surfaces via the existing generic error path (no new error UI needed).

## Testing

No test runner configured in this repo. Verify manually via `npm run dev`:
1. Upload a text/PDF contract missing identifying details, run initial analysis.
2. Click "Ask to improve", confirm revised text contains `[BRACKET_PLACEHOLDERS]` for missing data and/or `questions[]` for ambiguous data.
3. Answer a question via inline field, click "Apply answers", confirm a second revision is generated incorporating the answer.
4. Confirm `docReviewRemaining` decrements on each improve call and 403s once exhausted.
5. Confirm `DocumentReview.revisions` persists in Mongo across requests (check `/dashboard/reviews` or DB directly).

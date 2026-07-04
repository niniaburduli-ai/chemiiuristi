# Document Generation Verification, Mandatory Fields & Prompt Brevity — Design

## Goal

Three independent improvements to the AI document features, kept strictly scoped to their own service/quota:

1. **Generation only** — after drafting a document, verify its "Legal Basis & Sources" citations via web search and correct any that don't check out, before saving/returning.
2. **Generation only** — require the essential facts (city, document date, key party names) before allowing generation, so documents ship complete instead of full of `[BRACKETS]`.
3. **Generation + Review/Improve** — tighten all three AI prompts for brevity (no filler, minimum necessary text).

**Hard constraint:** Document Generation (`docGenerationRemaining`, `/api/generate*`) and Document Review/Improve (`docReviewRemaining`, `/api/review*`) stay completely separate — no shared quota logic, no shared code path beyond the prompt-brevity wording pattern applied independently to each.

## Background (confirmed by investigation)

- The "Legal Basis & Sources" prose section is **already present** in `src/app/api/generate/route.ts`'s `SYSTEM` prompt (currently uncommitted in the working tree — a prior in-session edit). It instructs the model to group articles by law name, in the same style as the consultation feature's citation display, and says "don't invent article numbers" — but nothing verifies this today.
- Chat's actual retrieval is **both** a hardcoded 8-law fetch (`fetchApprovedSource` + `APPROVED_SOURCES`) **and** a parallel `searchWebContext` web-search enrichment call (`src/lib/legal/openrouter.ts:334`) — confirmed live in code, not from memory. Per direction, the new generation verification step matches the **web-search** mechanism (`searchWebContext`'s pattern: OpenRouter `:online` model, same on/off env flag, fail-open to `null`), not the 8-law whitelist.
- `src/lib/legal/openrouter.ts` already has everything a new sibling function needs in scope: `OPENROUTER_URL`, `WEB_SEARCH_ON()`, `WEB_MODEL()`, `WEB_MAX_RESULTS()`.
- `QUESTION_SCHEMAS` in `src/app/generate/generate-client.tsx` (built in a prior session) has no `required` concept and no city/document-date fields — every field is currently optional free text.
- `ANALYSIS_SYSTEM_PROMPT` and `IMPROVEMENT_SYSTEM_PROMPT` (`src/lib/legal/document-analysis.ts`) have zero brevity instructions today — pure JSON-schema-shape prompts.

## 1. Citation verification (generation only)

**New function** `verifyLegalCitations(docTypeName: string, citationsSection: string): Promise<string | null>` in `src/lib/legal/openrouter.ts`, placed right after `searchWebContext`, built the same way (same `WEB_MODEL()`, same `OPENROUTER_URL`, same 20s abort timeout, same fail-open-to-`null` on any error/disabled/missing-key). Its system prompt asks it to: web-search-fact-check each law/article named in the given section against real current Georgian legislation, return **only** a corrected version of that same section in the same format (law name per line, articles listed under it), remove any article it can't confirm, never add new articles that weren't in the original list, and return nothing extra (no commentary).

**Wiring in `src/app/api/generate/route.ts`:** after the main generation call succeeds, split `content` on the known marker `**სამართლებრივი საფუძვლები და წყაროები**`. If the marker is found, call `verifyLegalCitations(typeName, citationsSection)` with the text after the marker. If it returns a non-empty string, replace the citations section with it; if it returns `null` (disabled, no key, timeout, error, or genuinely nothing to keep), leave `content` untouched — verification is an enhancement, never a blocker. `maxDuration` on this route goes from 60 to 90 to give the extra sequential call room.

This never touches `docReviewRemaining`, never calls anything under `src/app/api/review*`, and the new function lives in a file already shared by chat (not review) — no cross-service coupling introduced.

## 2. Mandatory fields (generation only)

`QuestionField` gains an optional `required?: boolean`. A new `COMMON_FIELDS: QuestionField[]` constant (city + document date, both `required: true`) is prepended to every type's field list at render/validation time — `const fields = [...COMMON_FIELDS, ...(QUESTION_SCHEMAS[type] ?? [])]`. Within each existing per-type schema, the 1-2 fields that name the essential parties become `required: true` (e.g. `respondent`/`yourName` for complaint, `landlord`/`tenant` for rental, `employer`/`employee` for employment and termination, `principal`/`agent` for power-of-attorney, `recipient` for demand-letter). Everything else (amounts, reasons, scope text, secondary dates like an incident date) stays optional, matching the existing "additional details" fallback philosophy — only block on facts a real document cannot ship without.

The Generate button is disabled whenever any required field (from `COMMON_FIELDS` or the current type's schema) is empty, and a small inline hint lists which are still missing. This replaces relying on the AI to invent `[BRACKETS]` for things the user could have just told us up front.

## 3. Brevity (generation + review, independently)

Add one brevity rule to each of the three prompts, in each prompt's own voice/format, without touching anything else in them:

- `SYSTEM` in `src/app/api/generate/route.ts`: a new instruction line telling the model to be maximally concise — no filler phrases, no repetition, no throat-clearing, plain clear legal language, only necessary content. Distinct from the existing "compact spacing" rule (that one governs blank lines; this one governs wordiness).
- `ANALYSIS_SYSTEM_PROMPT` in `src/lib/legal/document-analysis.ts`: one new bullet in its existing "წესები:" (rules) list, same intent.
- `IMPROVEMENT_SYSTEM_PROMPT` in the same file: one new bullet in its "წესები:" list, same intent.

`maxTokens` ceilings on all three calls stay exactly as they are today (16000 / 6000 / 16000) — they're safety limits against truncation, not a lever for brevity; the instruction does the work, not a token cut that risks cutting off a legitimately long document mid-sentence.

## Out of scope (explicit)

- No changes to `docReviewRemaining`/`docGenerationRemaining` quota logic, gating, or the two features' independence — confirmed both routes already use separate fields and separate code paths; this design adds nothing that touches the other service.
- No use of the empty/unpopulated `LegislationDoc` Mongo collection or the 8-law `APPROVED_SOURCES` whitelist for verification — matches the direction to mirror chat's actual current (web-search) pattern instead.
- No change to how citations are parsed/stored for the *consultation* (chat) feature — `parseAnswer`/`CITATION_DELIM` are untouched; the new verification is prose-in/prose-out, no structured citation storage added to `GeneratedDocument`.
- No new document types, no changes to `GenerateDocSchema`'s `{ type, details }` contract.

## Testing

No test runner configured. Verify with `npm run lint`, `npx tsc --noEmit`, and a manual dev-server check: generate a document, confirm the Sources section survives (verified or original-on-fallback — toggle `OPENROUTER_WEB_SEARCH=off` to confirm the fallback path leaves the original citations intact), confirm the Generate button stays disabled until city/date/required party names are filled per type, and spot-check that a generated document and a document-review/improve response both read noticeably tighter than before (no filler sentences) while `docGenerationRemaining`/`docReviewRemaining` still deduct exactly as before, independently.

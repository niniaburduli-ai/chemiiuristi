# Chat Legal-Answer Escalation & Error Handling — Design

## Goal

Fix two problems in the consultation chat pipeline (`src/app/api/chat/route.ts`):

1. Real law covers a question, but the cheap lexical keyword search misses it (wording mismatch, e.g. typo'd or informal phrasing) → user wrongly gets "not found in approved sources."
2. Infrastructure failures (matsne fetch blocked by WAF, OpenRouter call throws) are indistinguishable from a genuine "law doesn't address this" — both show the same `NOT_FOUND_MSG`, which reads as if the service searched thoroughly and came up empty, when actually it never got to search at all.

Both fixes stay cheap: no new infra, no new API key, no new persistent job. Reuses the `verifyLegalCitations` web-search pattern already built for document generation ([openrouter.ts:435](../../../src/lib/legal/openrouter.ts#L435)).

## Current pipeline (kept as Tier 1)

Unchanged for the common case: classify law(s) via `expandQuery` → fetch the matched `APPROVED_SOURCES` → lexical stem-score via `searchSources` → cheap `ANSWER_MODEL` drafts the answer strictly from that fetched text. This stays the default path — fastest, cheapest, no web call. Today's `searchWebContext` call (line 63) runs unconditionally on *every* request just to add supplementary "practical context" — this is removed from the default path; it becomes part of the escalation tier below, invoked only when actually needed. That alone cuts the expensive `:online` model call from 100% of requests to only the ones that need it.

## Tier 2: escalation on lexical miss

Triggered only when Tier 1's `searchSources` returns zero matches **and** the sources fetched fine (i.e. the law text was available but no article scored a hit — today's exact bug).

New function `verifyChatAnswer(question, draftAnswer)` in `openrouter.ts`, sibling to `verifyLegalCitations`, same shape (`WEB_MODEL()`, same 20s abort, same fail-open-to-`null` contract):

1. Draft an answer using `ANSWER_MODEL`'s own Georgian-law knowledge (system prompt gains a fallback rule: when no source text is supplied, answer from general knowledge but mark the citation block as unverified).
2. Pass that draft to `verifyChatAnswer`, which web-searches **restricted to matsne.gov.ge / www.matsne.gov.ge only** (same `isAllowedHost` check reused, not a new trust boundary — matches the earlier decision that only the official registry counts as a legal source) to confirm the cited articles actually exist and actually say what the draft claims.
3. Outcomes:
   - Confirmed → return the answer with the verified citations.
   - Verify finds no supporting provision anywhere → genuine `NOT_FOUND_MSG` (clean outcome, the law really is silent — this is now the *only* path that produces it, besides the model itself invoking rule 7).
   - Verify call itself throws (network/API error) → technical error (see below), never silently downgraded to `NOT_FOUND_MSG`.

No new model tier is introduced beyond what already exists in the codebase (`ANSWER_MODEL` cheap, `WEB_MODEL()` web-capable) — Tier 2 simply uses the pricier call *conditionally* instead of on every request.

## Error handling: technical error vs. genuine not-found

New constant in `openrouter.ts`:

```ts
export const TECHNICAL_ERROR_MSG =
  "ტექნიკური შეფერხება იურიდიულ რეესტრთან დაკავშირებისას — გთხოვთ სცადოთ მოგვიანებით.";
```

Every spot in `route.ts` that currently forces `NOT_FOUND_MSG` on an infra failure switches to `TECHNICAL_ERROR_MSG`:

- `fetched.length === 0` (all approved-source fetches failed) — this branch, after the retry below, means matsne was unreachable, not that the law is silent. Always technical now.
- The `generateLegalAnswer` try/catch (line 106-120) — currently returns `{ error, detail }` with HTTP 502; changes to return `{ answer: TECHNICAL_ERROR_MSG }` with 200, so the client's existing `data.answer ?? data.error` handling needs no branching.
- A thrown/failed `verifyChatAnswer` call in Tier 2.

The *only* remaining path to `NOT_FOUND_MSG` is a clean outcome: sources fetched fine, and either lexical search + Tier 2 verify both ran to completion and found nothing, or the model itself outputs the sentinel per system-prompt rule 7.

**Quota:** no change needed. `Consultation.create` / `consultationsRemaining` decrement already only runs after a full successful answer ([route.ts:146-152](../../../src/app/api/chat/route.ts#L146-L152)) — both `NOT_FOUND_MSG` and `TECHNICAL_ERROR_MSG` return before that code, so neither ever deducts. A failed or unanswered question costs nothing; the user just asks again.

## Retry + circuit breaker (cost-saving, cheap)

- **One extra retry** at the route level around the `Promise.all(selected.map(fetchApprovedSource...))` batch: if every fetch in the batch fails, wait ~800ms and retry the whole batch once before declaring a technical error. `fetchApprovedSource` already retries twice internally per URL ([fetch-source.ts:21](../../../src/lib/legal/fetch-source.ts#L21)); this adds one more layer above that for transient WAF blips.
- **Circuit breaker:** a small in-memory counter (same `globalThis` pattern as the existing fetch cache) tracks consecutive full-batch failures. After 3 consecutive failures, skip fetch attempts entirely for 2 minutes and return `TECHNICAL_ERROR_MSG` immediately — avoids hammering matsne during a real outage and avoids burning draft/verify model calls on requests already doomed to fail. Resets on any success.

## Cache TTL

`TTL_MS` in `fetch-source.ts` goes from 6 hours to 7 days (configurable later via env if ever needed, not now — YAGNI). Laws don't change hourly; this cuts matsne fetch volume roughly 28x with no behavior change, directly addressing "don't re-check files 4 times a day."

## Client changes (`chat-client.tsx` + `dictionaries.ts`)

- New sentinel `TECHNICAL_ERROR_MSG` constant mirroring the existing `NOT_FOUND_MSG` one (line 37), checked in both the JSON-response branch (line 76) and the streamed-response branch (line 119) — mapped to a new dictionary key `technicalError` instead of reusing `notFound`.
- `dictionaries.ts` gains `technicalError` in both `ka` and `en`:
  - ka: "ტექნიკური შეფერხება იურიდიულ რეესტრთან დაკავშირებისას — გთხოვთ სცადოთ მოგვიანებით."
  - en: "Technical difficulty connecting to the legal registry. Please try again later."

## Out of scope

- No embeddings, no vector store, no new API key/provider.
- No change to `APPROVED_SOURCES` trust boundary beyond what's already decided (matsne.gov.ge only, still).
- No document-generation/review changes — this is chat (`/api/chat`) only; `verifyLegalCitations` is reused as a pattern, not modified.
- No admin-facing "force refresh sources" control — out of scope, can follow up later if the longer TTL ever causes a stale-law complaint.
- No audit/failed-query logging — explicitly rejected earlier as unnecessary extra code/DB writes.

## Testing

No test runner configured. Verify manually:
- A question with a clean lexical hit (e.g. an existing working question) still answers via Tier 1 only — confirm via logs/timing that no web call fires.
- The originally-reported question (informal wording for a real law, zero lexical hits) now escalates to Tier 2 and returns a real answer instead of `NOT_FOUND_MSG`.
- Temporarily break `OPENROUTER_API_KEY` or point an approved source URL at a 404 to simulate an infra failure — confirm the user sees the new "technical difficulty" message, not `NOT_FOUND_MSG`, and `consultationsRemaining` is not decremented.
- Confirm the circuit breaker trips after 3 consecutive simulated fetch failures and short-circuits without further matsne/model calls, then resets after 2 minutes or on a success.
- `npm run lint` and `npx tsc --noEmit` clean.

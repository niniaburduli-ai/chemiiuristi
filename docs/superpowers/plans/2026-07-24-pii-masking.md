# PII Masking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mask 4 structured PII types (personal ID, phone, email, bank IBAN) in user-authored text before it reaches OpenRouter, across all 4 AI flows (chat, generate, review, review/improve), and restore the original values in whatever the user/DB ultimately sees.

**Architecture:** Two new pure-logic modules (`lib/privacy/pii-mask.ts`, `lib/privacy/pii-unmask-stream.ts`) plus surgical edits to the 4 route handlers and 4 system prompts. No changes to `ai-call.ts`, `openrouter-stream-core.ts`, `legal/openrouter.ts`'s call functions, `query-understanding.ts`, or `embeddings.ts` — they keep receiving plain strings at their existing parameters, just already-masked ones.

**Tech Stack:** TypeScript, no new dependencies. This repo has no test runner configured — verification is manual, via ad-hoc scripts run directly with `node <file>.ts` (Node 24 strips TS types natively, confirmed working) and deleted afterward, plus `npx tsc --noEmit` for type-checking the route edits.

## Global Constraints

- Mask **exactly 4 types**: personal ID (11 digits), phone (9 digits starting with `5`), email, Georgian bank IBAN (`GE` + 2 digits + 2 letters + 16 digits). No names, companies, or addresses — out of scope per the spec.
- Tag format: `[TYPE_N]` — `[ID_1]`, `[PHONE_1]`, `[EMAIL_1]`, `[BANK_1]`. Same original value reuses the same tag within one request.
- Detection order is fixed: **EMAIL → BANK → ID → PHONE** (email must run before ID so an 11-digit email local-part isn't grabbed by the ID regex first).
- Mask only the field the user actually typed for this request. Never scan retrieved law text, system prompts, or few-shot examples.
- The tag↔original map lives only for the duration of one request (a local variable). Never persisted to DB, never logged, never cached.
- This app's own database always stores the original, unmasked text — masking only affects what leaves the server toward OpenRouter.
- No new npm dependencies.

---

## Task 1: Core masking module

**Files:**
- Create: `src/lib/privacy/pii-mask.ts`

**Interfaces:**
- Produces: `PiiType` (`"EMAIL" | "BANK" | "ID" | "PHONE"`), `PiiMap` (`Map<string, string>`, tag → original), `maskPII(text: string): { masked: string; map: PiiMap }`, `unmaskPII(text: string, map: PiiMap): string`, `TAG_RE` (exported `RegExp`, reused by Task 2).

- [ ] **Step 1: Write the module**

```ts
/** @module pii-mask
 *
 * Masks the four high-precision, deterministically-detectable PII types
 * before any text reaches OpenRouter, and restores them afterward. The
 * returned map is per-call only — callers must never persist or log it.
 */

export type PiiType = "EMAIL" | "BANK" | "ID" | "PHONE";

export type PiiMap = Map<string, string>;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const BANK_RE = /\bGE\d{2}[A-Z]{2}\d{16}\b/g;
const ID_RE = /\b\d{11}\b/g;
const PHONE_RE = /\b5\d{8}\b/g;

/** Order matters: EMAIL must run before ID/PHONE — an email whose local
 * part is 11 digits (e.g. `12345678901@gmail.com`) would otherwise get
 * consumed by the ID regex first, since the digits sit at a word boundary
 * either way. BANK before ID/PHONE keeps intent explicit even though IBAN's
 * digit run can't actually collide (it's preceded by letters, so `\b` never
 * lands mid-token there). */
const PASSES: { type: PiiType; re: RegExp }[] = [
  { type: "EMAIL", re: EMAIL_RE },
  { type: "BANK", re: BANK_RE },
  { type: "ID", re: ID_RE },
  { type: "PHONE", re: PHONE_RE },
];

/** Matches any tag this module can produce — reused by pii-unmask-stream.ts
 * so both modules agree on exactly what counts as a tag. */
export const TAG_RE = /\[(?:EMAIL|BANK|ID|PHONE)_\d+\]/g;

/** Scan `text` for the 4 PII types and replace each match with a `[TYPE_n]`
 * tag. The same original value always reuses the same tag within one call. */
export function maskPII(text: string): { masked: string; map: PiiMap } {
  const map: PiiMap = new Map();
  const valueToTag = new Map<string, string>();
  const counts: Record<PiiType, number> = { EMAIL: 0, BANK: 0, ID: 0, PHONE: 0 };

  let masked = text;
  for (const { type, re } of PASSES) {
    masked = masked.replace(re, (match) => {
      const existing = valueToTag.get(match);
      if (existing) return existing;
      counts[type] += 1;
      const tag = `[${type}_${counts[type]}]`;
      valueToTag.set(match, tag);
      map.set(tag, match);
      return tag;
    });
  }

  return { masked, map };
}

/** Replace every `[TYPE_n]` tag in `text` with its original value from
 * `map`. A tag with no map entry (the model hallucinated one, or wrote a
 * number that doesn't exist) is left as-is rather than stripped. */
export function unmaskPII(text: string, map: PiiMap): string {
  return text.replace(TAG_RE, (tag) => map.get(tag) ?? tag);
}
```

- [ ] **Step 2: Write and run a throwaway verification script**

Create a temporary file `src/lib/privacy/__check.ts` (relative import needs
the literal `.ts` extension because this runs under Node's own loader, not
the Next.js/TypeScript bundler):

```ts
import { maskPII, unmaskPII } from "./pii-mask.ts";

const sample =
  "მოქირავნე ID 01234567890, ტელ 599112233, ელფოსტა giorgi@example.com, " +
  "ანგარიში GE29TB7523045063700002. ID 01234567890 კიდევ ერთხელ. " +
  "ტელ 599112233 ისევ.";

const { masked, map } = maskPII(sample);
console.log("MASKED:", masked);

const checks: [string, boolean][] = [
  ["round-trip restores original", unmaskPII(masked, map) === sample],
  ["ID not leaked", !masked.includes("01234567890")],
  ["phone not leaked", !masked.includes("599112233")],
  ["email not leaked", !masked.includes("giorgi@example.com")],
  ["bank not leaked", !masked.includes("GE29TB7523045063700002")],
  ["repeated ID reuses tag", (masked.match(/\[ID_1\]/g) ?? []).length === 2],
  ["repeated phone reuses tag", (masked.match(/\[PHONE_1\]/g) ?? []).length === 2],
  ["unknown tag left alone", unmaskPII("see [ID_99]", new Map()) === "see [ID_99]"],
  [
    "email-first ordering: 11-digit local part isn't grabbed by ID regex",
    maskPII("12345678901@gmail.com").masked === "[EMAIL_1]",
  ],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(ok ? "PASS" : "FAIL", "-", label);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log("ALL OK");
```

Run: `node src/lib/privacy/__check.ts`
Expected: every line prints `PASS`, ending with `ALL OK`. Fix `pii-mask.ts`
and re-run until all checks pass.

- [ ] **Step 3: Delete the throwaway script**

```bash
rm src/lib/privacy/__check.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/privacy/pii-mask.ts
git commit -m "feat(privacy): add PII masking core module"
```

---

## Task 2: Streaming-safe unmask helper

**Files:**
- Create: `src/lib/privacy/pii-unmask-stream.ts`

**Interfaces:**
- Consumes: `unmaskPII`, `PiiMap` from `./pii-mask` (Task 1).
- Produces: `PiiUnmaskStream` class with `push(chunk: string): string` and `finish(): string`, used by chat and generate route handlers (Tasks 4, 5).

- [ ] **Step 1: Write the module**

```ts
/** @module pii-unmask-stream
 *
 * Streaming-safe counterpart to unmaskPII: a `[TYPE_n]` token can arrive
 * split across two SSE chunks, so a naive per-chunk replace would leak half
 * a tag to the browser. Buffers only what might still become a tag — same
 * incremental-boundary technique as DelimiterSplitter
 * (src/lib/streaming/delimiter-splitter.ts), but for an open-ended pattern
 * instead of one fixed literal.
 */

import { unmaskPII, type PiiMap } from "./pii-mask";

export class PiiUnmaskStream {
  private buffer = "";

  constructor(private readonly map: PiiMap) {}

  /** Feed the next chunk; returns the portion now safe to emit, with every
   * complete tag already replaced by its original value. */
  push(chunk: string): string {
    this.buffer = unmaskPII(this.buffer + chunk, this.map);

    // Hold back from the last unresolved "[" onward — it might still grow
    // into a tag once more chunks arrive. "Unresolved" means no "]" appears
    // after it: a "]" after it means either it was already replaced above,
    // or it's unrelated bracket text that fully closed within this buffer
    // (e.g. a `[LESSOR_NAME]`-style placeholder some prompts already use) —
    // either way there's nothing left to wait for.
    const openIdx = this.buffer.lastIndexOf("[");
    if (openIdx === -1) {
      const safe = this.buffer;
      this.buffer = "";
      return safe;
    }
    const hasClose = this.buffer.indexOf("]", openIdx) !== -1;
    if (hasClose) {
      const safe = this.buffer;
      this.buffer = "";
      return safe;
    }
    const safe = this.buffer.slice(0, openIdx);
    this.buffer = this.buffer.slice(openIdx);
    return safe;
  }

  /** Call once the source stream has ended: final replace pass on whatever
   * is still held back (an unresolved "[" at this point can't be completed
   * by anything more, so it's returned as-is). */
  finish(): string {
    const safe = unmaskPII(this.buffer, this.map);
    this.buffer = "";
    return safe;
  }
}
```

- [ ] **Step 2: Write and run a throwaway verification script**

Create `src/lib/privacy/__check.ts`:

```ts
import { maskPII } from "./pii-mask.ts";
import { PiiUnmaskStream } from "./pii-unmask-stream.ts";

const original = "დარეკეთ 599112233 ან მოგვწერეთ giorgi@example.com დღეს.";
const { masked, map } = maskPII(original);

// Simulate the tag getting split across two SSE chunks, mid-bracket.
const splitPoint = masked.indexOf("[PHONE_1]") + 3; // right inside "[PH|ONE_1]"
const chunk1 = masked.slice(0, splitPoint);
const chunk2 = masked.slice(splitPoint);

const stream = new PiiUnmaskStream(map);
const out1 = stream.push(chunk1);
const out2 = stream.push(chunk2);
const out3 = stream.finish();
const result = out1 + out2 + out3;

const checks: [string, boolean][] = [
  ["no raw tag leaked across the split", !result.includes("[PHONE_1]") && !result.includes("[PH")],
  ["full text reconstructed correctly", result === original],
  ["first push never emits a half-open bracket", !out1.endsWith("[") && !out1.includes("[PH")],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(ok ? "PASS" : "FAIL", "-", label);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log("ALL OK");
```

Run: `node src/lib/privacy/__check.ts`
Expected: every line `PASS`, ending `ALL OK`.

- [ ] **Step 3: Delete the throwaway script**

```bash
rm src/lib/privacy/__check.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/privacy/pii-unmask-stream.ts
git commit -m "feat(privacy): add streaming-safe PII unmask helper"
```

---

## Task 3: System prompt tag-preservation instructions

**Files:**
- Modify: `src/lib/legal/openrouter.ts` (`SYSTEM_PROMPT`)
- Modify: `src/app/api/generate/route.ts` (`SYSTEM_KA`, `SYSTEM_EN`)
- Modify: `src/lib/legal/document-analysis.ts` (`ANALYSIS_SYSTEM_PROMPT`, `IMPROVEMENT_SYSTEM_PROMPT`)

**Interfaces:**
- Consumes: nothing new — these are string constants, edited in place.
- Produces: nothing new — no exported signatures change.

This task adds one instruction to each of the 4 prompts telling the model to
reproduce `[TYPE_n]` tokens exactly. Two of the four prompts (`SYSTEM_KA`/
`SYSTEM_EN` and `IMPROVEMENT_SYSTEM_PROMPT`) already contain bracket-related
instructions that would otherwise conflict with this, so those two need a
carve-out, not just an addition.

- [ ] **Step 1: Add the instruction to `SYSTEM_PROMPT` in `src/lib/legal/openrouter.ts`**

Find the end of the `SYSTEM_PROMPT` array (the line with rule 11, just
before `].join("\n");` — currently the last two array entries are):

```ts
  `11. ${STRICT_BREVITY_RULE}`,
  "ეს წესი ეხება მხოლოდ ფორმას (შესავალს, თავაზიან კლიშეებს, გამეორებას, დასკვნით შეჯამებას) — არასოდეს ამართლებს რომელიმე მუხლის, პუნქტის, ქვეპუნქტის, გამონაკლისის ან საჭირო ქვეთემის გამოტოვებას. წესები 3 და 6ა–6გ (ყველა შესაბამისი დებულების სრული, ამომწურავი მოცვა) აქტუალობას არ კარგავს და აღემატება ამ წესს კონფლიქტის შემთხვევაში.",
].join("\n");
```

Replace with (adds rule 12):

```ts
  `11. ${STRICT_BREVITY_RULE}`,
  "ეს წესი ეხება მხოლოდ ფორმას (შესავალს, თავაზიან კლიშეებს, გამეორებას, დასკვნით შეჯამებას) — არასოდეს ამართლებს რომელიმე მუხლის, პუნქტის, ქვეპუნქტის, გამონაკლისის ან საჭირო ქვეთემის გამოტოვებას. წესები 3 და 6ა–6გ (ყველა შესაბამისი დებულების სრული, ამომწურავი მოცვა) აქტუალობას არ კარგავს და აღემატება ამ წესს კონფლიქტის შემთხვევაში.",
  "",
  "12. კრიტიკულია — შეკითხვის ტექსტში შეიძლება გხვდეს ნიშნები ზუსტად ამ ფორმატით: [ID_1], [PHONE_1], [EMAIL_1], [BANK_1]. ეს პირადი მონაცემების დაცული ჩანაცვლებებია. თუ პასუხში საჭიროა მათი გამოყენება, გადაიტანე ისინი ზუსტად, სიმბოლო-სიმბოლოზე, უცვლელად — არასოდეს თარგმნო, არასოდეს შეცვალო ფორმატი და არასოდეს ჩათვალო ის ცარიელ placeholder-ად.",
].join("\n");
```

- [ ] **Step 2: Add the carve-out to `SYSTEM_KA` in `src/app/api/generate/route.ts`**

Find:

```ts
მონაცემები (კრიტიკულია):
- გამოიყენე ზუსტად ის მონაცემები, რომლებიც მომხმარებელმა დეტალებში მოგაწოდა.
- არასოდეს დატოვო ცარიელი ველი, ფრჩხილები [ ] ან სხვა placeholder ტექსტში. თუ რომელიმე დამატებითი დეტალი (მაგ. ტელეფონი, ელფოსტა) დეტალებში საერთოდ არ არის მოწოდებული — უბრალოდ არ ჩართო ეს დეტალი დოკუმენტში, ნაცვლად ცარიელი placeholder-ის დაწერისა.
- დოკუმენტი უნდა იყოს სრულად შევსებული, დასრულებული და პირდაპირ გამოსაყენებელი, ყოველგვარი ხელით შესავსები ველის გარეშე.
```

Replace with:

```ts
მონაცემები (კრიტიკულია):
- გამოიყენე ზუსტად ის მონაცემები, რომლებიც მომხმარებელმა დეტალებში მოგაწოდა.
- არასოდეს დატოვო ცარიელი ველი, ფრჩხილები [ ] ან სხვა placeholder ტექსტში. თუ რომელიმე დამატებითი დეტალი (მაგ. ტელეფონი, ელფოსტა) დეტალებში საერთოდ არ არის მოწოდებული — უბრალოდ არ ჩართო ეს დეტალი დოკუმენტში, ნაცვლად ცარიელი placeholder-ის დაწერისა.
- გამონაკლისი ზემოთ მოცემულ წესთან: დეტალებში შეიძლება გხვდეს ნიშნები ზუსტად ამ ფორმატით — [ID_1], [PHONE_1], [EMAIL_1], [BANK_1]. ეს არ არის ცარიელი placeholder; ეს რეალური პირადი მონაცემია დაცული სახით. გამოიყენე ეს ნიშნები ზუსტად ისე, როგორც წერია, სწორ ადგილას დოკუმენტში — არასოდეს შეცვალო, თარგმნო ან წაშალო.
- დოკუმენტი უნდა იყოს სრულად შევსებული, დასრულებული და პირდაპირ გამოსაყენებელი, ყოველგვარი ხელით შესავსები ველის გარეშე.
```

- [ ] **Step 3: Add the carve-out to `SYSTEM_EN` in `src/app/api/generate/route.ts`**

Find:

```ts
Data (critical):
- Use exactly the data the user provided in the details.
- Never leave a blank field, square brackets [ ], or other placeholder text in the output. If some additional detail (e.g. phone, email) was not provided in the details at all — simply omit that detail from the document instead of writing an empty placeholder.
- The document must be fully filled in, complete, and ready to use as-is, with no fields left for manual completion.
```

Replace with:

```ts
Data (critical):
- Use exactly the data the user provided in the details.
- Never leave a blank field, square brackets [ ], or other placeholder text in the output. If some additional detail (e.g. phone, email) was not provided in the details at all — simply omit that detail from the document instead of writing an empty placeholder.
- Exception to the rule above: the details may contain tokens in exactly this format — [ID_1], [PHONE_1], [EMAIL_1], [BANK_1]. These are not the empty placeholders the rule above tells you to avoid; they are real personal data in protected form. Use these tokens exactly as written, in the correct place in the document — never alter, translate, or remove them.
- The document must be fully filled in, complete, and ready to use as-is, with no fields left for manual completion.
```

- [ ] **Step 4: Add the instruction to `ANALYSIS_SYSTEM_PROMPT` in `src/lib/legal/document-analysis.ts`**

Find:

```ts
წესები:
- გამოავლინე 2-დან 8-მდე კონკრეტული რისკი, დოკუმენტის რეალურ შინაარსზე დაყრდნობით.
- category და severity მნიშვნელობები ზუსტად ზემოთ ჩამოთვლილთაგან უნდა იყოს, სხვა მნიშვნელობა დაუშვებელია.
- "explanation" ველი დაწერე მაქსიმუმ 1-2 მოკლე წინადადებით (დაახლოებით 25 სიტყვამდე) — მხოლოდ მთავარი პრობლემა და მისი შედეგი, ზედმეტი კონტექსტის გარეშე.
- უპასუხე ქართულ ენაზე, მხოლოდ JSON ობიექტით — არც ერთი დამატებითი სიტყვა ჯსონის გარეთ.`;
```

Replace with:

```ts
წესები:
- გამოავლინე 2-დან 8-მდე კონკრეტული რისკი, დოკუმენტის რეალურ შინაარსზე დაყრდნობით.
- category და severity მნიშვნელობები ზუსტად ზემოთ ჩამოთვლილთაგან უნდა იყოს, სხვა მნიშვნელობა დაუშვებელია.
- "explanation" ველი დაწერე მაქსიმუმ 1-2 მოკლე წინადადებით (დაახლოებით 25 სიტყვამდე) — მხოლოდ მთავარი პრობლემა და მისი შედეგი, ზედმეტი კონტექსტის გარეშე.
- დოკუმენტის ტექსტში შეიძლება გხვდეს ნიშნები ზუსტად ამ ფორმატით: [ID_1], [PHONE_1], [EMAIL_1], [BANK_1] — ეს პირადი მონაცემების დაცული ჩანაცვლებებია. თუ მათ "summary", "explanation" ან "recommendation" ველებში ახსენებ, გადაიტანე ისინი ზუსტად, უცვლელად.
- უპასუხე ქართულ ენაზე, მხოლოდ JSON ობიექტით — არც ერთი დამატებითი სიტყვა ჯსონის გარეთ.`;
```

- [ ] **Step 5: Add the carve-out to `IMPROVEMENT_SYSTEM_PROMPT` in `src/lib/legal/document-analysis.ts`**

Find:

```ts
წესები:
- თუ დოკუმენტში აკლია ან ბუნდოვანია კონკრეტული მონაცემი (მაგ. სახელი, თარიღი, მისამართი), ნუ გამოიგონებ მას და ნურც შეკითხვას დასვამ — ჩასვი placeholder კვადრატულ ფრჩხილებში, ინგლისურად, UPPER_SNAKE_CASE ფორმატით, მაგალითად [LESSOR_NAME], [DATE], [ADDRESS].
- findings ასახავდეს შესწორებული ტექსტის დარჩენილ რისკებს, არა თავდაპირველისას — თუ ყველა რისკი გამოსწორდა, დააბრუნე ცარიელი მასივი.
```

Replace with:

```ts
წესები:
- თუ დოკუმენტში აკლია ან ბუნდოვანია კონკრეტული მონაცემი (მაგ. სახელი, თარიღი, მისამართი), ნუ გამოიგონებ მას და ნურც შეკითხვას დასვამ — ჩასვი placeholder კვადრატულ ფრჩხილებში, ინგლისურად, UPPER_SNAKE_CASE ფორმატით, მაგალითად [LESSOR_NAME], [DATE], [ADDRESS].
- ეს ცალკეა ზემოთაღწერილი ახალი placeholder-ის შექმნისგან: ტექსტში შეიძლება უკვე გხვდეს ნიშნები ზუსტად ამ ფორმატით — [ID_1], [PHONE_1], [EMAIL_1], [BANK_1]. ეს რეალური პირადი მონაცემია დაცული სახით, რომელიც უკვე დოკუმენტში იყო. გადაიტანე ეს ნიშნები ზუსტად, უცვლელად, სადაც არ უნდა გამოჩნდეს "revisedText"-სა თუ findings-ის ველებში.
- findings ასახავდეს შესწორებული ტექსტის დარჩენილ რისკებს, არა თავდაპირველისას — თუ ყველა რისკი გამოსწორდა, დააბრუნე ცარიელი მასივი.
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors (these are string-literal edits only).

- [ ] **Step 7: Commit**

```bash
git add src/lib/legal/openrouter.ts src/app/api/generate/route.ts src/lib/legal/document-analysis.ts
git commit -m "feat(privacy): tell AI prompts to preserve PII mask tokens verbatim"
```

---

## Task 4: Wire masking into the chat route

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `maskPII`, `unmaskPII`, `PiiMap` from `@/lib/privacy/pii-mask` (Task 1); `PiiUnmaskStream` from `@/lib/privacy/pii-unmask-stream` (Task 2).
- Produces: no new exports — internal route logic only.

- [ ] **Step 1: Add imports**

Find:

```ts
import { DelimiterSplitter } from "@/lib/streaming/delimiter-splitter";
import { encodeReset, encodeMeta } from "@/lib/streaming/chat-protocol";
```

Replace with:

```ts
import { DelimiterSplitter } from "@/lib/streaming/delimiter-splitter";
import { encodeReset, encodeMeta } from "@/lib/streaming/chat-protocol";
import { maskPII, unmaskPII, type PiiMap } from "@/lib/privacy/pii-mask";
import { PiiUnmaskStream } from "@/lib/privacy/pii-unmask-stream";
```

- [ ] **Step 2: Update `tryWebFallback` to accept the masked question + map, and unmask its result**

Find:

```ts
async function tryWebFallback(
  userId: string,
  isAdmin: boolean,
  quotaSplit: QuotaSplit | null,
  question: string,
  priorCostUsd: number,
  keywords?: string[]
): Promise<Response> {
  const web = await answerViaWebSearch(question, keywords);
  const costUsd = priorCostUsd + web.costUsd;
  const prose = web.answer?.prose.trim();
  if (web.answer && prose && prose !== NOT_FOUND_MSG) {
    await setCachedAnswer(question, { answer: prose, legalBasis: [], webSources: web.answer.sources });
    return finalizeAnswer({
      userId,
      isAdmin,
      quotaSplit,
      question,
      answer: prose,
      legalBasis: [],
      webSources: web.answer.sources,
      modelTier: "web",
      costUsd,
    });
  }
  return NextResponse.json(
    { answer: NOT_FOUND_MSG, legalBasis: [] },
    { status: 200 }
  );
}
```

Replace with:

```ts
async function tryWebFallback(
  userId: string,
  isAdmin: boolean,
  quotaSplit: QuotaSplit | null,
  question: string,
  maskedQuestion: string,
  piiMap: PiiMap,
  priorCostUsd: number,
  keywords?: string[]
): Promise<Response> {
  const web = await answerViaWebSearch(maskedQuestion, keywords);
  const costUsd = priorCostUsd + web.costUsd;
  const prose = web.answer?.prose.trim();
  const unmaskedProse = prose ? unmaskPII(prose, piiMap) : prose;
  if (web.answer && unmaskedProse && unmaskedProse !== NOT_FOUND_MSG) {
    await setCachedAnswer(maskedQuestion, { answer: unmaskedProse, legalBasis: [], webSources: web.answer.sources });
    return finalizeAnswer({
      userId,
      isAdmin,
      quotaSplit,
      question,
      answer: unmaskedProse,
      legalBasis: [],
      webSources: web.answer.sources,
      modelTier: "web",
      costUsd,
    });
  }
  return NextResponse.json(
    { answer: NOT_FOUND_MSG, legalBasis: [] },
    { status: 200 }
  );
}
```

- [ ] **Step 3: Mask the question right after it's read**

Find:

```ts
  const question = parsed.data.question;

  await dbConnect();
```

Replace with:

```ts
  const question = parsed.data.question;
  const { masked: maskedQuestion, map: piiMap } = maskPII(question);

  await dbConnect();
```

- [ ] **Step 4: Use the masked question for the cache lookup**

Find:

```ts
  const { value: cached, embedding: questionEmbedding } = await getCachedAnswer(question);
```

Replace with:

```ts
  const { value: cached, embedding: questionEmbedding } = await getCachedAnswer(maskedQuestion);
```

(Leave the `if (cached) { return finalizeAnswer({ ..., question, ... }) }` block right after this unchanged — `question` there stays the original, and `cached.answer` is already unmasked from when it was first stored.)

- [ ] **Step 5: Use the masked question for query expansion**

Find:

```ts
  const expanded = await expandQuery(question);
```

Replace with:

```ts
  const expanded = await expandQuery(maskedQuestion);
```

- [ ] **Step 6: Pass the masked question + map to both `tryWebFallback` call sites**

Find (first occurrence):

```ts
  if (fetched.length === 0) {
    return tryWebFallback(session.user.id, isAdmin, quotaSplit, question, expanded.costUsd, expanded.keywords);
  }
```

Replace with:

```ts
  if (fetched.length === 0) {
    return tryWebFallback(session.user.id, isAdmin, quotaSplit, question, maskedQuestion, piiMap, expanded.costUsd, expanded.keywords);
  }
```

Find (second occurrence):

```ts
  const matches = searchSources(fetched, searchQuery, 10);
  if (matches.length === 0) {
    return tryWebFallback(session.user.id, isAdmin, quotaSplit, question, expanded.costUsd, expanded.keywords);
  }
```

Replace with:

```ts
  const matches = searchSources(fetched, searchQuery, 10);
  if (matches.length === 0) {
    return tryWebFallback(session.user.id, isAdmin, quotaSplit, question, maskedQuestion, piiMap, expanded.costUsd, expanded.keywords);
  }
```

- [ ] **Step 7: Use the masked question for web context + the grounded prompt**

Find:

```ts
  const web = expanded.needsWebContext ? await searchWebContext(question) : null;
  const userPrompt = buildGroundedPrompt(
    question,
    matches.map((m) => ({ ...m, lawTitle: cleanLawName(m.lawTitle) })),
    web?.summary
  );
```

Replace with:

```ts
  const web = expanded.needsWebContext ? await searchWebContext(maskedQuestion) : null;
  const userPrompt = buildGroundedPrompt(
    maskedQuestion,
    matches.map((m) => ({ ...m, lawTitle: cleanLawName(m.lawTitle) })),
    web?.summary
  );
```

- [ ] **Step 8: Pass the masked question into `runChatStream`**

Find:

```ts
        const gen = runChatStream(messages, matches, question, expanded.keywords, web);
```

Replace with:

```ts
        const gen = runChatStream(messages, matches, maskedQuestion, expanded.keywords, web);
```

(`runChatStream`'s internal NOT_FOUND branch forwards this same value into its own `answerViaWebSearch` call — passing the masked question here covers that path too, no change needed inside `runChatStream` itself.)

- [ ] **Step 9: Unmask the live-streamed chunks**

Find:

```ts
      let outcome: ChatOutcome;
      try {
        const gen = runChatStream(messages, matches, maskedQuestion, expanded.keywords, web);
        let r = await gen.next();
        while (!r.done) {
          const ev = r.value;
          controller.enqueue(
            encoder.encode(ev.type === "chunk" ? ev.text : encodeReset())
          );
          r = await gen.next();
        }
        outcome = r.value;
      } catch {
        outcome = { kind: "technical_error" };
      }
```

Replace with:

```ts
      let outcome: ChatOutcome;
      let piiStream = new PiiUnmaskStream(piiMap);
      try {
        const gen = runChatStream(messages, matches, maskedQuestion, expanded.keywords, web);
        let r = await gen.next();
        while (!r.done) {
          const ev = r.value;
          if (ev.type === "chunk") {
            controller.enqueue(encoder.encode(piiStream.push(ev.text)));
          } else {
            piiStream = new PiiUnmaskStream(piiMap);
            controller.enqueue(encoder.encode(encodeReset()));
          }
          r = await gen.next();
        }
        const trailing = piiStream.finish();
        if (trailing) controller.enqueue(encoder.encode(trailing));
        outcome = r.value;
      } catch {
        outcome = { kind: "technical_error" };
      }
```

- [ ] **Step 10: Unmask the final answer before it's cached/stored**

Find:

```ts
      await setCachedAnswer(
        question,
        { answer: outcome.text, legalBasis: outcome.legalBasis, webSources: outcome.webSources },
        questionEmbedding
      );
```

Replace with:

```ts
      const unmaskedAnswer = unmaskPII(outcome.text, piiMap);

      await setCachedAnswer(
        maskedQuestion,
        { answer: unmaskedAnswer, legalBasis: outcome.legalBasis, webSources: outcome.webSources },
        questionEmbedding
      );
```

Find (a few lines later, inside the same block):

```ts
      const saveOps: Promise<unknown>[] = [
        Consultation.create({
          userId: session.user.id,
          question,
          answer: outcome.text,
          sources,
          modelTier: outcome.modelTier,
          costUsd: expanded.costUsd + (web?.costUsd ?? 0) + outcome.costUsd,
        }),
      ];
```

Replace with:

```ts
      const saveOps: Promise<unknown>[] = [
        Consultation.create({
          userId: session.user.id,
          question,
          answer: unmaskedAnswer,
          sources,
          modelTier: outcome.modelTier,
          costUsd: expanded.costUsd + (web?.costUsd ?? 0) + outcome.costUsd,
        }),
      ];
```

- [ ] **Step 11: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If `tryWebFallback`'s new parameter list doesn't match a call site, the error will point at the exact line — fix by re-checking Step 6.

- [ ] **Step 12: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(privacy): mask PII before chat OpenRouter calls, unmask on the way out"
```

---

## Task 5: Wire masking into the generate route

**Files:**
- Modify: `src/app/api/generate/route.ts`

**Interfaces:**
- Consumes: `maskPII`, `unmaskPII` from `@/lib/privacy/pii-mask` (Task 1); `PiiUnmaskStream` from `@/lib/privacy/pii-unmask-stream` (Task 2).

- [ ] **Step 1: Add imports**

Find:

```ts
import { DelimiterSplitter } from "@/lib/streaming/delimiter-splitter";
import { encodeMeta } from "@/lib/streaming/chat-protocol";
```

Replace with:

```ts
import { DelimiterSplitter } from "@/lib/streaming/delimiter-splitter";
import { encodeMeta } from "@/lib/streaming/chat-protocol";
import { maskPII, unmaskPII } from "@/lib/privacy/pii-mask";
import { PiiUnmaskStream } from "@/lib/privacy/pii-unmask-stream";
```

- [ ] **Step 2: Mask `details` before building the prompt**

Find:

```ts
  const locale = parsed.data.locale;
  const typeName = docTypeLabel(parsed.data.type, locale);
  const userMsg =
    locale === "en"
      ? `Document type: ${typeName}\n\nDetails:\n${parsed.data.details}`
      : `დოკუმენტის ტიპი: ${typeName}\n\nდეტალები:\n${parsed.data.details}`;
```

Replace with:

```ts
  const locale = parsed.data.locale;
  const typeName = docTypeLabel(parsed.data.type, locale);
  const { masked: maskedDetails, map: piiMap } = maskPII(parsed.data.details);
  const userMsg =
    locale === "en"
      ? `Document type: ${typeName}\n\nDetails:\n${maskedDetails}`
      : `დოკუმენტის ტიპი: ${typeName}\n\nდეტალები:\n${maskedDetails}`;
```

- [ ] **Step 3: Unmask the streamed document body as it's emitted**

Find:

```ts
      const splitter = new DelimiterSplitter(CITATIONS_DELIM);
      let full = "";
      let midStreamError = false;
      let generationCostUsd = 0;
      try {
        let r = await deltas.next();
        while (!r.done) {
          full += r.value;
          const safe = splitter.push(r.value);
          if (safe) controller.enqueue(encoder.encode(safe));
          r = await deltas.next();
        }
        generationCostUsd = r.value ?? 0;
        const { prose } = splitter.finish();
        if (prose) controller.enqueue(encoder.encode(prose));
      } catch {
        midStreamError = true;
      }
```

Replace with:

```ts
      const splitter = new DelimiterSplitter(CITATIONS_DELIM);
      const piiStream = new PiiUnmaskStream(piiMap);
      let full = "";
      let midStreamError = false;
      let generationCostUsd = 0;
      try {
        let r = await deltas.next();
        while (!r.done) {
          full += r.value;
          const safe = splitter.push(r.value);
          if (safe) controller.enqueue(encoder.encode(piiStream.push(safe)));
          r = await deltas.next();
        }
        generationCostUsd = r.value ?? 0;
        const { prose } = splitter.finish();
        if (prose) controller.enqueue(encoder.encode(piiStream.push(prose)));
        const trailing = piiStream.finish();
        if (trailing) controller.enqueue(encoder.encode(trailing));
      } catch {
        midStreamError = true;
      }
```

- [ ] **Step 4: Unmask `content` and `legalBasis` before they're saved**

Find:

```ts
      const delimIndex = full.indexOf(CITATIONS_DELIM);
      const body_ = (delimIndex === -1 ? full : full.slice(0, delimIndex)).trim();
      // Defense in depth: strip stray leading "#"/"##" heading markers in
      // case the model doesn't fully comply with the no-markdown-headers
      // instruction. Applied here (once, on the full text) rather than
      // per-chunk during streaming, since a heading marker split across a
      // chunk boundary can't be reliably detected mid-stream — the version
      // sent to the browser live may occasionally show a stray "#" in that
      // rare case, but the authoritative `content` below (what's actually
      // saved, and what the client swaps to once the stream ends) is always
      // fully stripped either way.
      const content = body_.replace(/^#{1,6}\s*/gm, "");
      const citationsSection =
        delimIndex === -1 ? "" : full.slice(delimIndex + CITATIONS_DELIM.length).trim();
```

Replace with:

```ts
      const delimIndex = full.indexOf(CITATIONS_DELIM);
      const body_ = (delimIndex === -1 ? full : full.slice(0, delimIndex)).trim();
      // Defense in depth: strip stray leading "#"/"##" heading markers in
      // case the model doesn't fully comply with the no-markdown-headers
      // instruction. Applied here (once, on the full text) rather than
      // per-chunk during streaming, since a heading marker split across a
      // chunk boundary can't be reliably detected mid-stream — the version
      // sent to the browser live may occasionally show a stray "#" in that
      // rare case, but the authoritative `content` below (what's actually
      // saved, and what the client swaps to once the stream ends) is always
      // fully stripped either way.
      const content = unmaskPII(body_.replace(/^#{1,6}\s*/gm, ""), piiMap);
      const citationsSection =
        delimIndex === -1 ? "" : full.slice(delimIndex + CITATIONS_DELIM.length).trim();
```

Find:

```ts
      let legalBasis = citationsSection;
      let citationsCostUsd = 0;
      const cachedCitations = await getCachedCitations(parsed.data.type, locale);
      if (cachedCitations) {
        legalBasis = cachedCitations;
      } else if (citationsSection) {
        const verified = await verifyLegalCitations(typeName, citationsSection);
        if (verified) {
          legalBasis = verified.text;
          citationsCostUsd = verified.costUsd;
          await setCachedCitations(parsed.data.type, verified.text, locale);
        }
      }

      const title = `${typeName} — ${new Date().toISOString().slice(0, 10)}`;
```

Replace with:

```ts
      let legalBasis = citationsSection;
      let citationsCostUsd = 0;
      const cachedCitations = await getCachedCitations(parsed.data.type, locale);
      if (cachedCitations) {
        legalBasis = cachedCitations;
      } else if (citationsSection) {
        const verified = await verifyLegalCitations(typeName, citationsSection);
        if (verified) {
          legalBasis = verified.text;
          citationsCostUsd = verified.costUsd;
          await setCachedCitations(parsed.data.type, verified.text, locale);
        }
      }
      legalBasis = unmaskPII(legalBasis, piiMap);

      const title = `${typeName} — ${new Date().toISOString().slice(0, 10)}`;
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat(privacy): mask PII before document-generation OpenRouter calls"
```

---

## Task 6: Wire masking into the review route

**Files:**
- Modify: `src/app/api/review/route.ts`

**Interfaces:**
- Consumes: `maskPII`, `unmaskPII` from `@/lib/privacy/pii-mask` (Task 1).

- [ ] **Step 1: Add import**

Find:

```ts
import { callOpenRouterChat } from "@/lib/ai-call";
import { ReviewDocTextSchema } from "@/lib/validators";
```

Replace with:

```ts
import { callOpenRouterChat } from "@/lib/ai-call";
import { maskPII, unmaskPII } from "@/lib/privacy/pii-mask";
import { ReviewDocTextSchema } from "@/lib/validators";
```

- [ ] **Step 2: Mask the document text before the call, unmask the response after**

Find:

```ts
  let raw: string;
  let costUsd = 0;
  try {
    const result = await callOpenRouterChat(
      [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: `გაანალიზე ეს დოკუმენტი:\n\n${text}` },
      ],
      undefined,
      6000
    );
    raw = result.content;
    costUsd = result.costUsd;
  } catch (err) {
```

Replace with:

```ts
  const { masked: maskedText, map: piiMap } = maskPII(text);

  let raw: string;
  let costUsd = 0;
  try {
    const result = await callOpenRouterChat(
      [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: `გაანალიზე ეს დოკუმენტი:\n\n${maskedText}` },
      ],
      undefined,
      6000
    );
    raw = unmaskPII(result.content, piiMap);
    costUsd = result.costUsd;
  } catch (err) {
```

(`text` itself — used a few lines later for `sourceText: text` in `DocumentReview.create` — stays untouched, still the original unmasked document.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/review/route.ts
git commit -m "feat(privacy): mask PII before document-review OpenRouter calls"
```

---

## Task 7: Wire masking into the review/improve route

**Files:**
- Modify: `src/app/api/review/improve/route.ts`

**Interfaces:**
- Consumes: `maskPII`, `unmaskPII` from `@/lib/privacy/pii-mask` (Task 1).

- [ ] **Step 1: Add import**

Find:

```ts
import { callOpenRouterChat } from "@/lib/ai-call";
import { DocumentImproveSchema } from "@/lib/validators";
```

Replace with:

```ts
import { callOpenRouterChat } from "@/lib/ai-call";
import { maskPII, unmaskPII } from "@/lib/privacy/pii-mask";
import { DocumentImproveSchema } from "@/lib/validators";
```

- [ ] **Step 2: Mask the composed user message before the call, unmask the response after**

Find:

```ts
  const userMessage = buildImprovementUserMessage({
    baseText,
    findings: currentFindings,
    instruction,
  });

  let raw: string;
  let costUsd = 0;
  try {
    const result = await callOpenRouterChat(
      [
        { role: "system", content: IMPROVEMENT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      undefined,
      16000
    );
    raw = result.content;
    costUsd = result.costUsd;
  } catch (err) {
```

Replace with:

```ts
  const userMessage = buildImprovementUserMessage({
    baseText,
    findings: currentFindings,
    instruction,
  });
  const { masked: maskedUserMessage, map: piiMap } = maskPII(userMessage);

  let raw: string;
  let costUsd = 0;
  try {
    const result = await callOpenRouterChat(
      [
        { role: "system", content: IMPROVEMENT_SYSTEM_PROMPT },
        { role: "user", content: maskedUserMessage },
      ],
      undefined,
      16000
    );
    raw = unmaskPII(result.content, piiMap);
    costUsd = result.costUsd;
  } catch (err) {
```

(This is the one place the whole composed message is masked as a unit rather
than a single field — `baseText` + `findings` + `instruction` are all
user/user-doc-derived, with no trusted static content mixed in, so there's
nothing at risk of a false-positive corrupting law text.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/review/improve/route.ts
git commit -m "feat(privacy): mask PII before document-improvement OpenRouter calls"
```

---

## Task 8: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify chat**

In the browser, sign in and ask on `/chat`: a Georgian legal question that
embeds a personal ID, phone, email, and IBAN, e.g. (adjust to a real
question so the answer pipeline has something to ground on):

> "ჩემი ID 01234567890, ტელეფონი 599112233, ელფოსტა giorgi@example.com,
> ანგარიში GE29TB7523045063700002. რა უფლებები მაქვს დამქირავებლად?"

Expected: the streamed answer displays correctly (no visible `[ID_1]`-style
tag, no truncation around the tag). Open the Network tab, inspect the
request/response — the response body should never contain the literal
tagged values as `[ID_1]` (only real text, or none of that data if the
answer just doesn't reference it). Check the saved consultation in
`/dashboard` shows the real values if the answer happens to echo them.

- [ ] **Step 3: Verify document generate**

On `/generate`, fill in details for a document (e.g. demand letter) that
include a personal ID, phone, email, and IBAN. Expected: the generated
document shows the real values in the right place (not `[ID_1]`), and the
saved document (reload `/dashboard`) also shows real values.

- [ ] **Step 4: Verify document review**

On the review page, paste a short document containing the same 4 PII
samples. Expected: the analysis findings/summary — if they mention the data
at all — show the real values, not tags.

- [ ] **Step 5: Verify review/improve**

From the review just created, request an improvement (e.g. "add a payment
deadline"). Expected: the revised text preserves the real values, not tags.

- [ ] **Step 6: Confirm nothing masked leaked into logs**

Check the terminal running `npm run dev` for the duration of steps 2–5.
Expected: no request/response body logging exists in this codebase already
(confirmed during design — chat/route.ts only logs
`` `[chat] answer tier served: ...` ``, no user text) — so there's nothing to
verify beyond "no new logging was added." If any `console.log` of a message
body was added during this plan's implementation, remove it now.

- [ ] **Step 7: Final full type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

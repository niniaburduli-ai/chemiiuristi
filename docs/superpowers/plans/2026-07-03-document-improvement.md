# Interactive Document Improvement Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users request an AI-corrected version of an already-analyzed document, with bracket placeholders for missing data, follow-up questions for ambiguous data, and re-scored risk findings on the correction — all from a new "Improve" section in the existing document analysis modal.

**Architecture:** New `POST /api/review/improve` route loads a user's `DocumentReview`, sends its text (or latest revision) plus prior findings/questions/instruction/answers to the same OpenRouter model used for initial analysis, and appends the parsed result to a `revisions[]` array on the review. The modal gains an instruction textarea + button that calls this route and renders the revision (text, findings, recommendations, open questions with inline answer fields).

**Tech Stack:** Next.js 16 App Router (route handler), Mongoose 9 (schema change), Zod 4 (request validation), existing hand-rolled OpenRouter client (`callOpenRouterChat`) — no Vercel AI SDK, no new dependencies.

## Global Constraints

- Next.js pinned at `next@16.2.6`, React `19.2.4`, TypeScript strict — read `node_modules/next/dist/docs/` before writing App Router code if unsure of an API.
- Zod validation required on every new API route input (per `CLAUDE.md` backend conventions).
- No Vercel AI SDK / `@ai-sdk/*` usage — this feature follows the existing hand-rolled OpenRouter REST pattern (`src/lib/ai-call.ts`), matching `/api/review` and `/api/chat`.
- No test runner configured in this repo — verification steps use `npx tsc --noEmit`, `npm run lint`, and manual dev-server/browser checks (per `CLAUDE.md`: "No test runner configured yet").
- Georgian (`ka`) is the default locale; every new user-facing string needs both `ka` and `en` entries in `src/lib/i18n/dictionaries.ts`.
- Do not modify unrelated files. `src/app/api/dev/flitt-simulate/route.ts` and other in-flight changes on this branch are out of scope.

---

### Task 1: Add optional `maxTokens` param to `callOpenRouterChat`

**Files:**
- Modify: `src/lib/ai-call.ts` (whole file, 32 lines)

**Interfaces:**
- Produces: `callOpenRouterChat(messages, model?, maxTokens = 2500): Promise<string>` — existing call sites (`src/app/api/review/route.ts`, `src/lib/legal/openrouter.ts` if any) keep working unchanged since the new param is optional with the same default the code already hardcoded.

- [ ] **Step 1: Edit the file**

Replace the full contents of `src/lib/ai-call.ts` with:

```ts
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = () =>
  process.env.OPENROUTER_ANSWER_MODEL ||
  process.env.OPENROUTER_MODEL ||
  "openai/gpt-4o-mini";

export async function callOpenRouterChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model?: string,
  maxTokens = 2500
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: model ?? MODEL(), messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (existing call site `callOpenRouterChat([...])` in `src/app/api/review/route.ts` still compiles — `maxTokens` defaults to 2500).

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai-call.ts
git commit -m "feat: allow custom max_tokens in callOpenRouterChat"
```

---

### Task 2: Add improvement types, prompt, and parser to `document-analysis.ts`

**Files:**
- Modify: `src/lib/legal/document-analysis.ts` (append after the existing `parseAnalysisResponse` function, i.e. after line 209)

**Interfaces:**
- Consumes: `RiskFinding`, `RISK_CATEGORIES`, `RISK_SEVERITIES` (existing, same file), private helpers `coerceCategory`, `coerceSeverity`, `extractJsonBlock` (existing, same file — reusable since new code lives in the same module).
- Produces: `DocumentImprovementResult` type, `DocumentRevision` type, `IMPROVEMENT_SYSTEM_PROMPT` constant, `buildImprovementUserMessage(input): string`, `parseImprovementResponse(raw): DocumentImprovementResult` — all consumed by Task 6's route.

- [ ] **Step 1: Append the new code**

Add this at the end of `src/lib/legal/document-analysis.ts` (after the existing `parseAnalysisResponse` function):

```ts
export interface DocumentImprovementResult {
  text: string;
  summary: string;
  findings: RiskFinding[];
  recommendations: string[];
  questions: string[];
}

export interface DocumentRevision extends DocumentImprovementResult {
  instruction: string;
  answers: Record<string, string>;
  createdAt: Date;
}

export const IMPROVEMENT_SYSTEM_PROMPT = `შენ ხარ ქართული იურიდიული დოკუმენტების რედაქტორი.
მოგეწოდება ხელშეკრულების ტექსტი და მასში გამოვლენილი რისკები. შენი ამოცანაა შეასწორო დოკუმენტი ამ რისკების გათვალისწინებით და დააბრუნო მხოლოდ JSON, ზუსტად ამ ფორმატით, დამატებითი ტექსტის ან ახსნის გარეშე:

{
  "revisedText": "შესწორებული დოკუმენტის სრული ტექსტი",
  "summary": "მოკლე შეჯამება 2-3 წინადადებით შესწორებული ვერსიის შესახებ",
  "findings": [
    {
      "category": "liability | financial | termination | compliance | confidentiality | obligations",
      "severity": "low | medium | high | critical",
      "title": "მოკლე სათაური",
      "explanation": "რატომ არის ეს რისკი",
      "recommendation": "კონკრეტული რჩევა ამ რისკთან დაკავშირებით"
    }
  ],
  "recommendations": ["ზოგადი რეკომენდაცია 1", "ზოგადი რეკომენდაცია 2"],
  "questions": ["დაზუსტების საჭიროების მქონე კითხვა 1"]
}

წესები:
- თუ დოკუმენტში აკლია კონკრეტული მონაცემი (მაგ. სახელი, თარიღი, მისამართი), ნუ გამოიგონებ მას — ჩასვი placeholder კვადრატულ ფრჩხილებში, ინგლისურად, UPPER_SNAKE_CASE ფორმატით, მაგალითად [LESSOR_NAME], [DATE], [ADDRESS].
- თუ ინფორმაცია ბუნდოვანია ან ეწინააღმდეგება ერთმანეთს (და არა უბრალოდ აკლია), ნუ გამოიგონებ პასუხს — დაამატე კონკრეტული შეკითხვა "questions" მასივში.
- findings ასახავდეს შესწორებული ტექსტის რისკებს, არა თავდაპირველისას.
- category და severity მნიშვნელობები ზუსტად ზემოთ ჩამოთვლილთაგან უნდა იყოს, სხვა მნიშვნელობა დაუშვებელია.
- თუ დამატებითი შეკითხვა არ გჭირდება, დააბრუნე ცარიელი "questions": [].
- უპასუხე ქართულ ენაზე, მხოლოდ JSON ობიექტით — არც ერთი დამატებითი სიტყვა ჯსონის გარეთ.`;

export function buildImprovementUserMessage(input: {
  baseText: string;
  findings: RiskFinding[];
  priorQuestions: string[];
  instruction: string;
  answers: Record<string, string>;
}): string {
  const parts: string[] = [`მიმდინარე დოკუმენტი:\n${input.baseText}`];

  if (input.findings.length > 0) {
    const findingsList = input.findings
      .map((f, i) => `${i + 1}. [${f.severity}/${f.category}] ${f.title} — ${f.explanation}`)
      .join("\n");
    parts.push(`გამოვლენილი რისკები:\n${findingsList}`);
  }

  if (input.priorQuestions.length > 0) {
    const questionsList = input.priorQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    parts.push(`წინა შეკითხვები:\n${questionsList}`);
  }

  const answerEntries = Object.entries(input.answers);
  if (answerEntries.length > 0) {
    const answersList = answerEntries
      .map(([q, a]) => `კითხვა: ${q}\nპასუხი: ${a}`)
      .join("\n\n");
    parts.push(`მომხმარებლის პასუხები:\n${answersList}`);
  }

  parts.push(
    input.instruction.trim()
      ? `მომხმარებლის მოთხოვნა: ${input.instruction.trim()}`
      : "შეასწორე ყველა გამოვლენილი რისკი."
  );

  return parts.join("\n\n");
}

export function parseImprovementResponse(raw: string): DocumentImprovementResult {
  const jsonText = extractJsonBlock(raw);
  let parsed: {
    revisedText?: unknown;
    summary?: unknown;
    findings?: unknown;
    recommendations?: unknown;
    questions?: unknown;
  };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const text = typeof parsed.revisedText === "string" ? parsed.revisedText.trim() : "";
  if (!text) throw new Error("AI response missing revisedText");

  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";

  const findingsRaw = Array.isArray(parsed.findings) ? parsed.findings : [];
  const findings: RiskFinding[] = findingsRaw
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      category: coerceCategory(f.category),
      severity: coerceSeverity(f.severity),
      title: typeof f.title === "string" ? f.title : "",
      explanation: typeof f.explanation === "string" ? f.explanation : "",
      recommendation: typeof f.recommendation === "string" ? f.recommendation : "",
    }))
    .filter((f) => f.title || f.explanation);

  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.filter((r): r is string => typeof r === "string")
    : [];

  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0)
    : [];

  return { text, summary, findings, recommendations, questions };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/legal/document-analysis.ts
git commit -m "feat: add document improvement prompt and parser"
```

---

### Task 3: Extend `DocumentReview` model with `sourceText` and `revisions`

**Files:**
- Modify: `src/lib/models/document-review.ts` (whole file, 31 lines)

**Interfaces:**
- Consumes: `RiskFinding`-shaped fields, `DocumentRevision` shape from Task 2 (structurally, not imported — Mongoose schema fields mirror it).
- Produces: `DocumentReview` model with `sourceText: string` and `revisions: DocumentRevisionSubdoc[]` fields, consumed by Task 4 (write) and Task 6 (read/write).

- [ ] **Step 1: Edit the file**

Replace the full contents of `src/lib/models/document-review.ts` with:

```ts
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { RISK_CATEGORIES, RISK_SEVERITIES } from "@/lib/legal/document-analysis";

const RiskFindingSchema = new Schema(
  {
    category: { type: String, enum: [...RISK_CATEGORIES], required: true },
    severity: { type: String, enum: [...RISK_SEVERITIES], required: true },
    title: { type: String, default: "" },
    explanation: { type: String, default: "" },
    recommendation: { type: String, default: "" },
  },
  { _id: false }
);

const DocumentRevisionSchema = new Schema(
  {
    text: { type: String, default: "" },
    summary: { type: String, default: "" },
    findings: { type: [RiskFindingSchema], default: [] },
    recommendations: { type: [String], default: [] },
    questions: { type: [String], default: [] },
    instruction: { type: String, default: "" },
    answers: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DocumentReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, default: "document" },
    summary: { type: String, required: true },
    findings: { type: [RiskFindingSchema], default: [] },
    recommendations: { type: [String], default: [] },
    sourceText: { type: String, default: "" },
    revisions: { type: [DocumentRevisionSchema], default: [] },
  },
  { timestamps: true }
);

export type DocumentReviewDoc = InferSchemaType<typeof DocumentReviewSchema> & { _id: unknown };

export const DocumentReview: Model<DocumentReviewDoc> =
  (models.DocumentReview as Model<DocumentReviewDoc>) ||
  model<DocumentReviewDoc>("DocumentReview", DocumentReviewSchema);
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/models/document-review.ts
git commit -m "feat: add sourceText and revisions fields to DocumentReview model"
```

---

### Task 4: Persist `sourceText` on initial analysis

**Files:**
- Modify: `src/app/api/review/route.ts:169-175`

**Interfaces:**
- Consumes: `DocumentReview` model from Task 3 (now accepts `sourceText`).

- [ ] **Step 1: Edit the `DocumentReview.create` call**

In `src/app/api/review/route.ts`, find:

```ts
  const review = await DocumentReview.create({
    userId: session.user.id,
    fileName,
    summary: analysis.summary,
    findings: analysis.findings,
    recommendations: analysis.recommendations,
  });
```

Replace with:

```ts
  const review = await DocumentReview.create({
    userId: session.user.id,
    fileName,
    summary: analysis.summary,
    findings: analysis.findings,
    recommendations: analysis.recommendations,
    sourceText: text,
  });
```

(`text` is already in scope — it's the truncated extracted text used for the analysis call a few lines above.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/review/route.ts
git commit -m "feat: persist source text on document review for later improvement"
```

---

### Task 5: Add `DocumentImproveSchema` Zod validator

**Files:**
- Modify: `src/lib/validators.ts` (append at end of file, after `AdminUserUpdateSchema`)

**Interfaces:**
- Produces: `DocumentImproveSchema`, `DocumentImproveInput` type — consumed by Task 6's route.

- [ ] **Step 1: Append the schema**

Add to the end of `src/lib/validators.ts`:

```ts
export const DocumentImproveSchema = z.object({
  reviewId: z.string().trim().min(1).max(64),
  instruction: z.string().trim().max(2000).optional().default(""),
  answers: z.record(z.string(), z.string().max(2000)).optional().default({}),
});
export type DocumentImproveInput = z.infer<typeof DocumentImproveSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (Zod 4's `z.record` takes both a key schema and a value schema — confirm against `node_modules/zod/package.json` version if this errors; the installed version is `^4.4.3`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat: add DocumentImproveSchema validator"
```

---

### Task 6: New `POST /api/review/improve` route

**Files:**
- Create: `src/app/api/review/improve/route.ts`

**Interfaces:**
- Consumes: `auth()` (`@/auth`), `dbConnect()` (`@/lib/db`), `User` model, `DocumentReview` model (Task 3), `callOpenRouterChat` (Task 1), `DocumentImproveSchema` (Task 5), `IMPROVEMENT_SYSTEM_PROMPT`/`buildImprovementUserMessage`/`parseImprovementResponse` (Task 2).
- Produces: `POST /api/review/improve` — request `{ reviewId, instruction?, answers? }`, response `201 { id, revision: { text, summary, findings, recommendations, questions, instruction, answers, createdAt } }`, or `401`/`403`/`404`/`400`/`502` error shapes matching `/api/review`'s conventions. Consumed by Task 8 (frontend).

- [ ] **Step 1: Write the route**

Create `src/app/api/review/improve/route.ts`:

```ts
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { DocumentReview } from "@/lib/models/document-review";
import { callOpenRouterChat } from "@/lib/ai-call";
import { DocumentImproveSchema } from "@/lib/validators";
import type { RiskFinding } from "@/lib/legal/document-analysis";
import {
  IMPROVEMENT_SYSTEM_PROMPT,
  buildImprovementUserMessage,
  parseImprovementResponse,
} from "@/lib/legal/document-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = DocumentImproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { reviewId, instruction, answers } = parsed.data;

  if (!isValidObjectId(reviewId)) {
    return NextResponse.json({ error: "Invalid reviewId" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.docReviewRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Document review quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }

  const review = await DocumentReview.findById(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (String(review.userId) !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const revisions = (review.revisions ?? []) as Array<{
    text: string;
    findings: RiskFinding[];
    questions: string[];
  }>;
  const latest = revisions[revisions.length - 1];
  const baseText = latest?.text || review.sourceText || "";
  if (!baseText) {
    return NextResponse.json(
      { error: "No source text available for this review" },
      { status: 400 }
    );
  }
  const currentFindings = (latest?.findings ?? review.findings ?? []) as RiskFinding[];
  const priorQuestions = latest?.questions ?? [];

  const userMessage = buildImprovementUserMessage({
    baseText,
    findings: currentFindings,
    priorQuestions,
    instruction,
    answers,
  });

  let raw: string;
  try {
    raw = await callOpenRouterChat(
      [
        { role: "system", content: IMPROVEMENT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      undefined,
      4000
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "AI service unavailable",
        detail: String(err instanceof Error ? err.message : err),
      },
      { status: 502 }
    );
  }

  let improvement;
  try {
    improvement = parseImprovementResponse(raw);
  } catch (err) {
    return NextResponse.json(
      {
        error: "AI returned an unreadable response",
        detail: String(err instanceof Error ? err.message : err),
      },
      { status: 502 }
    );
  }

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
  review.revisions.push(revision);
  await review.save();

  if (!isAdmin) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { docReviewRemaining: -1 } });
  }

  return NextResponse.json({ id: String(review._id), revision }, { status: 201 });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new warnings/errors for this file.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/review/improve/route.ts
git commit -m "feat: add POST /api/review/improve endpoint"
```

---

### Task 7: i18n strings for the improve section

**Files:**
- Modify: `src/lib/i18n/dictionaries.ts:268-298` (ka `documentAnalysis` block) and `:568-598` (en mirror)

**Interfaces:**
- Produces: `documentAnalysis.improve*` keys on both `ka` and `en` dicts — consumed by Task 8.

- [ ] **Step 1: Add ka keys**

In `src/lib/i18n/dictionaries.ts`, find the ka `documentAnalysis` block ending with (around line 297-298):

```ts
    viewAllCta: "ყველა ანალიზის ნახვა",
    resultsSavedNote: "შედეგი ინახება თქვენს ანგარიშში",
  },
```

Replace with:

```ts
    viewAllCta: "ყველა ანალიზის ნახვა",
    resultsSavedNote: "შედეგი ინახება თქვენს ანგარიშში",
    improveTitle: "დოკუმენტის გაუმჯობესება",
    improveInstructionPlaceholder: "მიუთითეთ კონკრეტულად რისი გასწორება გსურთ (არასავალდებულო)",
    improveCta: "დოკუმენტის გასწორება",
    improving: "მუშავდება...",
    improveRevisedTitle: "შესწორებული ვერსია",
    improveCopyButton: "კოპირება",
    improveCopied: "დაკოპირდა",
    improveFindingsLabel: "განახლებული რისკები",
    improveRecommendationsLabel: "განახლებული რეკომენდაციები",
    improveQuestionsTitle: "საჭიროა დაზუსტება",
    improveAnswerPlaceholder: "თქვენი პასუხი...",
    improveApplyAnswersCta: "პასუხების გაგზავნა",
  },
```

- [ ] **Step 2: Add en keys**

In the same file, find the en `documentAnalysis` block ending with (around line 596-598):

```ts
    viewAllCta: "View all analyses",
    resultsSavedNote: "Results are saved to your account",
  },
```

Replace with:

```ts
    viewAllCta: "View all analyses",
    resultsSavedNote: "Results are saved to your account",
    improveTitle: "Improve document",
    improveInstructionPlaceholder: "Tell it what to fix (optional)",
    improveCta: "Fix document",
    improving: "Working...",
    improveRevisedTitle: "Revised version",
    improveCopyButton: "Copy",
    improveCopied: "Copied",
    improveFindingsLabel: "Updated risks",
    improveRecommendationsLabel: "Updated recommendations",
    improveQuestionsTitle: "Needs your input",
    improveAnswerPlaceholder: "Your answer...",
    improveApplyAnswersCta: "Submit answers",
  },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (the `en` object is typed as `Dict = typeof ka`, so both blocks must have identical key sets — mismatched keys fail the build).

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/dictionaries.ts
git commit -m "feat: add i18n strings for document improvement section"
```

---

### Task 8: Frontend — Improve section in `DocumentAnalysisModal`

**Files:**
- Modify: `src/components/site/document-analysis-modal.tsx`

**Interfaces:**
- Consumes: `POST /api/review/improve` (Task 6), `documentAnalysis.improve*` i18n keys (Task 7), `RiskFindingCard` (existing), `Textarea` (`@/components/ui/textarea`, existing shadcn component), `toast` from `sonner` (already used elsewhere, e.g. `src/app/generate/generate-client.tsx:85`).

- [ ] **Step 1: Add imports**

At the top of `src/components/site/document-analysis-modal.tsx`, replace:

```ts
import { FileUp, Image as ImageIcon, Loader2, Plus, Sparkles, AlertCircle, X as XIcon } from "lucide-react";
```

with:

```ts
import { FileUp, Image as ImageIcon, Loader2, Plus, Sparkles, AlertCircle, X as XIcon, Wand2 } from "lucide-react";
```

And after the existing `import { Button } from "@/components/ui/button";` line, add:

```ts
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
```

- [ ] **Step 2: Add the `RevisionResult` type**

After the existing `type AnalysisResult = {...}` block (ends around line 34), add:

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
};

type ImproveStatus = "idle" | "loading" | "error";
```

- [ ] **Step 3: Add state**

After the existing `const [result, setResult] = useState<AnalysisResult | null>(null);` line, add:

```ts
  const [revision, setRevision] = useState<RevisionResult | null>(null);
  const [instructionText, setInstructionText] = useState("");
  const [answersDraft, setAnswersDraft] = useState<Record<string, string>>({});
  const [improveStatus, setImproveStatus] = useState<ImproveStatus>("idle");
  const [improveErrorKind, setImproveErrorKind] = useState<
    "unauthorized" | "quota" | "generic" | null
  >(null);
```

- [ ] **Step 4: Reset improve state on modal reset**

In the existing `reset()` function, after `setResult(null);`, add:

```ts
    setRevision(null);
    setInstructionText("");
    setAnswersDraft({});
    setImproveStatus("idle");
    setImproveErrorKind(null);
```

- [ ] **Step 5: Add `improve` and `applyAnswers` and `copyRevisedText` functions**

After the existing `analyze()` function (ends around line 189, right before `const analyzeDisabled = ...`), add:

```ts
  async function improve(instructionOverride?: string, answersOverride?: Record<string, string>) {
    if (!result) return;
    setImproveStatus("loading");
    setImproveErrorKind(null);
    try {
      const res = await fetch("/api/review/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: result.id,
          instruction: instructionOverride ?? instructionText,
          answers: answersOverride ?? {},
        }),
      });
      if (res.status === 401) {
        setImproveErrorKind("unauthorized");
        setImproveStatus("error");
        return;
      }
      if (res.status === 403) {
        setImproveErrorKind("quota");
        setImproveStatus("error");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setImproveErrorKind("generic");
        setImproveStatus("error");
        return;
      }
      setRevision(data.revision as RevisionResult);
      setAnswersDraft({});
      setImproveStatus("idle");
    } catch {
      setImproveErrorKind("generic");
      setImproveStatus("error");
    }
  }

  function applyAnswers() {
    improve("", answersDraft);
  }

  function copyRevisedText() {
    if (!revision) return;
    navigator.clipboard.writeText(revision.text);
    toast.success(t.improveCopied);
  }
```

- [ ] **Step 6: Render the Improve section**

In the `status === "results"` block, find the closing structure:

```tsx
            <p className="text-xs text-muted-foreground pt-2 border-t">{t.resultsSavedNote}</p>
            <Button variant="outline" className="w-full" onClick={reset}>
              {t.chooseFile}
            </Button>
          </div>
        )}
```

Replace with:

```tsx
            <p className="text-xs text-muted-foreground pt-2 border-t">{t.resultsSavedNote}</p>

            <div className="space-y-3 border-t pt-4">
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
                      <Button variant="ghost" size="sm" onClick={copyRevisedText}>
                        {t.improveCopyButton}
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                      {revision.text}
                    </pre>
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
                      <Button
                        onClick={applyAnswers}
                        disabled={
                          improveStatus === "loading" ||
                          revision.questions.every((q) => !answersDraft[q]?.trim())
                        }
                        className="w-full"
                      >
                        {t.improveApplyAnswersCta}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={reset}>
              {t.chooseFile}
            </Button>
          </div>
        )}
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: no new warnings/errors for this file.

- [ ] **Step 9: Commit**

```bash
git add src/components/site/document-analysis-modal.tsx
git commit -m "feat: add interactive improve section to document analysis modal"
```

---

### Task 9: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000` with no compile errors.

- [ ] **Step 2: Prepare a test document**

Create a plain `.txt` file (e.g. in the scratchpad, not committed) containing a short Georgian rental-agreement-style paragraph that (a) omits the lessor's name and a start date, and (b) has one ambiguous clause (e.g. conflicting notice periods in two sentences).

- [ ] **Step 3: Run the existing analysis flow**

Log in as a test user with `docReviewRemaining > 0` (or an admin account). Open the document analysis modal from the homepage, upload the test file, click "გაანალიზება" (Analyze). Confirm the existing results view renders summary/findings/recommendations as before (no regression).

- [ ] **Step 4: Trigger the improve flow**

In the new "დოკუმენტის გაუმჯობესება" section, leave the instruction blank and click "დოკუმენტის გასწორება". Confirm:
- A revised text block appears containing `[LESSOR_NAME]`-style bracket placeholders for the missing name/date.
- A "საჭიროა დაზუსტება" section lists at least one question about the ambiguous clause.
- Updated findings/recommendations render via the same `RiskFindingCard` styling as the initial results.

- [ ] **Step 5: Answer the follow-up question**

Type an answer into the question's textarea and click "პასუხების გაგზავნა". Confirm a new revision replaces the old one, and (if the ambiguity is now resolved) the questions list shrinks or empties.

- [ ] **Step 6: Confirm quota decrements**

Note the user's `docReviewRemaining` before Step 3 (via `/profile` or an admin users list). After Steps 3-5 (one analyze + two improve calls), confirm it decreased by 3 (assuming a non-admin test user). Confirm a 403 with the upgrade CTA appears once quota hits 0.

- [ ] **Step 7: Confirm persistence**

Reload the page and, if time allows, inspect the `DocumentReview` document for this review in MongoDB (via `mongosh "$MONGODB_URI"` or Compass) — confirm `sourceText` is populated and `revisions` has two entries with the expected `instruction`/`answers`/`questions` fields.

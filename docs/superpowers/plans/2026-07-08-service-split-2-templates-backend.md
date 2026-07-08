# Service Split Phase 2: Static Templates Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the zero-AI-cost static document template engine (4 types: rental-agreement, employment-contract, power-of-attorney, termination-notice) and its API route, decrementing the new `docTemplatesRemaining` counter from Phase 1. No frontend yet — verified via direct API calls in this phase; Phase 3 wires up the UI.

**Architecture:** A pure-function template module (`src/lib/legal/templates.ts`) holds the 4 Georgian legal-text bodies with `[PLACEHOLDER]` tokens and hardcoded legal-basis citations (pulled verbatim from matsne.gov.ge per the design spec, not AI-generated). `POST /api/templates` validates input, calls the pure interpolation function, saves a `GeneratedDocument` with `source: "template"`, decrements `docTemplatesRemaining` — no OpenRouter call anywhere in this path.

**Tech Stack:** Next.js 16 API route, Zod, Mongoose. No test runner — verify via `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual `curl`/Postman-style requests against the dev server.

## Global Constraints

- Zero AI calls in this entire feature — pure string interpolation only, per the spec's core cost-saving rationale.
- Blank optional fields render as `—` (em dash), never an empty string or a visible `[BRACKET]`.
- Legal basis text must match the exact format `parseDocumentLegalBasis` (`src/lib/legal/citations.ts:101-121`) already parses: law name on its own line, then `- მუხლი N` bullet lines — so the existing frontend renderer needs zero changes to display it (verified in Phase 3).
- Article citations are the ones already verified against live matsne.gov.ge text in the design spec (`docs/superpowers/specs/2026-07-08-service-split-static-templates-design.md`) — copy them verbatim, do not re-derive or paraphrase.
- Depends on Phase 1 (`docTemplatesRemaining` on User, `source` on GeneratedDocument) being merged first.

---

### Task 1: Static template content module

**Files:**
- Create: `src/lib/legal/templates.ts`

**Interfaces:**
- Produces: `TemplateType` (union of 4 string literals), `TEMPLATE_TYPES: Record<TemplateType, string>` (Georgian display names), `renderTemplate(type: TemplateType, answers: Record<string, string>): { title: string; content: string; legalBasis: string }`. Consumed by Task 2 (this phase) and Phase 3's frontend page.

- [ ] **Step 1: Write the module**

```ts
/**
 * Static (non-AI) document templates. Pure string interpolation — no
 * OpenRouter call anywhere in this file. Article citations were pulled
 * directly from the live official text at matsne.gov.ge on 2026-07-08 (Civil
 * Code: document/view/31702; Labor Code: document/view/1155567) — see
 * docs/superpowers/specs/2026-07-08-service-split-static-templates-design.md
 * for the verification notes. Do not edit citations without re-verifying
 * against matsne.gov.ge directly.
 */

export type TemplateType =
  | "rental-agreement"
  | "employment-contract"
  | "power-of-attorney"
  | "termination-notice";

export const TEMPLATE_TYPES: Record<TemplateType, string> = {
  "rental-agreement": "ბინის ქირავნობის ხელშეკრულება",
  "employment-contract": "შრომის ხელშეკრულება",
  "power-of-attorney": "მინდობილობა",
  "termination-notice": "შეტყობინება შრომითი ხელშეკრულების შეწყვეტის შესახებ",
};

export const TEMPLATE_TYPE_KEYS = Object.keys(TEMPLATE_TYPES) as TemplateType[];

type TemplateDef = {
  title: string;
  body: string;
  legalBasis: string;
};

/** Maps each template's [PLACEHOLDER] tokens to the form-field key that fills them. */
const PLACEHOLDER_FIELD: Record<TemplateType, Record<string, string>> = {
  "rental-agreement": {
    LANDLORD: "landlord", LANDLORD_ID: "landlordId", LANDLORD_ADDRESS: "landlordAddress", LANDLORD_PHONE: "landlordPhone",
    TENANT: "tenant", TENANT_ID: "tenantId", TENANT_ADDRESS: "tenantAddress", TENANT_PHONE: "tenantPhone",
    PROPERTY_ADDRESS: "address", RENT: "rent", PAYMENT_METHOD: "paymentMethod", BANK_ACCOUNT: "bankAccount", DURATION: "duration",
    CITY: "city", DOC_DATE: "docDate",
  },
  "employment-contract": {
    EMPLOYER: "employer", EMPLOYER_ID: "employerId", EMPLOYER_ADDRESS: "employerAddress",
    EMPLOYEE: "employee", EMPLOYEE_ID: "employeeId", EMPLOYEE_ADDRESS: "employeeAddress",
    POSITION: "position", SALARY: "salary", SALARY_PAYMENT_METHOD: "salaryPaymentMethod",
    BANK_ACCOUNT: "bankAccount", START_DATE: "startDate",
    CITY: "city", DOC_DATE: "docDate",
  },
  "power-of-attorney": {
    PRINCIPAL: "principal", PRINCIPAL_ID: "idNumber", PRINCIPAL_ADDRESS: "principalAddress",
    AGENT: "agent", AGENT_ID: "agentId", AGENT_ADDRESS: "agentAddress", SCOPE: "scope",
    CITY: "city", DOC_DATE: "docDate",
  },
  "termination-notice": {
    EMPLOYER: "employer", EMPLOYEE: "employee", EMPLOYEE_ID: "employeeId", EMPLOYEE_ADDRESS: "employeeAddress",
    REASON: "reason", LAST_DAY: "lastDay",
    CITY: "city", DOC_DATE: "docDate",
  },
};

const TEMPLATES: Record<TemplateType, TemplateDef> = {
  "rental-agreement": {
    title: "ბინის ქირავნობის ხელშეკრულება",
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი\n- მუხლი 531\n- მუხლი 552\n- მუხლი 553\n- მუხლი 558\n- მუხლი 559\n- მუხლი 561\n- მუხლი 563\n- მუხლი 564",
    body: `ბინის ქირავნობის ხელშეკრულება

1. **მხარეები**
გამქირავებელი: **[LANDLORD]**, პ/ნ **[LANDLORD_ID]**, მისამართი: [LANDLORD_ADDRESS], ტელ: [LANDLORD_PHONE]
დამქირავებელი: **[TENANT]**, პ/ნ **[TENANT_ID]**, მისამართი: [TENANT_ADDRESS], ტელ: [TENANT_PHONE]
ხელშეკრულება დაიდო ქ. **[CITY]**-ში, **[DOC_DATE]**-ს (შემდგომში — „მხარეები").

2. **ხელშეკრულების საგანი**
გამქირავებელი გადასცემს დამქირავებელს სარგებლობაში საცხოვრებელ ფართს მისამართზე: **[PROPERTY_ADDRESS]** (შემდგომში — „ფართი").

3. **ხელშეკრულების ვადა**
ხელშეკრულება ძალაშია **[DURATION]**-ის განმავლობაში, **[DOC_DATE]**-დან.

4. **ქირის ოდენობა და გადახდის წესი**
ყოველთვიური ქირა შეადგენს **[RENT]**-ს. გადახდის მეთოდი: **[PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**. ქირა გადაიხდება ყოველი საანგარიშო პერიოდის დასრულებისას, თუ მხარეები სხვაგვარად არ შეთანხმდებიან.

5. **უზრუნველყოფის თანხა (დეპოზიტი)**
დამქირავებელს შეიძლება დაეკისროს უზრუნველყოფის თანხის წარდგენა, რომელიც არ აღემატება ერთი თვის ქირის სამმაგ ოდენობას. წინასწარ გადახდილ თანხას ერიცხება კანონით დადგენილი პროცენტი და უბრუნდება დამქირავებელს ხელშეკრულების დასრულებისას.

6. **მხარეთა ვალდებულებები**
6.1. გამქირავებელი გადასცემს ფართს გამართულ, დანიშნულებისამებრ გამოსაყენებელ მდგომარეობაში.
6.2. დამქირავებელი იყენებს ფართს დანიშნულებისამებრ და ზრუნავს მის შენარჩუნებაზე.
6.3. ხელშეკრულების შეწყვეტისას დამქირავებელი აბრუნებს ფართს იმ მდგომარეობაში, რომელშიც მიიღო, ნორმალური ცვეთის გათვალისწინებით.

7. **ხელშეკრულების ვადამდე შეწყვეტა**
7.1. თუ დამქირავებელი არ იხდის ქირას ზედიზედ სამი თვის განმავლობაში, გამქირავებელს უფლება აქვს მოშალოს ხელშეკრულება ვადამდე.
7.2. განუსაზღვრელი ვადის შემთხვევაში, ნებისმიერ მხარეს შეუძლია მოშალოს ხელშეკრულება წერილობითი შეტყობინებით, სამთვიანი ვადის დაცვით, თუ მხარეები სხვა ვადაზე არ შეთანხმდნენ.
7.3. ხელშეკრულების შეწყვეტა ფორმდება წერილობით.

8. **დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თითო თითოეული მხარისთვის, თანაბარი იურიდიული ძალით.

გამქირავებელი: ____________ **[LANDLORD]**
დამქირავებელი: ____________ **[TENANT]**`,
  },
  "employment-contract": {
    title: "შრომის ხელშეკრულება",
    legalBasis: "საქართველოს შრომის კოდექსი\n- მუხლი 14\n- მუხლი 44\n- მუხლი 47\n- მუხლი 48",
    body: `შრომის ხელშეკრულება

1. **მხარეები**
დამსაქმებელი: **[EMPLOYER]**, ს/ნ **[EMPLOYER_ID]**, მისამართი: [EMPLOYER_ADDRESS]
დასაქმებული: **[EMPLOYEE]**, პ/ნ **[EMPLOYEE_ID]**, მისამართი: [EMPLOYEE_ADDRESS]
ხელშეკრულება დაიდო ქ. **[CITY]**-ში, **[DOC_DATE]**-ს.

2. **სამუშაოს დაწყება და ხანგრძლივობა**
დასაქმებული იწყებს მუშაობას **[START_DATE]**-დან. ხელშეკრულება დადებულია განუსაზღვრელი ვადით, თუ მხარეები წერილობით სხვაგვარად არ შეთანხმდებიან.

3. **თანამდებობა**
დასაქმებული ასრულებს **[POSITION]**-ის მოვალეობებს დამსაქმებლის მითითებების შესაბამისად.

4. **სამუშაო დრო და დასვენება**
სამუშაო დრო და დასვენების პერიოდები განისაზღვრება საქართველოს შრომის კოდექსისა და დამსაქმებლის შინაგანაწესის შესაბამისად (არსებობის შემთხვევაში).

5. **ანაზღაურება**
თანამდებობრივი სარგო შეადგენს **[SALARY]**-ს თვეში. გადახდის მეთოდი: **[SALARY_PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**. ზეგანაკვეთური სამუშაო ანაზღაურდება კანონმდებლობის შესაბამისად.

6. **შვებულება**
დასაქმებულს ეძლევა კანონმდებლობით გათვალისწინებული ანაზღაურებადი და ანაზღაურების გარეშე შვებულება.

7. **ხელშეკრულების შეწყვეტა**
ხელშეკრულების შეწყვეტა ხდება საქართველოს შრომის კოდექსის 47-ე და 48-ე მუხლებით დადგენილი საფუძვლებითა და წესით, წინასწარი წერილობითი შეტყობინებით. საბოლოო ანგარიშსწორება ხდება შეწყვეტიდან არაუგვიანეს 7 კალენდარული დღისა.

8. **დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თანაბარი იურიდიული ძალით.

დამსაქმებელი: ____________ **[EMPLOYER]**
დასაქმებული: ____________ **[EMPLOYEE]**`,
  },
  "power-of-attorney": {
    title: "მინდობილობა",
    legalBasis: "საქართველოს სამოქალაქო კოდექსი\n- მუხლი 107\n- მუხლი 108\n- მუხლი 109\n- მუხლი 110",
    body: `მინდობილობა

ქ. **[CITY]**, **[DOC_DATE]**

მე, **[PRINCIPAL]**, პ/ნ **[PRINCIPAL_ID]**, რეგისტრირებული მისამართზე: [PRINCIPAL_ADDRESS] (შემდგომში — „მინდობელი"), ვანიჭებ **[AGENT]**-ს, პ/ნ **[AGENT_ID]**, რეგისტრირებული მისამართზე: [AGENT_ADDRESS] (შემდგომში — „მინდობილი პირი"), წარმომადგენლობით უფლებამოსილებას შემდეგი მოქმედებების განსახორციელებლად:

**მინდობის ფარგლები:**
[SCOPE]

მინდობილი პირი ვალდებულია იმოქმედოს მინდობელის ინტერესების შესაბამისად, ამ მინდობილობის ფარგლებში.

უფლებამოსილება წყდება მისი ვადის გასვლით (თუ ვადა განისაზღვრა), მინდობილი პირის უარით, მინდობელის მიერ გაუქმებით, მინდობელის გარდაცვალებით ან დავალების შესრულებით. თუ ვადა არ არის მითითებული, მინდობილობა მოქმედებს გაუქმებამდე. უფლებამოსილების გაუქმებისას მინდობილი პირი ვალდებულია დაუბრუნოს მინდობელს მინდობილობის საბუთი.

შენიშვნა: კანონმდებლობით განსაზღვრულ შემთხვევებში (მაგ. უძრავი ქონების განკარგვა, სასამართლო წარმომადგენლობა) მინდობილობა საჭიროებს სანოტარო დამოწმებას.

მინდობელი: ____________ **[PRINCIPAL]**`,
  },
  "termination-notice": {
    title: "შეტყობინება შრომითი ხელშეკრულების შეწყვეტის შესახებ",
    legalBasis: "საქართველოს შრომის კოდექსი\n- მუხლი 44\n- მუხლი 47\n- მუხლი 48",
    body: `შეტყობინება შრომითი ხელშეკრულების შეწყვეტის შესახებ

ქ. **[CITY]**, **[DOC_DATE]**

დამსაქმებელი: **[EMPLOYER]**
დასაქმებული: **[EMPLOYEE]**, პ/ნ **[EMPLOYEE_ID]**, მისამართი: [EMPLOYEE_ADDRESS]

წინამდებარე შეტყობინებით გაცნობებთ, რომ თქვენთან დადებული შრომითი ხელშეკრულება წყდება საქართველოს შრომის კოდექსის 47-ე მუხლის შესაბამისად, შემდეგი საფუძვლით:

**შეწყვეტის საფუძველი:** [REASON]

**შრომითი ურთიერთობის ბოლო დღე:** **[LAST_DAY]**

შეტყობინება გამოგზავნილია საქართველოს შრომის კოდექსის 48-ე მუხლით დადგენილი წინასწარი გაფრთხილების ვადის დაცვით. კანონით გათვალისწინებულ შემთხვევებში დასაქმებულს ეკუთვნის შესაბამისი კომპენსაცია.

საბოლოო ანგარიშსწორება განხორციელდება შრომითი ურთიერთობის შეწყვეტიდან არაუგვიანეს 7 კალენდარული დღისა (შრომის კოდექსის 44-ე მუხლი).

დასაქმებულს უფლება აქვს, კანონმდებლობით დადგენილი წესით მოითხოვოს შეწყვეტის საფუძვლის წერილობითი დასაბუთება და გაასაჩივროს გადაწყვეტილება სასამართლოში.

____________ **[EMPLOYER]**`,
  },
};

/**
 * Interpolate a template's [PLACEHOLDER] tokens from the given answers map.
 * Missing/blank values render as "—" (never an empty string or a visible
 * bracket). Unknown placeholder tokens (typo in a template body) also render
 * as "—" rather than throwing, since this runs on every request.
 */
export function renderTemplate(
  type: TemplateType,
  answers: Record<string, string>
): { title: string; content: string; legalBasis: string } {
  const def = TEMPLATES[type];
  const fieldMap = PLACEHOLDER_FIELD[type];
  const content = def.body.replace(/\[([A-Z_]+)\]/g, (_, token: string) => {
    const fieldKey = fieldMap[token];
    const value = fieldKey ? answers[fieldKey]?.trim() : "";
    return value ? value : "—";
  });
  return { title: def.title, content, legalBasis: def.legalBasis };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/legal/templates.ts
git commit -m "feat: add static document template content module"
```

---

### Task 2: `POST /api/templates` route

**Files:**
- Create: `src/app/api/templates/route.ts`

**Interfaces:**
- Consumes: `TemplateType`, `TEMPLATE_TYPE_KEYS`, `renderTemplate` from Task 1; `GeneratedDocument` model (Phase 1 Task 2, `source` field); `User` model (`docTemplatesRemaining`, Phase 1 Task 1).
- Produces: `POST /api/templates` — request `{ type: TemplateType, answers: Record<string,string> }`, response `{ id, title, content, legalBasis }` (same shape as `/api/generate`'s response, so Phase 3's shared result panel needs zero branching).

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { GeneratedDocument } from "@/lib/models/generated-document";
import { TEMPLATE_TYPE_KEYS, renderTemplate, type TemplateType } from "@/lib/legal/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TemplateRequestSchema = z.object({
  type: z.enum(TEMPLATE_TYPE_KEYS as [string, ...string[]]),
  answers: z.record(z.string().max(1000)).refine((a) => Object.keys(a).length <= 40, {
    message: "Too many fields",
  }),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TemplateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { type, answers } = parsed.data;

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.docTemplatesRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Document template quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }

  const { title, content, legalBasis } = renderTemplate(type as TemplateType, answers);
  const fullTitle = `${title} — ${new Date().toISOString().slice(0, 10)}`;

  const doc = await GeneratedDocument.create({
    userId: session.user.id,
    title: fullTitle,
    type,
    content,
    legalBasis,
    source: "template",
  });

  if (!isAdmin) {
    await User.findByIdAndUpdate(session.user.id, { $inc: { docTemplatesRemaining: -1 } });
  }

  return NextResponse.json(
    { id: String(doc._id), title: fullTitle, content, legalBasis },
    { status: 201 }
  );
}
```

- [ ] **Step 2: Verify — typecheck and lint**

Run: `npx tsc --noEmit && npm run lint` — expected clean.

- [ ] **Step 3: Verify — manual API test**

Start dev server if not already running. Get a valid session cookie by logging in via the browser, then copy the `next-auth.session-token` (or `__Secure-next-auth.session-token` in production) cookie value, or simpler: use the browser devtools console on a logged-in page to run:

```js
fetch("/api/templates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "power-of-attorney",
    answers: {
      principal: "გიორგი გიორგაძე", idNumber: "01234567890", principalAddress: "თბილისი, ვაჟა-ფშაველას 10",
      agent: "ნინო ნინოშვილი", agentId: "09876543210", agentAddress: "თბილისი, რუსთაველის 5",
      scope: "საბანკო ანგარიშის მართვა", city: "თბილისი", docDate: "2026-07-08",
    },
  }),
}).then((r) => r.json()).then(console.log);
```

Expected: `201`-shaped JSON with `id`, `title`, `content` (all placeholders filled in, no literal `[BRACKET]` visible), `legalBasis` containing "საქართველოს სამოქალაქო კოდექსი" and 4 article bullet lines. Confirm in Mongo (or via `/api/admin/db/generateddocuments`) that a new `GeneratedDocument` row was created with `source: "template"` and `docTemplatesRemaining` decremented by 1 on the user.

Also test: omit an optional-in-spirit field (e.g. leave `landlordPhone` out entirely for a `rental-agreement` request) and confirm the corresponding spot in `content` renders `—`, not `undefined` or a literal bracket.

Also test the quota-exceeded path: manually set your test user's `docTemplatesRemaining` to `0` in Mongo, retry the request, confirm `403` and no new `GeneratedDocument` row is created.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/templates/route.ts
git commit -m "feat: add POST /api/templates route for static document generation"
```

---

### Task 3: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: all clean.

- [ ] **Step 2: Report back**

Confirm to the user: `/api/templates` works end-to-end via manual request (no UI yet — that's Phase 3), all 4 template types produce correctly interpolated Georgian legal text with real matsne.gov.ge citations, quota decrements correctly and blocks at zero, and none of this touched `/api/generate`'s existing behavior or quota.

# Service Split Phase 1: Data Model & Quota Plumbing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4th independent quota counter (`docTemplatesRemaining` / `docTemplates`) mirroring the existing `docGeneration`/`docReview` shape everywhere it appears, plus a `source` discriminator on `GeneratedDocument` and a `templates` feature flag — pure plumbing, no user-facing behavior change yet (nothing reads/writes the new fields until Phase 2/3).

**Architecture:** Every existing `docGeneration`/`docReview` sibling pair across the User/Plan mongoose models, `plans.ts`/`plans-db.ts`, `flitt.ts`, signup paths, `/api/user/me`, and the feature-flag system gets a `docTemplates` counterpart added in the identical pattern. This plan also fixes 2 pre-existing bugs (inconsistent signup grants, `/api/user/me` not exposing doc counters) since they're touched anyway and the fix is one-line each — flagged separately per step so they're reviewable independently.

**Tech Stack:** Mongoose, Zod, Next.js 16 API routes. No test runner — verify via `npx tsc --noEmit`, `npm run lint`, `npm run build`, and manual DB/API checks.

## Global Constraints

- Mirror `docGeneration`/`docReview` exactly — same option shapes, same defaults, same naming convention (`docTemplates`, `docTemplatesRemaining`, `includeDocTemplates`, `featuresDocTemplates`/`featuresDocTemplatesEn`).
- Don't touch `docGeneration`/`docReview` values or behavior — additive only.
- Actual numeric quota limits per plan tier are a placeholder for now (mirror `docGeneration`'s current default) — the user sets real numbers later via the admin panel (built in Phase 4).
- This phase must build and typecheck standalone even though nothing consumes the new fields yet (dead code until Phase 2/3 wire it up — that's expected and fine here).

---

### Task 1: User model — `docTemplatesRemaining` field

**Files:**
- Modify: `src/lib/models/user.ts:13`

**Interfaces:**
- Produces: `UserDoc.docTemplatesRemaining: number` (via `InferSchemaType`, automatic — no manual type edit needed).

- [ ] **Step 1: Add the field**

Current (line 12-14):
```ts
    consultationsRemaining: { type: Number, default: 1 },
    docGenerationRemaining: { type: Number, default: 1 },
    docReviewRemaining: { type: Number, default: 1 },
```

Replace with:
```ts
    consultationsRemaining: { type: Number, default: 1 },
    docGenerationRemaining: { type: Number, default: 1 },
    docReviewRemaining: { type: Number, default: 1 },
    docTemplatesRemaining: { type: Number, default: 1 },
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/models/user.ts
git commit -m "feat: add docTemplatesRemaining quota field to User model"
```

---

### Task 2: GeneratedDocument model — `source` discriminator

**Files:**
- Modify: `src/lib/models/generated-document.ts`

**Interfaces:**
- Produces: `GeneratedDocumentDoc.source: "ai" | "template"`, consumed by Phase 2's `/api/templates` route and Phase 3's history rendering.

- [ ] **Step 1: Add the field**

Current full file:
```ts
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const GeneratedDocumentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    legalBasis: { type: String, default: "" },
  },
  { timestamps: true }
);

export type GeneratedDocumentDoc = InferSchemaType<typeof GeneratedDocumentSchema> & { _id: unknown };

export const GeneratedDocument: Model<GeneratedDocumentDoc> =
  (models.GeneratedDocument as Model<GeneratedDocumentDoc>) ||
  model<GeneratedDocumentDoc>("GeneratedDocument", GeneratedDocumentSchema);
```

Replace with:
```ts
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const GeneratedDocumentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    legalBasis: { type: String, default: "" },
    // "ai" = drafted by /api/generate (complaint, demand-letter). "template" =
    // static interpolation by /api/templates (rental-agreement, employment-
    // contract, power-of-attorney, termination-notice). NOT required: existing
    // rows (created before this field existed) and /api/generate's create call
    // (until Phase 3 adds `source: "ai"` there) have no value — treat missing
    // as "ai" at read time. Deliberately not `required: true` so this schema
    // change can ship in Phase 1 without breaking /api/generate before Phase 3
    // updates it.
    source: { type: String, enum: ["ai", "template"] },
  },
  { timestamps: true }
);

export type GeneratedDocumentDoc = InferSchemaType<typeof GeneratedDocumentSchema> & { _id: unknown };

export const GeneratedDocument: Model<GeneratedDocumentDoc> =
  (models.GeneratedDocument as Model<GeneratedDocumentDoc>) ||
  model<GeneratedDocumentDoc>("GeneratedDocument", GeneratedDocumentSchema);
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` — expected clean. `source` is intentionally not `required`, so `src/app/api/generate/route.ts`'s existing `GeneratedDocument.create({...})` call keeps working unchanged for now — Phase 3 adds `source: "ai"` there for consistency (out of scope here, this task only changes the schema).

- [ ] **Step 3: Commit**

```bash
git add src/lib/models/generated-document.ts
git commit -m "feat: add source discriminator (ai|template) to GeneratedDocument model"
```

---

### Task 3: Plan model — `docTemplates` fields

**Files:**
- Modify: `src/lib/models/Plan.ts:20-38` (schema), `:43-71` (interface)

**Interfaces:**
- Produces: `PlanDoc.docTemplates: number`, `.includeDocTemplates: boolean`, `.featuresDocTemplates: string[]`, `.featuresDocTemplatesEn: string[]`.

- [ ] **Step 1: Add schema fields**

Current (lines 27-33):
```ts
    // Service-specific bullets — shown only when that service is enabled globally + per-plan.
    featuresDocGeneration: { type: [String], default: [] },
    featuresDocGenerationEn: { type: [String], default: [] },
    featuresDocReview: { type: [String], default: [] },
    featuresDocReviewEn: { type: [String], default: [] },
    includeDocGeneration: { type: Boolean, default: true },
    includeDocReview: { type: Boolean, default: true },
```

Replace with:
```ts
    // Service-specific bullets — shown only when that service is enabled globally + per-plan.
    featuresDocGeneration: { type: [String], default: [] },
    featuresDocGenerationEn: { type: [String], default: [] },
    featuresDocReview: { type: [String], default: [] },
    featuresDocReviewEn: { type: [String], default: [] },
    featuresDocTemplates: { type: [String], default: [] },
    featuresDocTemplatesEn: { type: [String], default: [] },
    includeDocGeneration: { type: Boolean, default: true },
    includeDocReview: { type: Boolean, default: true },
    includeDocTemplates: { type: Boolean, default: true },
```

And add `docTemplates` next to `docGeneration`/`docReview` (lines 21-23):
```ts
    consultations: { type: Number, default: 0, min: 0 },
    docGeneration: { type: Number, default: 0, min: 0 },
    docReview: { type: Number, default: 0, min: 0 },
```
becomes:
```ts
    consultations: { type: Number, default: 0, min: 0 },
    docGeneration: { type: Number, default: 0, min: 0 },
    docReview: { type: Number, default: 0, min: 0 },
    docTemplates: { type: Number, default: 0, min: 0 },
```

- [ ] **Step 2: Add `PlanDoc` interface fields**

Current interface fields (lines 53-63):
```ts
  consultations: number
  includeDocGeneration: boolean
  docGeneration: number
  includeDocReview: boolean
  docReview: number
  features: string[]
  featuresEn: string[]
  featuresDocGeneration: string[]
  featuresDocGenerationEn: string[]
  featuresDocReview: string[]
  featuresDocReviewEn: string[]
```

Replace with:
```ts
  consultations: number
  includeDocGeneration: boolean
  docGeneration: number
  includeDocReview: boolean
  docReview: number
  includeDocTemplates: boolean
  docTemplates: number
  features: string[]
  featuresEn: string[]
  featuresDocGeneration: string[]
  featuresDocGenerationEn: string[]
  featuresDocReview: string[]
  featuresDocReviewEn: string[]
  featuresDocTemplates: string[]
  featuresDocTemplatesEn: string[]
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expected clean (Task 4 fixes the now-incomplete `PlanData`/`DEFAULT_PLANS` shape in the same file family, so a transient type error between Task 3 and Task 4 committing is expected and fine — verify after Task 4 instead if `tsc` complains about `plans-db.ts` here).

- [ ] **Step 4: Commit**

```bash
git add src/lib/models/Plan.ts
git commit -m "feat: add docTemplates fields to Plan model"
```

---

### Task 4: `plans.ts` + `plans-db.ts` — limits, defaults, normalization

**Files:**
- Modify: `src/lib/plans.ts` (full file, 8 lines)
- Modify: `src/lib/plans-db.ts:6-38` (types), `:41-87` (DEFAULT_PLANS), `:89-121` (toData), `:175-186` (getPlanLimits)

**Interfaces:**
- Consumes: `PlanDoc` from Task 3.
- Produces: `PlanLimits.docTemplates: number`, `PlanData.docTemplates/includeDocTemplates/featuresDocTemplates[En]`, used by `flitt.ts` (Task 5) and every frontend/admin consumer in later phases.

- [ ] **Step 1: `plans.ts` — add `docTemplates` to each tier**

Current full file:
```ts
export const PLAN_LIMITS = {
  free:     { consultations: 9,    docGeneration: 3,    docReview: 1  },
  standard: { consultations: 29,   docGeneration: 19,   docReview: 9  },
  premium:  { consultations: 199,  docGeneration: 99,   docReview: 99 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
```

Replace with (placeholder numbers mirror `docGeneration` per this plan's constraint — user tunes later via admin):
```ts
export const PLAN_LIMITS = {
  free:     { consultations: 9,    docGeneration: 3,    docReview: 1,  docTemplates: 3   },
  standard: { consultations: 29,   docGeneration: 19,   docReview: 9,  docTemplates: 19  },
  premium:  { consultations: 199,  docGeneration: 99,   docReview: 99, docTemplates: 99  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
```

- [ ] **Step 2: `plans-db.ts` — `PlanData` type**

Current (lines 16-26):
```ts
  consultations: number
  includeDocGeneration: boolean
  docGeneration: number
  includeDocReview: boolean
  docReview: number
  features: string[]
  featuresEn: string[]
  featuresDocGeneration: string[]
  featuresDocGenerationEn: string[]
  featuresDocReview: string[]
  featuresDocReviewEn: string[]
```

Replace with:
```ts
  consultations: number
  includeDocGeneration: boolean
  docGeneration: number
  includeDocReview: boolean
  docReview: number
  includeDocTemplates: boolean
  docTemplates: number
  features: string[]
  featuresEn: string[]
  featuresDocGeneration: string[]
  featuresDocGenerationEn: string[]
  featuresDocReview: string[]
  featuresDocReviewEn: string[]
  featuresDocTemplates: string[]
  featuresDocTemplatesEn: string[]
```

- [ ] **Step 3: `plans-db.ts` — `PlanLimits` type**

Current (lines 34-38):
```ts
export type PlanLimits = {
  consultations: number
  docGeneration: number
  docReview: number
}
```

Replace with:
```ts
export type PlanLimits = {
  consultations: number
  docGeneration: number
  docReview: number
  docTemplates: number
}
```

- [ ] **Step 4: `plans-db.ts` — `DEFAULT_PLANS`, all 3 tiers**

For **free** tier, current (lines 47-54):
```ts
    includeDocGeneration: true,
    docGeneration: PLAN_LIMITS.free.docGeneration,
    includeDocReview: true,
    docReview: PLAN_LIMITS.free.docReview,
    features: [...],
    featuresEn: [...],
    featuresDocGeneration: ["3 შაბლონის გენერირება"], featuresDocGenerationEn: ["3 template generations"],
    featuresDocReview: ["1 დოკუმენტის შემოწმება"], featuresDocReviewEn: ["1 document review"],
```

Replace with (insert `includeDocTemplates`/`docTemplates` next to the other two, and the feature-bullet pair after the existing ones):
```ts
    includeDocGeneration: true,
    docGeneration: PLAN_LIMITS.free.docGeneration,
    includeDocReview: true,
    docReview: PLAN_LIMITS.free.docReview,
    includeDocTemplates: true,
    docTemplates: PLAN_LIMITS.free.docTemplates,
    features: [...],
    featuresEn: [...],
    featuresDocGeneration: ["3 შაბლონის გენერირება"], featuresDocGenerationEn: ["3 template generations"],
    featuresDocReview: ["1 დოკუმენტის შემოწმება"], featuresDocReviewEn: ["1 document review"],
    featuresDocTemplates: ["3 დოკუმენტის შაბლონი"], featuresDocTemplatesEn: ["3 document templates"],
```

For **standard** tier, current (lines 62-69):
```ts
    includeDocGeneration: true,
    docGeneration: PLAN_LIMITS.standard.docGeneration,
    includeDocReview: true,
    docReview: PLAN_LIMITS.standard.docReview,
    features: [...],
    featuresEn: [...],
    featuresDocGeneration: ["19 შაბლონის გენერირება"], featuresDocGenerationEn: ["19 template generations"],
    featuresDocReview: ["9 დოკუმენტის შემოწმება"], featuresDocReviewEn: ["9 document reviews"],
```

Replace with:
```ts
    includeDocGeneration: true,
    docGeneration: PLAN_LIMITS.standard.docGeneration,
    includeDocReview: true,
    docReview: PLAN_LIMITS.standard.docReview,
    includeDocTemplates: true,
    docTemplates: PLAN_LIMITS.standard.docTemplates,
    features: [...],
    featuresEn: [...],
    featuresDocGeneration: ["19 შაბლონის გენერირება"], featuresDocGenerationEn: ["19 template generations"],
    featuresDocReview: ["9 დოკუმენტის შემოწმება"], featuresDocReviewEn: ["9 document reviews"],
    featuresDocTemplates: ["19 დოკუმენტის შაბლონი"], featuresDocTemplatesEn: ["19 document templates"],
```

For **premium** tier, current (lines 77-84):
```ts
    includeDocGeneration: true,
    docGeneration: PLAN_LIMITS.premium.docGeneration,
    includeDocReview: true,
    docReview: PLAN_LIMITS.premium.docReview,
    features: [...],
    featuresEn: [...],
    featuresDocGeneration: ["99 შაბლონის გენერირება"], featuresDocGenerationEn: ["99 template generations"],
    featuresDocReview: ["99 დოკუმენტის/ხელშეკრულების შემოწმება"], featuresDocReviewEn: ["99 document/contract reviews"],
```

Replace with:
```ts
    includeDocGeneration: true,
    docGeneration: PLAN_LIMITS.premium.docGeneration,
    includeDocReview: true,
    docReview: PLAN_LIMITS.premium.docReview,
    includeDocTemplates: true,
    docTemplates: PLAN_LIMITS.premium.docTemplates,
    features: [...],
    featuresEn: [...],
    featuresDocGeneration: ["99 შაბლონის გენერირება"], featuresDocGenerationEn: ["99 template generations"],
    featuresDocReview: ["99 დოკუმენტის/ხელშეკრულების შემოწმება"], featuresDocReviewEn: ["99 document/contract reviews"],
    featuresDocTemplates: ["99 დოკუმენტის შაბლონი"], featuresDocTemplatesEn: ["99 document templates"],
```

(In each replacement, `[...]` stands for the tier's existing `features`/`featuresEn` array literal — leave those two lines completely untouched, only add the new lines around them exactly as shown.)

- [ ] **Step 5: `plans-db.ts` — `toData()`**

Current (lines 89-121):
```ts
function toData(d: PlanDoc): PlanData {
  // Fall back to DEFAULT_PLANS text when DB doc is missing the field (pre-schema documents).
  const def = DEFAULT_PLANS.find((p) => p.key === d.key)
  const defGen = def?.includeDocGeneration ?? true
  const defRev = def?.includeDocReview ?? true
  return {
    id: String(d._id),
    key: d.key,
    name: d.name,
    nameEn: d.nameEn ?? "",
    description: d.description ?? "",
    descriptionEn: d.descriptionEn ?? "",
    priceMinor: d.priceMinor ?? 0,
    currency: d.currency ?? "GEL",
    period: d.period ?? "month",
    consultations: d.consultations ?? 0,
    includeDocGeneration: d.includeDocGeneration == null ? defGen : d.includeDocGeneration,
    docGeneration: d.docGeneration ?? 0,
    includeDocReview: d.includeDocReview == null ? defRev : d.includeDocReview,
    docReview: d.docReview ?? 0,
    features: d.features ?? [],
    featuresEn: d.featuresEn ?? [],
    featuresDocGeneration: d.featuresDocGeneration?.length ? d.featuresDocGeneration : (def?.featuresDocGeneration ?? []),
    featuresDocGenerationEn: d.featuresDocGenerationEn?.length ? d.featuresDocGenerationEn : (def?.featuresDocGenerationEn ?? []),
    featuresDocReview: d.featuresDocReview?.length ? d.featuresDocReview : (def?.featuresDocReview ?? []),
    featuresDocReviewEn: d.featuresDocReviewEn?.length ? d.featuresDocReviewEn : (def?.featuresDocReviewEn ?? []),
    isFree: !!d.isFree,
    highlighted: !!d.highlighted,
    visible: d.visible !== false,
    active: d.active !== false,
    order: d.order ?? 0,
  }
}
```

Replace with:
```ts
function toData(d: PlanDoc): PlanData {
  // Fall back to DEFAULT_PLANS text when DB doc is missing the field (pre-schema documents).
  const def = DEFAULT_PLANS.find((p) => p.key === d.key)
  const defGen = def?.includeDocGeneration ?? true
  const defRev = def?.includeDocReview ?? true
  const defTpl = def?.includeDocTemplates ?? true
  return {
    id: String(d._id),
    key: d.key,
    name: d.name,
    nameEn: d.nameEn ?? "",
    description: d.description ?? "",
    descriptionEn: d.descriptionEn ?? "",
    priceMinor: d.priceMinor ?? 0,
    currency: d.currency ?? "GEL",
    period: d.period ?? "month",
    consultations: d.consultations ?? 0,
    includeDocGeneration: d.includeDocGeneration == null ? defGen : d.includeDocGeneration,
    docGeneration: d.docGeneration ?? 0,
    includeDocReview: d.includeDocReview == null ? defRev : d.includeDocReview,
    docReview: d.docReview ?? 0,
    includeDocTemplates: d.includeDocTemplates == null ? defTpl : d.includeDocTemplates,
    docTemplates: d.docTemplates ?? 0,
    features: d.features ?? [],
    featuresEn: d.featuresEn ?? [],
    featuresDocGeneration: d.featuresDocGeneration?.length ? d.featuresDocGeneration : (def?.featuresDocGeneration ?? []),
    featuresDocGenerationEn: d.featuresDocGenerationEn?.length ? d.featuresDocGenerationEn : (def?.featuresDocGenerationEn ?? []),
    featuresDocReview: d.featuresDocReview?.length ? d.featuresDocReview : (def?.featuresDocReview ?? []),
    featuresDocReviewEn: d.featuresDocReviewEn?.length ? d.featuresDocReviewEn : (def?.featuresDocReviewEn ?? []),
    featuresDocTemplates: d.featuresDocTemplates?.length ? d.featuresDocTemplates : (def?.featuresDocTemplates ?? []),
    featuresDocTemplatesEn: d.featuresDocTemplatesEn?.length ? d.featuresDocTemplatesEn : (def?.featuresDocTemplatesEn ?? []),
    isFree: !!d.isFree,
    highlighted: !!d.highlighted,
    visible: d.visible !== false,
    active: d.active !== false,
    order: d.order ?? 0,
  }
}
```

- [ ] **Step 6: `plans-db.ts` — `getPlanLimits()`**

Current (lines 175-186):
```ts
export async function getPlanLimits(key: string): Promise<PlanLimits> {
  const plan = await getPlanByKey(key)
  if (plan) {
    return {
      consultations: plan.consultations,
      docGeneration: plan.includeDocGeneration ? plan.docGeneration : 0,
      docReview: plan.includeDocReview ? plan.docReview : 0,
    }
  }
  const f = PLAN_LIMITS.free
  return { consultations: f.consultations, docGeneration: f.docGeneration, docReview: f.docReview }
}
```

Replace with:
```ts
export async function getPlanLimits(key: string): Promise<PlanLimits> {
  const plan = await getPlanByKey(key)
  if (plan) {
    return {
      consultations: plan.consultations,
      docGeneration: plan.includeDocGeneration ? plan.docGeneration : 0,
      docReview: plan.includeDocReview ? plan.docReview : 0,
      docTemplates: plan.includeDocTemplates ? plan.docTemplates : 0,
    }
  }
  const f = PLAN_LIMITS.free
  return {
    consultations: f.consultations,
    docGeneration: f.docGeneration,
    docReview: f.docReview,
    docTemplates: f.docTemplates,
  }
}
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit` — expected clean.

- [ ] **Step 8: Commit**

```bash
git add src/lib/plans.ts src/lib/plans-db.ts
git commit -m "feat: add docTemplates to plan limits, defaults, and normalization"
```

---

### Task 5: `flitt.ts` — activation/deactivation quota reset

**Files:**
- Modify: `src/lib/flitt.ts:167-190`

**Interfaces:**
- Consumes: `PlanLimits.docTemplates` (Task 4), `PLAN_LIMITS.free.docTemplates` (Task 4).

- [ ] **Step 1: Update `planActivationFields`**

Current (lines 167-177):
```ts
/** Fields set when a subscription becomes active — reset quota for the period. */
export function planActivationFields(plan: PlanKey, limits: PlanLimits) {
  return {
    plan,
    subscriptionStatus: "active",
    consultationsRemaining: limits.consultations,
    docGenerationRemaining: limits.docGeneration,
    docReviewRemaining: limits.docReview,
    resetAt: new Date(Date.now() + PERIOD_MS),
  };
}
```

Replace with:
```ts
/** Fields set when a subscription becomes active — reset quota for the period. */
export function planActivationFields(plan: PlanKey, limits: PlanLimits) {
  return {
    plan,
    subscriptionStatus: "active",
    consultationsRemaining: limits.consultations,
    docGenerationRemaining: limits.docGeneration,
    docReviewRemaining: limits.docReview,
    docTemplatesRemaining: limits.docTemplates,
    resetAt: new Date(Date.now() + PERIOD_MS),
  };
}
```

- [ ] **Step 2: Update `planDeactivationFields`**

Current (lines 179-190):
```ts
/** Fields set when a subscription ends — drop back to the free tier. */
export function planDeactivationFields(status: string) {
  const limits = PLAN_LIMITS.free;
  return {
    plan: "free" as const,
    subscriptionStatus: status,
    consultationsRemaining: limits.consultations,
    docGenerationRemaining: limits.docGeneration,
    docReviewRemaining: limits.docReview,
    resetAt: new Date(Date.now() + PERIOD_MS),
  };
}
```

Replace with:
```ts
/** Fields set when a subscription ends — drop back to the free tier. */
export function planDeactivationFields(status: string) {
  const limits = PLAN_LIMITS.free;
  return {
    plan: "free" as const,
    subscriptionStatus: status,
    consultationsRemaining: limits.consultations,
    docGenerationRemaining: limits.docGeneration,
    docReviewRemaining: limits.docReview,
    docTemplatesRemaining: limits.docTemplates,
    resetAt: new Date(Date.now() + PERIOD_MS),
  };
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expected clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/flitt.ts
git commit -m "feat: reset docTemplatesRemaining on plan activation/deactivation"
```

---

### Task 6: Signup grants + `/api/user/me` exposure (includes 2 pre-existing bug fixes)

**Files:**
- Modify: `src/auth.ts:66-76`
- Modify: `src/actions/auth.ts:74-82`
- Modify: `src/app/api/auth/register/route.ts:34-40`
- Modify: `src/app/api/user/me/route.ts:20-28`

**Interfaces:** none new — purely wiring existing/new User fields through.

- [ ] **Step 1: `src/auth.ts` — add `docTemplatesRemaining`**

Current (lines 66-76):
```ts
        const created = await User.create({
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          image: user.image ?? undefined,
          plan: "free",
          consultationsRemaining: 1,
          docGenerationRemaining: 1,
          docReviewRemaining: 1,
          consentAcceptedAt: new Date(),
          consentVersion: "1.0",
        });
```

Replace with:
```ts
        const created = await User.create({
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          image: user.image ?? undefined,
          plan: "free",
          consultationsRemaining: 1,
          docGenerationRemaining: 1,
          docReviewRemaining: 1,
          docTemplatesRemaining: 1,
          consentAcceptedAt: new Date(),
          consentVersion: "1.0",
        });
```

- [ ] **Step 2: `src/actions/auth.ts` — fix pre-existing gap + add new field**

This path currently only grants `consultationsRemaining: 1`, silently relying on schema defaults for the other two (which happen to also default to `1`, so it's not visibly broken today — but it's inconsistent with `auth.ts` and would silently mismatch if the schema defaults ever change). Fixing alongside since we're editing this exact object anyway.

Current (lines 74-82):
```ts
  await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    plan: "free",
    consultationsRemaining: 1,
    consentAcceptedAt: new Date(),
    consentVersion: "1.0",
  });
```

Replace with:
```ts
  await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    plan: "free",
    consultationsRemaining: 1,
    docGenerationRemaining: 1,
    docReviewRemaining: 1,
    docTemplatesRemaining: 1,
    consentAcceptedAt: new Date(),
    consentVersion: "1.0",
  });
```

- [ ] **Step 3: `src/app/api/auth/register/route.ts` — same fix**

Current (lines 34-40):
```ts
  const user = await User.create({
    name,
    email,
    passwordHash,
    plan: "free",
    consultationsRemaining: 1,
  });
```

Replace with:
```ts
  const user = await User.create({
    name,
    email,
    passwordHash,
    plan: "free",
    consultationsRemaining: 1,
    docGenerationRemaining: 1,
    docReviewRemaining: 1,
    docTemplatesRemaining: 1,
  });
```

- [ ] **Step 4: `/api/user/me` — expose all 4 counters (fixes pre-existing gap)**

Current (lines 20-28):
```ts
  return NextResponse.json({
    id: String(user._id),
    email: user.email,
    name: user.name,
    image: user.image ?? null,
    plan: user.plan,
    consultationsRemaining: user.consultationsRemaining,
    resetAt: user.resetAt ?? null,
  });
```

Replace with:
```ts
  return NextResponse.json({
    id: String(user._id),
    email: user.email,
    name: user.name,
    image: user.image ?? null,
    plan: user.plan,
    consultationsRemaining: user.consultationsRemaining,
    docGenerationRemaining: user.docGenerationRemaining,
    docReviewRemaining: user.docReviewRemaining,
    docTemplatesRemaining: user.docTemplatesRemaining,
    resetAt: user.resetAt ?? null,
  });
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` and `npm run lint` — expected clean.

Manually: register a brand-new test account through the `/register` page (credentials path), then check the user document in MongoDB (via the admin `/api/admin/db/[collection]` endpoint or `mongosh`) — confirm `docGenerationRemaining`, `docReviewRemaining`, `docTemplatesRemaining` are all `1`, not just `consultationsRemaining`. Then hit `/api/user/me` while logged in as that user (browser devtools network tab on any page that calls it) and confirm all 4 fields are present in the response.

- [ ] **Step 6: Commit**

```bash
git add src/auth.ts src/actions/auth.ts src/app/api/auth/register/route.ts src/app/api/user/me/route.ts
git commit -m "fix: grant and expose all 4 quota counters consistently across signup paths"
```

---

### Task 7: Feature flag — `templates`

**Files:**
- Modify: `src/lib/features-config.ts:3, 7-13, 22-27`

**Interfaces:**
- Produces: `FeatureKey` now includes `"templates"`, `DEFAULT_FLAGS.templates: boolean`, consumed by Phase 3/4's nav and page gating. No change needed to `FeaturesPanel.tsx` — it renders generically off `FEATURE_DEFS`.

- [ ] **Step 1: Add to `FeatureKey` union**

Current (line 3):
```ts
export type FeatureKey = "chat" | "generate" | "review" | "legislation" | "blog"
```

Replace with:
```ts
export type FeatureKey = "chat" | "generate" | "review" | "templates" | "legislation" | "blog"
```

- [ ] **Step 2: Add to `DEFAULT_FLAGS`**

Current (lines 7-13):
```ts
export const DEFAULT_FLAGS: FeatureFlagsData = {
  chat: true,
  generate: true,
  review: true,
  legislation: true,
  blog: true,
}
```

Replace with:
```ts
export const DEFAULT_FLAGS: FeatureFlagsData = {
  chat: true,
  generate: true,
  review: true,
  templates: true,
  legislation: true,
  blog: true,
}
```

- [ ] **Step 3: Add to `FEATURE_DEFS`**

Current (lines 22-27):
```ts
  { key: "chat", label: "AI იურისტი (ჩატი)", description: "AI კონსულტაციის ჩატი", paths: ["/chat"] },
  { key: "generate", label: "დოკუმენტის გენერაცია", description: "შაბლონები და დოკუმენტის შექმნა", paths: ["/generate"] },
  { key: "review", label: "დოკუმენტის მიმოხილვა", description: "ატვირთული დოკუმენტის ანალიზი", paths: ["/review"] },
  { key: "legislation", label: "კანონმდებლობა", description: "კანონმდებლობის ბაზა", paths: ["/legislation"] },
  { key: "blog", label: "ბლოგი", description: "ბლოგის გვერდი", paths: ["/blog"] },
```

Replace with:
```ts
  { key: "chat", label: "AI იურისტი (ჩატი)", description: "AI კონსულტაციის ჩატი", paths: ["/chat"] },
  { key: "generate", label: "დოკუმენტის გენერაცია", description: "AI-ით დოკუმენტის მომზადება (საჩივარი, მოთხოვნა)", paths: ["/generate"] },
  { key: "review", label: "დოკუმენტის მიმოხილვა", description: "ატვირთული დოკუმენტის ანალიზი", paths: ["/review"] },
  { key: "templates", label: "დოკუმენტის შაბლონები", description: "მზა შაბლონები (ქირავნობა, შრომითი ხელშეკრულება და სხვ.)", paths: ["/templates"] },
  { key: "legislation", label: "კანონმდებლობა", description: "კანონმდებლობის ბაზა", paths: ["/legislation"] },
  { key: "blog", label: "ბლოგი", description: "ბლოგის გვერდი", paths: ["/blog"] },
```

Note: `"generate"`'s `description` is also corrected here from "შაბლონები და დოკუმენტის შექმნა" ("templates and document creation") since `/generate` no longer produces templates after Phase 3 — this is the admin-panel-only label, separate from the public-facing `servicesModal.templatesTab` mislabel fixed in Phase 4.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` and `npm run lint` — expected clean.

Manually: open `/admin` → Features panel, confirm a new "დოკუმენტის შაბლონები" toggle row appears (defaulting on), and that toggling it off/on and saving works (this exercises the fully-generic `FeaturesPanel.tsx` with zero code changes to that file — confirms the generic rendering assumption holds).

- [ ] **Step 5: Commit**

```bash
git add src/lib/features-config.ts
git commit -m "feat: add templates feature flag"
```

---

### Task 8: Full regression pass

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: all clean. This phase adds fields nothing reads yet, so a clean build here just confirms no schema/type mismatches — the real functional test comes in Phase 2/3 when something actually uses `docTemplatesRemaining`.

- [ ] **Step 2: Report back**

Confirm to the user: all 4 quota counters now exist consistently on new signups and in `/api/user/me`, the `templates` feature flag exists and toggles in the admin panel, and nothing in the existing 3 services changed behavior (spot-check `/chat`, `/generate`, `/review` still work as before).

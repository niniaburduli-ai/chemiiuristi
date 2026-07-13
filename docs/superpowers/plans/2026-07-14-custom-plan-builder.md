# Custom "Build Your Own" Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user build a custom, one-time (30-day) service package — any combination of consultations/templates/doc-generation/doc-analysis at quantities 10/50/100/200/300 — with an instantly-updating price, that stacks alongside (never overwrites) an existing subscription, shown separately on the dashboard.

**Architecture:** A new admin-editable rate table (`CustomPlanRates` singleton, mirrors the existing `FeatureFlags` pattern) drives a pure pricing function shared by the client builder UI and the server checkout route. Purchases grant quota into **new, separate** `custom*Remaining` fields on `User` (never touching the existing subscription fields), paid via a new one-time (non-recurring) Flitt checkout. A shared `lib/quota.ts` helper makes every quota-consuming route draw from the subscription pool first and the custom pool as overflow.

**Tech Stack:** Next.js 16 App Router, Mongoose, Zod, Flitt Payments (existing integration), shadcn/ui (`base-nova` style, `@base-ui/react` primitives), Tailwind v4.

## Global Constraints

- No test runner is configured in this repo (see `CLAUDE.md`) — do not introduce one. Verify each task with `npx tsc --noEmit`, `npm run lint`, and manual dev-server/curl checks, per this repo's actual convention.
- GEL is the only currency; prices are stored in minor units (tetri: 1 GEL = 100).
- The 5 selectable quantities are fixed everywhere: `[10, 50, 100, 200, 300]` — never editable by admins, only the *prices* at each step are.
- The custom package must never modify `plan`, `planExpiresAt`, `subscriptionStatus`, `flittOrderId`, `flittPaymentId`, or the existing `consultationsRemaining`/`docGenerationRemaining`/`docReviewRemaining`/`docTemplatesRemaining` fields. It is fully additive/parallel state.
- Follow existing conventions exactly: singleton config models mirror `FeatureFlags`/`lib/features.ts`; admin CRUD panels mirror `FeaturesPanel.tsx`; checkout/callback mirror `lib/flitt.ts` and `/api/flitt/callback`.
- Spec: `docs/superpowers/specs/2026-07-14-custom-plan-builder-design.md` — re-read it if any task here seems ambiguous.

---

### Task 1: Client-safe pricing config + pure pricing math

**Files:**
- Create: `src/lib/custom-plan-rates-config.ts`

**Interfaces:**
- Produces: `STEP_QUANTITIES: readonly [10,50,100,200,300]`, `CUSTOM_SERVICES: readonly ["consultations","docTemplates","docGeneration","docReview"]`, `type CustomService`, `type CustomPlanRatesData = Record<CustomService, number[]>` (5-length arrays, priceMinor per step index), `type CustomSelection = Record<CustomService, number>` (0 or a step quantity), `DEFAULT_CUSTOM_RATES: CustomPlanRatesData`, `priceForQuantity(rates, service, qty): number | null`, `computeCustomTotal(rates, selection): number | null`.

- [ ] **Step 1: Write the file**

```ts
/** Client-safe custom-plan-builder constants + pure pricing math (no DB import). */

export const STEP_QUANTITIES = [10, 50, 100, 200, 300] as const
export type StepQuantity = (typeof STEP_QUANTITIES)[number]

export const CUSTOM_SERVICES = ["consultations", "docTemplates", "docGeneration", "docReview"] as const
export type CustomService = (typeof CUSTOM_SERVICES)[number]

/** priceMinor (GEL tetri) per step index, aligned with STEP_QUANTITIES. Always length 5. */
export type CustomPlanRatesData = Record<CustomService, number[]>

/** Selected quantity per service: 0 (excluded) or one of STEP_QUANTITIES. */
export type CustomSelection = Record<CustomService, number>

/**
 * Seed prices (GEL tetri). Real per-unit AI cost is negligible (cheap OpenRouter
 * calls) — these are priced well above cost, with volume discount per step and
 * a 9 GEL floor on any single-service purchase to stay safely above Flitt's
 * per-transaction fee. See the design spec for the full reasoning.
 */
export const DEFAULT_CUSTOM_RATES: CustomPlanRatesData = {
  consultations: [900, 2900, 4900, 7900, 9900],
  docTemplates: [900, 1900, 2900, 4500, 5900],
  docGeneration: [1200, 3900, 6500, 10900, 13900],
  docReview: [1500, 4900, 7900, 12900, 16900],
}

/** priceMinor for a quantity: 0 for the "not included" quantity, null if `qty` isn't a valid step. */
export function priceForQuantity(
  rates: CustomPlanRatesData,
  service: CustomService,
  qty: number
): number | null {
  if (qty === 0) return 0
  const idx = STEP_QUANTITIES.indexOf(qty as StepQuantity)
  if (idx === -1) return null
  return rates[service][idx]
}

/**
 * Total priceMinor for a selection, or null if any quantity is invalid or
 * nothing at all is selected (a checkout needs at least one service > 0).
 */
export function computeCustomTotal(
  rates: CustomPlanRatesData,
  selection: CustomSelection
): number | null {
  let total = 0
  let anySelected = false
  for (const service of CUSTOM_SERVICES) {
    const qty = selection[service] ?? 0
    const price = priceForQuantity(rates, service, qty)
    if (price === null) return null
    if (qty > 0) anySelected = true
    total += price
  }
  return anySelected ? total : null
}
```

- [ ] **Step 2: Manually verify the pure math by hand-trace**

No test runner exists in this repo — verify by tracing one example against the seed table:

`computeCustomTotal(DEFAULT_CUSTOM_RATES, { consultations: 200, docTemplates: 0, docGeneration: 0, docReview: 50 })`
- `consultations` qty 200 → index 3 → `7900`
- `docTemplates` qty 0 → `0`
- `docGeneration` qty 0 → `0`
- `docReview` qty 50 → index 1 → `4900`
- total = `7900 + 4900 = 12800` (128 ₾) — matches the spec table (79 + 49 = 128). ✓

And an invalid case: `computeCustomTotal(DEFAULT_CUSTOM_RATES, { consultations: 15, docTemplates: 0, docGeneration: 0, docReview: 0 })` → `priceForQuantity` returns `null` for qty 15 (not a step) → `computeCustomTotal` returns `null`. ✓

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `custom-plan-rates-config.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/custom-plan-rates-config.ts
git commit -m "feat(custom-plan): add pricing config and pure pricing math"
```

---

### Task 2: `CustomPlanRates` model + server accessor

**Files:**
- Create: `src/lib/models/CustomPlanRates.ts`
- Create: `src/lib/custom-plan-rates.ts`

**Interfaces:**
- Consumes: `DEFAULT_CUSTOM_RATES`, `CustomPlanRatesData` from Task 1 (`@/lib/custom-plan-rates-config`).
- Produces: `getCustomPlanRates(): Promise<CustomPlanRatesData>`; re-exports `STEP_QUANTITIES`, `CUSTOM_SERVICES`, `DEFAULT_CUSTOM_RATES`, `priceForQuantity`, `computeCustomTotal`, and the `CustomService`/`CustomPlanRatesData`/`CustomSelection` types from `@/lib/custom-plan-rates` (server-safe re-export, mirrors `lib/features.ts` re-exporting `lib/features-config.ts`).

- [ ] **Step 1: Write the model**

```ts
import { Schema, model, models, type Model } from "mongoose"
import { DEFAULT_CUSTOM_RATES } from "@/lib/custom-plan-rates-config"

/** Singleton admin-editable price table for the custom "build your own" plan. */
const CustomPlanRatesSchema = new Schema(
  {
    consultations: { type: [Number], default: DEFAULT_CUSTOM_RATES.consultations },
    docTemplates: { type: [Number], default: DEFAULT_CUSTOM_RATES.docTemplates },
    docGeneration: { type: [Number], default: DEFAULT_CUSTOM_RATES.docGeneration },
    docReview: { type: [Number], default: DEFAULT_CUSTOM_RATES.docReview },
  },
  { timestamps: true, minimize: false }
)

export type CustomPlanRatesDoc = {
  _id: unknown
  consultations: number[]
  docTemplates: number[]
  docGeneration: number[]
  docReview: number[]
  createdAt: Date
  updatedAt: Date
}

export const CustomPlanRates: Model<CustomPlanRatesDoc> =
  (models.CustomPlanRates as Model<CustomPlanRatesDoc>) ||
  model<CustomPlanRatesDoc>("CustomPlanRates", CustomPlanRatesSchema)
```

Save to `src/lib/models/CustomPlanRates.ts`.

- [ ] **Step 2: Write the server accessor**

```ts
import { dbConnect } from "@/lib/db"
import { CustomPlanRates, type CustomPlanRatesDoc } from "@/lib/models/CustomPlanRates"
import { DEFAULT_CUSTOM_RATES, type CustomPlanRatesData } from "@/lib/custom-plan-rates-config"

export {
  STEP_QUANTITIES,
  CUSTOM_SERVICES,
  DEFAULT_CUSTOM_RATES,
  priceForQuantity,
  computeCustomTotal,
} from "@/lib/custom-plan-rates-config"
export type {
  CustomService,
  CustomPlanRatesData,
  CustomSelection,
} from "@/lib/custom-plan-rates-config"

const isValid5 = (v: unknown): v is number[] => Array.isArray(v) && v.length === 5

/** Read the singleton rate table, falling back to defaults on any DB failure. */
export async function getCustomPlanRates(): Promise<CustomPlanRatesData> {
  try {
    await dbConnect()
    const doc = await CustomPlanRates.findOne().lean<CustomPlanRatesDoc>()
    if (!doc) return { ...DEFAULT_CUSTOM_RATES }
    return {
      consultations: isValid5(doc.consultations) ? doc.consultations : DEFAULT_CUSTOM_RATES.consultations,
      docTemplates: isValid5(doc.docTemplates) ? doc.docTemplates : DEFAULT_CUSTOM_RATES.docTemplates,
      docGeneration: isValid5(doc.docGeneration) ? doc.docGeneration : DEFAULT_CUSTOM_RATES.docGeneration,
      docReview: isValid5(doc.docReview) ? doc.docReview : DEFAULT_CUSTOM_RATES.docReview,
    }
  } catch (err) {
    console.error("[custom-plan-rates] getCustomPlanRates DB read failed, serving defaults:", err)
    return { ...DEFAULT_CUSTOM_RATES }
  }
}
```

Save to `src/lib/custom-plan-rates.ts`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/models/CustomPlanRates.ts src/lib/custom-plan-rates.ts
git commit -m "feat(custom-plan): add CustomPlanRates singleton model and accessor"
```

---

### Task 3: `User` model — add isolated custom-plan fields

**Files:**
- Modify: `src/lib/models/user.ts:16-27` (inside the existing `UserSchema` definition)

**Interfaces:**
- Produces: `customConsultationsRemaining`, `customDocGenerationRemaining`, `customDocReviewRemaining`, `customDocTemplatesRemaining` (all `Number, default: 0`), `customPlanExpiresAt` (`Date, default: null`), `customFlittOrderId`, `customFlittPaymentId` (both `String`) on `UserDoc` (auto-inferred via `InferSchemaType`, no manual type edits needed).

- [ ] **Step 1: Add the fields**

In `src/lib/models/user.ts`, right after the existing `planExpiresAt` field (line 26) and before the `flittOrderId` field (line 28), insert:

```ts
    // Custom "build your own" one-time package — fully independent of the
    // subscription above (plan/planExpiresAt/subscriptionStatus). A user can
    // hold an active subscription AND an active custom package at the same
    // time; buying a custom package never touches the fields above. See
    // lib/plan-expiry.ts (applyCustomPlanExpiryIfDue) and lib/quota.ts.
    customConsultationsRemaining: { type: Number, default: 0 },
    customDocGenerationRemaining: { type: Number, default: 0 },
    customDocReviewRemaining: { type: Number, default: 0 },
    customDocTemplatesRemaining: { type: Number, default: 0 },
    // Set on successful custom-package purchase; null/unset when no custom
    // package is active. A repeat purchase while still active adds to the
    // remaining quotas above and resets this to a fresh 30 days.
    customPlanExpiresAt: { type: Date, default: null },
    // Bookkeeping only for the custom order's own pending/callback state —
    // kept separate from flittOrderId/flittPaymentId so a concurrent custom
    // purchase can never corrupt an in-flight or active subscription's own
    // callback state.
    customFlittOrderId: { type: String, default: "" },
    customFlittPaymentId: { type: String, default: "" },
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. `UserDoc` now includes the new fields via `InferSchemaType`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/models/user.ts
git commit -m "feat(custom-plan): add isolated custom-package quota fields to User"
```

---

### Task 4: `Payment` model — allow recording custom-package charges

**Files:**
- Modify: `src/lib/models/payment.ts:9`

**Interfaces:**
- Produces: `plan` field now accepts `"custom"` in addition to `"standard"`/`"premium"`.

- [ ] **Step 1: Widen the enum**

Change line 9 from:

```ts
    plan: { type: String, enum: ["standard", "premium"], required: true },
```

to:

```ts
    plan: { type: String, enum: ["standard", "premium", "custom"], required: true },
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/models/payment.ts
git commit -m "feat(custom-plan): allow Payment.plan to record custom-package charges"
```

---

### Task 5: Custom-plan expiry helper

**Files:**
- Modify: `src/lib/plan-expiry.ts` (add alongside the existing `applyPlanExpiryIfDue`)

**Interfaces:**
- Consumes: nothing new (same `User` model as the existing function).
- Produces: `applyCustomPlanExpiryIfDue<T>(user: T): Promise<T>` — independent of, and never interacting with, `applyPlanExpiryIfDue`.

- [ ] **Step 1: Add the function**

Append to `src/lib/plan-expiry.ts` (after the existing `applyPlanExpiryIfDue` function):

```ts
type CustomPlanCheckable = {
  _id: unknown;
  customPlanExpiresAt?: Date | null;
};

/**
 * Lazily zero out an expired custom package's quota. Completely independent
 * of applyPlanExpiryIfDue — a subscription's own plan/planExpiresAt is never
 * touched here, matching the requirement that the custom package have its
 * own separate expiration and never affect the subscription.
 */
export async function applyCustomPlanExpiryIfDue<T extends CustomPlanCheckable>(
  user: T
): Promise<T> {
  const expiresAt = user.customPlanExpiresAt;
  if (!expiresAt || new Date(expiresAt) > new Date()) {
    return user;
  }

  const fields = {
    customConsultationsRemaining: 0,
    customDocGenerationRemaining: 0,
    customDocReviewRemaining: 0,
    customDocTemplatesRemaining: 0,
    customPlanExpiresAt: null,
  };
  await User.findByIdAndUpdate(user._id, { $set: fields });
  return { ...user, ...fields };
}
```

- [ ] **Step 2: Manually verify by hand-trace**

Given `user = { _id: "x", customPlanExpiresAt: new Date(Date.now() - 1000) }` (1 second in the past): the function should return `{ _id: "x", customConsultationsRemaining: 0, ..., customPlanExpiresAt: null }` and issue a DB update. Given `customPlanExpiresAt: new Date(Date.now() + 1000)` (future): the function returns `user` unchanged, no DB call. Given `customPlanExpiresAt: null`: returns `user` unchanged, no DB call. ✓

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/plan-expiry.ts
git commit -m "feat(custom-plan): add independent expiry check for custom packages"
```

---

### Task 6: Shared quota-consumption helper (primary pool first, custom pool as overflow)

**Files:**
- Create: `src/lib/quota.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `type QuotaService = "consultations" | "docGeneration" | "docReview" | "docTemplates"`, `type QuotaUser` (shape below), `type QuotaSplit = { fromPrimary: number; fromCustom: number }`, `splitQuota(user, service, amount): QuotaSplit | null`, `applyQuotaSplit(userId, service, split): Promise<void>`, `totalRemaining(user, service): number`.

- [ ] **Step 1: Write the helper**

```ts
import { User } from "@/lib/models/user";

export type QuotaService = "consultations" | "docGeneration" | "docReview" | "docTemplates";

export type QuotaUser = {
  consultationsRemaining?: number | null;
  docGenerationRemaining?: number | null;
  docReviewRemaining?: number | null;
  docTemplatesRemaining?: number | null;
  customConsultationsRemaining?: number | null;
  customDocGenerationRemaining?: number | null;
  customDocReviewRemaining?: number | null;
  customDocTemplatesRemaining?: number | null;
  customPlanExpiresAt?: Date | string | null;
};

function primaryRemaining(user: QuotaUser, service: QuotaService): number {
  switch (service) {
    case "consultations":
      return user.consultationsRemaining ?? 0;
    case "docGeneration":
      return user.docGenerationRemaining ?? 0;
    case "docReview":
      return user.docReviewRemaining ?? 0;
    case "docTemplates":
      return user.docTemplatesRemaining ?? 0;
  }
}

function customActive(user: QuotaUser): boolean {
  return !!user.customPlanExpiresAt && new Date(user.customPlanExpiresAt) > new Date();
}

function customRemaining(user: QuotaUser, service: QuotaService): number {
  if (!customActive(user)) return 0;
  switch (service) {
    case "consultations":
      return user.customConsultationsRemaining ?? 0;
    case "docGeneration":
      return user.customDocGenerationRemaining ?? 0;
    case "docReview":
      return user.customDocReviewRemaining ?? 0;
    case "docTemplates":
      return user.customDocTemplatesRemaining ?? 0;
  }
}

/** Sum of both pools — used for user-facing "you have N remaining" messages. */
export function totalRemaining(user: QuotaUser, service: QuotaService): number {
  return primaryRemaining(user, service) + customRemaining(user, service);
}

export type QuotaSplit = { fromPrimary: number; fromCustom: number };

/**
 * How much of `amount` to draw from the primary (subscription/free) pool vs.
 * the custom (one-time top-up) pool, or null if neither pool combined has
 * enough. Primary is drawn first — a custom package is bought specifically
 * to keep working *after* the subscription/free limit runs out, so it's
 * spent last as overflow capacity.
 */
export function splitQuota(
  user: QuotaUser,
  service: QuotaService,
  amount: number
): QuotaSplit | null {
  const primary = primaryRemaining(user, service);
  const custom = customRemaining(user, service);
  if (primary + custom < amount) return null;
  const fromPrimary = Math.min(primary, amount);
  return { fromPrimary, fromCustom: amount - fromPrimary };
}

const PRIMARY_FIELD_NAME: Record<QuotaService, string> = {
  consultations: "consultationsRemaining",
  docGeneration: "docGenerationRemaining",
  docReview: "docReviewRemaining",
  docTemplates: "docTemplatesRemaining",
};
const CUSTOM_FIELD_NAME: Record<QuotaService, string> = {
  consultations: "customConsultationsRemaining",
  docGeneration: "customDocGenerationRemaining",
  docReview: "customDocReviewRemaining",
  docTemplates: "customDocTemplatesRemaining",
};

/** Decrement whichever pool(s) `split` says to draw from, in one DB call. */
export async function applyQuotaSplit(
  userId: string,
  service: QuotaService,
  split: QuotaSplit
): Promise<void> {
  const inc: Record<string, number> = {};
  if (split.fromPrimary > 0) inc[PRIMARY_FIELD_NAME[service]] = -split.fromPrimary;
  if (split.fromCustom > 0) inc[CUSTOM_FIELD_NAME[service]] = -split.fromCustom;
  if (Object.keys(inc).length === 0) return;
  await User.findByIdAndUpdate(userId, { $inc: inc });
}
```

- [ ] **Step 2: Manually verify by hand-trace**

Case A — subscription only: `user = { consultationsRemaining: 3, customPlanExpiresAt: null }`, `splitQuota(user, "consultations", 1)` → primary=3, custom=0 → `{ fromPrimary: 1, fromCustom: 0 }`. ✓

Case B — subscription exhausted, custom active: `user = { consultationsRemaining: 0, customConsultationsRemaining: 10, customPlanExpiresAt: <future> }`, `splitQuota(user, "consultations", 1)` → primary=0, custom=10 → `{ fromPrimary: 0, fromCustom: 1 }`. ✓

Case C — review spilling across both pools: `user = { docReviewRemaining: 1, customDocReviewRemaining: 5, customPlanExpiresAt: <future> }`, `splitQuota(user, "docReview", 3)` → primary=1, custom=5, total 6 ≥ 3 → `{ fromPrimary: 1, fromCustom: 2 }`. ✓

Case D — both insufficient: `user = { consultationsRemaining: 0, customConsultationsRemaining: 0 }`, `splitQuota(user, "consultations", 1)` → `null`. ✓

Case E — custom expired: `user = { consultationsRemaining: 0, customConsultationsRemaining: 10, customPlanExpiresAt: <past> }` → `customActive` is false → custom counted as 0 → `splitQuota` returns `null`. ✓

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/quota.ts
git commit -m "feat(custom-plan): add shared quota-split helper (primary pool first, custom as overflow)"
```

---

### Task 7: Flitt one-time (non-recurring) checkout + custom order-id scheme

**Files:**
- Modify: `src/lib/flitt.ts`

**Interfaces:**
- Consumes: `merchantId()`, `paymentKey()`, `appUrl()`, `signV2()`, `CHECKOUT_URL` (all already private in this file).
- Produces: `buildCustomOrderId(userId): string`, `isCustomOrderId(orderId): boolean`, `parseCustomOrderId(orderId): { userId: string | null }`, `createOneTimeCheckout(item, user): Promise<CheckoutResult>`, and exports the existing `PERIOD_MS` constant (currently private) for reuse by the callback route.

- [ ] **Step 1: Export `PERIOD_MS`**

Change (around line 176):

```ts
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
```

to:

```ts
export const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
```

- [ ] **Step 2: Add the custom order-id helpers and one-time checkout function**

Add near the existing `buildOrderId`/`parseOrderId` functions (after line 84, before `export type CheckoutResult`):

```ts
/** order_id for a one-time custom-package purchase (no plan key — quantities travel in merchant_data). */
export function buildCustomOrderId(userId: string): string {
  return `custom_${userId}_${Date.now()}`;
}
export function isCustomOrderId(orderId: string): boolean {
  return orderId.startsWith("custom_");
}
export function parseCustomOrderId(orderId: string): { userId: string | null } {
  const m = /^custom_([0-9a-fA-F]+)_\d+$/.exec(orderId || "");
  return { userId: m ? m[1] : null };
}
```

Add after `createSubscriptionCheckout` (after line 134, before `export type CallbackData`):

```ts
export type OneTimeCheckoutItem = {
  orderId: string;
  description: string;
  amountMinor: number;
  merchantData: Record<string, unknown>;
};

/**
 * Create a one-time (non-recurring) Flitt checkout — no `subscription`/
 * `recurring_data`, unlike createSubscriptionCheckout. Used for the custom
 * "build your own" package, which is explicitly a single charge with no
 * auto-renewal.
 */
export async function createOneTimeCheckout(
  item: OneTimeCheckoutItem,
  user: { id: string; email: string; name?: string | null }
): Promise<CheckoutResult> {
  const order = {
    order_id: item.orderId,
    order_desc: item.description,
    merchant_id: merchantId(),
    currency: "GEL",
    amount: item.amountMinor,
    server_callback_url: `${appUrl()}/api/flitt/callback`,
    response_url: `${appUrl()}/billing?status=success`,
    merchant_data: JSON.stringify(item.merchantData),
    sender_email: user.email,
    lang: "ka",
  };

  const data = Buffer.from(JSON.stringify({ order }), "utf8").toString("base64");
  const body = { request: { version: "2.0", data, signature: signV2(data, paymentKey()) } };

  const res = await fetch(CHECKOUT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const respData = json?.response?.data;
  if (!respData) {
    const msg = json?.response?.error_message || "Unknown Flitt error";
    throw new Error(`Flitt checkout failed: ${msg}`);
  }
  const decoded = JSON.parse(Buffer.from(respData, "base64").toString("utf8"));
  const inner = decoded?.order ?? decoded?.response ?? decoded;
  if (!inner?.checkout_url) throw new Error("Flitt response missing checkout_url");
  return { checkoutUrl: inner.checkout_url, orderId: item.orderId, paymentId: inner.payment_id };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/flitt.ts
git commit -m "feat(custom-plan): add one-time Flitt checkout and custom order-id scheme"
```

---

### Task 8: Checkout request validator

**Files:**
- Modify: `src/lib/validators.ts` (append near `CheckoutSchema`, after line 45)

**Interfaces:**
- Consumes: nothing new.
- Produces: `CustomCheckoutSchema` (zod), `type CustomCheckoutInput` — shape matches `CustomSelection` from Task 1 exactly (`consultations`, `docTemplates`, `docGeneration`, `docReview`, each `0 | 10 | 50 | 100 | 200 | 300`).

- [ ] **Step 1: Add the schema**

Append after the existing `CheckoutSchema`/`CheckoutInput` block (line 45):

```ts
// Matches CustomSelection (@/lib/custom-plan-rates-config) exactly — every
// service key present, each either 0 (excluded) or one of the 5 fixed steps.
const customStepEnum = z.union([
  z.literal(0),
  z.literal(10),
  z.literal(50),
  z.literal(100),
  z.literal(200),
  z.literal(300),
]);
export const CustomCheckoutSchema = z
  .object({
    consultations: customStepEnum.default(0),
    docTemplates: customStepEnum.default(0),
    docGeneration: customStepEnum.default(0),
    docReview: customStepEnum.default(0),
  })
  .refine(
    (d) => d.consultations + d.docTemplates + d.docGeneration + d.docReview > 0,
    { message: "Select at least one service" }
  );
export type CustomCheckoutInput = z.infer<typeof CustomCheckoutSchema>;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators.ts
git commit -m "feat(custom-plan): add checkout request validator"
```

---

### Task 9: `POST /api/checkout/custom` route

**Files:**
- Create: `src/app/api/checkout/custom/route.ts`

**Interfaces:**
- Consumes: `auth()` (`@/auth`), `dbConnect` (`@/lib/db`), `User` (`@/lib/models/user`), `CustomCheckoutSchema` (`@/lib/validators`), `createOneTimeCheckout`/`buildCustomOrderId` (`@/lib/flitt`), `getCustomPlanRates`/`computeCustomTotal` (`@/lib/custom-plan-rates`).
- Produces: `POST` handler returning `{ checkoutUrl }` on success (same response shape as `/api/checkout`, so the client can reuse the same redirect pattern as `UpgradeButton`).

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { CustomCheckoutSchema } from "@/lib/validators";
import { createOneTimeCheckout, buildCustomOrderId } from "@/lib/flitt";
import { getCustomPlanRates, computeCustomTotal } from "@/lib/custom-plan-rates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const parsed = CustomCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await dbConnect();

  const rates = await getCustomPlanRates();
  // Always recompute the price server-side — the client-submitted selection
  // is never trusted for the amount, only for which services/quantities.
  const total = computeCustomTotal(rates, parsed.data);
  if (total === null) {
    return NextResponse.json({ error: "Invalid selection" }, { status: 400 });
  }

  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orderId = buildCustomOrderId(String(user._id));

  try {
    const { checkoutUrl } = await createOneTimeCheckout(
      {
        orderId,
        description: "ინდივიდუალური პაკეტი (ერთჯერადი გადახდა)",
        amountMinor: total,
        merchantData: { userId: String(user._id), ...parsed.data },
      },
      { id: String(user._id), email: user.email, name: user.name }
    );
    // Custom-package pending state lives on its own fields — never touches
    // flittOrderId/flittPaymentId/subscriptionStatus, which an active
    // subscription may already be using.
    await User.findByIdAndUpdate(user._id, { customFlittOrderId: orderId });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    return NextResponse.json(
      { error: "Payment provider error", detail: String(err instanceof Error ? err.message : err) },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification (requires a running dev server and a logged-in session)**

Run: `npm run dev`, log in as a test user in the browser, then in another terminal:

```bash
curl -i -X POST http://localhost:3000/api/checkout/custom \
  -H "Content-Type: application/json" \
  --cookie "<paste your session cookie from the browser devtools>" \
  -d '{"consultations":200,"docReview":50}'
```

Expected: `200` with a JSON body containing `checkoutUrl` pointing at Flitt's hosted checkout (or a `502` with a clear Flitt error if `FLITT_MERCHANT_ID`/`FLITT_PAYMENT_KEY` aren't configured in this environment — either outcome confirms the route itself is wired correctly). Also confirm in MongoDB (or the admin Users panel) that the target user's `customFlittOrderId` was set to a `custom_...` value.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/checkout/custom/route.ts
git commit -m "feat(custom-plan): add one-time checkout route for the custom package"
```

---

### Task 10: Flitt callback — branch on custom orders, grant quota without touching the subscription

**Files:**
- Modify: `src/app/api/flitt/callback/route.ts`

**Interfaces:**
- Consumes: `isCustomOrderId`, `parseCustomOrderId`, `PERIOD_MS`, `isSandboxCredentials` (`@/lib/flitt`), `Payment` (`@/lib/models/payment`), `User` (`@/lib/models/user`).
- Produces: custom-order handling fully isolated from the existing `sub_` handling below it — no shared mutation of `plan`/`planExpiresAt`/`subscriptionStatus`.

- [ ] **Step 1: Update imports**

Change the import block at the top (lines 5-13) from:

```ts
import {
  verifyCallback,
  parseOrderId,
  planActivationFields,
  planDeactivationFields,
  isSandboxCredentials,
} from "@/lib/flitt";
import { getPlanLimits } from "@/lib/plans-db";
```

to:

```ts
import {
  verifyCallback,
  parseOrderId,
  planActivationFields,
  planDeactivationFields,
  isSandboxCredentials,
  isCustomOrderId,
  parseCustomOrderId,
  PERIOD_MS,
} from "@/lib/flitt";
import { getPlanLimits } from "@/lib/plans-db";
```

- [ ] **Step 2: Add a custom-order resolver + handler, and branch to it before the existing subscription logic**

Add this function after the existing `resolveUser` function (after line 35, before `export async function POST`):

```ts
type CustomQuantities = {
  consultations: number;
  docTemplates: number;
  docGeneration: number;
  docReview: number;
};

/** Resolve the target user + purchased quantities for a `custom_` order. */
async function resolveCustomOrder(data: {
  order_id?: string;
  merchant_data?: string;
}): Promise<{ userId: string | null; quantities: CustomQuantities | null }> {
  let userId: string | null = null;
  let quantities: CustomQuantities | null = null;

  if (data.merchant_data) {
    try {
      const md = JSON.parse(data.merchant_data) as { userId?: string } & Partial<CustomQuantities>;
      userId = md.userId ?? null;
      quantities = {
        consultations: Number(md.consultations) || 0,
        docTemplates: Number(md.docTemplates) || 0,
        docGeneration: Number(md.docGeneration) || 0,
        docReview: Number(md.docReview) || 0,
      };
    } catch {
      /* ignore malformed merchant_data */
    }
  }
  if (!userId) userId = parseCustomOrderId(data.order_id ?? "").userId;
  return { userId, quantities };
}

/**
 * Handle a `custom_` order end-to-end and return the response — completely
 * separate code path from the subscription flow below. Never sets `plan`,
 * `planExpiresAt`, `subscriptionStatus`, or the primary `*Remaining` fields;
 * only ever touches the `custom*` fields, so an active subscription (or the
 * free tier) is left exactly as it was.
 */
async function handleCustomOrder(data: {
  order_id?: string;
  merchant_data?: string;
  order_status?: string;
  response_status?: string;
  amount?: unknown;
  payment_id?: unknown;
}): Promise<Response> {
  const { userId, quantities } = await resolveCustomOrder(data);
  if (!userId) return NextResponse.json({ status: "ignored" });

  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ status: "ignored" });

  const approved = data.order_status === "approved" && data.response_status !== "failure";
  const amount = Number(data.amount) || 0;
  const paymentId = String(data.payment_id ?? data.order_id ?? "");

  // Same sandbox guard as the subscription flow: a sandbox-signed "approved"
  // callback must never grant real quota, in any environment.
  if (approved && isSandboxCredentials()) {
    await Payment.updateOne(
      { paymentId },
      {
        $setOnInsert: {
          userId: user._id,
          orderId: data.order_id ?? "",
          paymentId,
          plan: "custom",
          amount,
          currency: "GEL",
          status: "sandbox_test",
          sandbox: true,
          paidAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.warn(
      `[flitt/callback] Sandbox-signed "approved" callback for custom order ${data.order_id} (user ${user._id}) — recorded, real grant blocked.`
    );
    return NextResponse.json({ status: "ignored_sandbox" });
  }

  if (approved && quantities) {
    const inc: Record<string, number> = {};
    if (quantities.consultations > 0) inc.customConsultationsRemaining = quantities.consultations;
    if (quantities.docTemplates > 0) inc.customDocTemplatesRemaining = quantities.docTemplates;
    if (quantities.docGeneration > 0) inc.customDocGenerationRemaining = quantities.docGeneration;
    if (quantities.docReview > 0) inc.customDocReviewRemaining = quantities.docReview;

    await User.findByIdAndUpdate(user._id, {
      $set: {
        customPlanExpiresAt: new Date(Date.now() + PERIOD_MS),
        customFlittOrderId: data.order_id ?? "",
        customFlittPaymentId: paymentId,
      },
      ...(Object.keys(inc).length > 0 ? { $inc: inc } : {}),
    });

    await Payment.updateOne(
      { paymentId },
      {
        $setOnInsert: {
          userId: user._id,
          orderId: data.order_id ?? "",
          paymentId,
          plan: "custom",
          amount,
          currency: "GEL",
          status: "approved",
          paidAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
  // Declined/expired/reversed/other: nothing was granted yet, so there is
  // nothing to roll back — no field changes.

  return NextResponse.json({ status: "ok" });
}
```

Then, inside `export async function POST(req: Request)`, immediately after `const data = verifyCallback(raw);` / its `if (!data) { ... }` guard (after line 54) and **before** `await dbConnect();` / `const { user, plan } = await resolveUser(data);` (line 56-57), insert the branch:

```ts
  await dbConnect();

  if (isCustomOrderId(data.order_id ?? "")) {
    return handleCustomOrder(data);
  }

  const { user, plan } = await resolveUser(data);
```

(This replaces the standalone `await dbConnect();` on line 56 — keep only one `dbConnect()` call, moved above the new branch, and remove the now-duplicate second one immediately preceding `resolveUser`.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

With `FLITT_PAYMENT_KEY=test` (Flitt's documented sandbox secret) in `.env.local`, sign and POST a synthetic callback matching the `custom_` scheme, and confirm:
1. A `Payment` doc is created with `status: "sandbox_test"`, `sandbox: true`, `plan: "custom"`.
2. The target user's `custom*Remaining` fields and `customPlanExpiresAt` are **unchanged** (sandbox must never grant).
3. Re-run with a non-`test` `FLITT_PAYMENT_KEY` signature and `order_status: "approved"` — confirm the user's `customConsultationsRemaining`/etc. increment by the requested amounts, `customPlanExpiresAt` is ~30 days out, and — critically — the user's `plan`, `planExpiresAt`, `subscriptionStatus`, and primary `*Remaining` fields are **byte-for-byte unchanged** from before the callback (this is the core requirement from this feature — confirm it explicitly, don't skip this check).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/flitt/callback/route.ts
git commit -m "feat(custom-plan): handle custom-package callbacks independently of subscriptions"
```

---

### Task 11: Wire `consumeQuota` into the chat (consultations) route

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `splitQuota`, `applyQuotaSplit`, `type QuotaSplit` (`@/lib/quota`).
- Produces: same external behavior (403 on exhaustion, decrement on success) but now draws from both pools.

- [ ] **Step 1: Update imports**

Add to the top of `src/app/api/chat/route.ts` (after line 12, the `applyPlanExpiryIfDue` import):

```ts
import { splitQuota, applyQuotaSplit, type QuotaSplit } from "@/lib/quota";
```

- [ ] **Step 2: Thread the quota split through `finalizeAnswer` and `tryWebFallback`**

Replace the `finalizeAnswer` signature and body (lines 37-84) with:

```ts
async function finalizeAnswer(params: {
  userId: string;
  isAdmin: boolean;
  quotaSplit: QuotaSplit | null;
  question: string;
  answer: string;
  legalBasis: LegalBasisGroup[];
  webSources?: WebSource[];
}): Promise<Response> {
  const { userId, isAdmin, quotaSplit, question, answer, legalBasis, webSources } = params;

  const sources =
    legalBasis.length > 0
      ? legalBasis.flatMap((g) =>
          g.items.map((i) => ({
            title: g.lawName,
            code: g.lawName,
            url: g.url,
            article: i.article,
            paragraph: i.paragraph ?? undefined,
            subparagraph: i.subparagraph ?? undefined,
          }))
        )
      : (webSources ?? []).map((s) => ({ title: s.title, url: s.url }));

  const saveOps: Promise<unknown>[] = [
    Consultation.create({ userId, question, answer, sources }),
  ];
  if (!isAdmin && quotaSplit) {
    saveOps.push(applyQuotaSplit(userId, "consultations", quotaSplit));
  }
  await Promise.all(saveOps);

  return new Response(streamText(answer), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Legal-Basis": encodeURIComponent(JSON.stringify(legalBasis)),
      ...(webSources && webSources.length > 0
        ? { "X-Web-Sources": encodeURIComponent(JSON.stringify(webSources)) }
        : {}),
    },
  });
}
```

Replace `tryWebFallback`'s signature and body (lines 93-116) with:

```ts
async function tryWebFallback(
  userId: string,
  isAdmin: boolean,
  quotaSplit: QuotaSplit | null,
  question: string,
  keywords?: string[]
): Promise<Response> {
  const web = await answerViaWebSearch(question, keywords);
  const prose = web?.prose.trim();
  if (web && prose && prose !== NOT_FOUND_MSG) {
    await setCachedAnswer(question, { answer: prose, legalBasis: [], webSources: web.sources });
    return finalizeAnswer({
      userId,
      isAdmin,
      quotaSplit,
      question,
      answer: prose,
      legalBasis: [],
      webSources: web.sources,
    });
  }
  return NextResponse.json(
    { answer: NOT_FOUND_MSG, legalBasis: [] },
    { status: 200 }
  );
}
```

- [ ] **Step 3: Compute the split once, gate on it, and pass it to every call site**

Replace the quota gate (lines 145-152):

```ts
  user = await applyPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.consultationsRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Consultation quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

with:

```ts
  user = await applyPlanExpiryIfDue(user);
  user = await applyCustomPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  const quotaSplit = isAdmin ? null : splitQuota(user, "consultations", 1);
  if (!isAdmin && !quotaSplit) {
    return NextResponse.json(
      { error: "Consultation quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

Add the `applyCustomPlanExpiryIfDue` import alongside the existing `applyPlanExpiryIfDue` one (line 12):

```ts
import { applyPlanExpiryIfDue, applyCustomPlanExpiryIfDue } from "@/lib/plan-expiry";
```

Then update every call site to pass `quotaSplit` through:
- Line 156-163 (`finalizeAnswer` for the cached-answer path): add `quotaSplit,` as a field in the object literal.
- Line 186 (`return tryWebFallback(session.user.id, isAdmin, question, expanded.keywords);`) → `return tryWebFallback(session.user.id, isAdmin, quotaSplit, question, expanded.keywords);`
- Line 196 (same call, no-matches branch) → same change.
- Line 263 (`NOT_FOUND_MSG` fallback branch) → same change.
- Lines 270-277 (final `finalizeAnswer` call): add `quotaSplit,` as a field in the object literal.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors — this will catch any missed call site (wrong argument count/order).

- [ ] **Step 5: Manual verification**

Run `npm run dev`, log in as a test user with `consultationsRemaining: 0` but a valid `customConsultationsRemaining: 5` and `customPlanExpiresAt` in the future (set directly in MongoDB or via the admin Users panel), then ask a question in `/chat`. Expected: the question succeeds (not a 403), and afterward `customConsultationsRemaining` has decremented by 1 while `consultationsRemaining` stays at 0. Then set both pools to 0 and confirm the next question gets a 403.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(custom-plan): draw consultation quota from custom pool as overflow"
```

---

### Task 12: Wire `consumeQuota` into the generate (doc generation) route

**Files:**
- Modify: `src/app/api/generate/route.ts`

**Interfaces:**
- Consumes: `splitQuota`, `applyQuotaSplit` (`@/lib/quota`), `applyCustomPlanExpiryIfDue` (`@/lib/plan-expiry`).

- [ ] **Step 1: Update imports**

Change line 10 from:

```ts
import { applyPlanExpiryIfDue } from "@/lib/plan-expiry";
```

to:

```ts
import { applyPlanExpiryIfDue, applyCustomPlanExpiryIfDue } from "@/lib/plan-expiry";
import { splitQuota, applyQuotaSplit } from "@/lib/quota";
```

- [ ] **Step 2: Replace the gate and the decrement**

Replace lines 72-79:

```ts
  user = await applyPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.docGenerationRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Document generation quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

with:

```ts
  user = await applyPlanExpiryIfDue(user);
  user = await applyCustomPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  const quotaSplit = isAdmin ? null : splitQuota(user, "docGeneration", 1);
  if (!isAdmin && !quotaSplit) {
    return NextResponse.json(
      { error: "Document generation quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

Replace line 141-143:

```ts
  if (!isAdmin) {
    saveOps.push(User.findByIdAndUpdate(session.user.id, { $inc: { docGenerationRemaining: -1 } }));
  }
```

with:

```ts
  if (!isAdmin && quotaSplit) {
    saveOps.push(applyQuotaSplit(session.user.id, "docGeneration", quotaSplit));
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Same pattern as Task 11 Step 5, but for `/generate` and the `docGeneration`/`customDocGenerationRemaining` fields.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat(custom-plan): draw doc-generation quota from custom pool as overflow"
```

---

### Task 13: Wire `consumeQuota` into the templates route

**Files:**
- Modify: `src/app/api/templates/route.ts`

**Interfaces:**
- Consumes: `splitQuota`, `applyQuotaSplit` (`@/lib/quota`), `applyCustomPlanExpiryIfDue` (`@/lib/plan-expiry`).

- [ ] **Step 1: Update imports**

Change line 8 from:

```ts
import { applyPlanExpiryIfDue } from "@/lib/plan-expiry";
```

to:

```ts
import { applyPlanExpiryIfDue, applyCustomPlanExpiryIfDue } from "@/lib/plan-expiry";
import { splitQuota, applyQuotaSplit } from "@/lib/quota";
```

- [ ] **Step 2: Replace the gate and the decrement**

Replace lines 39-46:

```ts
  user = await applyPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.docTemplatesRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Template quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

with:

```ts
  user = await applyPlanExpiryIfDue(user);
  user = await applyCustomPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  const quotaSplit = isAdmin ? null : splitQuota(user, "docTemplates", 1);
  if (!isAdmin && !quotaSplit) {
    return NextResponse.json(
      { error: "Template quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

Replace lines 62-65:

```ts
  if (!isAdmin) {
    saveOps.push(
      User.findByIdAndUpdate(session.user.id, { $inc: { docTemplatesRemaining: -1 } })
    );
  }
```

with:

```ts
  if (!isAdmin && quotaSplit) {
    saveOps.push(applyQuotaSplit(session.user.id, "docTemplates", quotaSplit));
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Same pattern as Task 11 Step 5, but for `/templates` and the `docTemplates`/`customDocTemplatesRemaining` fields.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/templates/route.ts
git commit -m "feat(custom-plan): draw template quota from custom pool as overflow"
```

---

### Task 14: Wire `consumeQuota` into the review (doc analysis, multi-credit) route

**Files:**
- Modify: `src/app/api/review/route.ts`

**Interfaces:**
- Consumes: `splitQuota`, `applyQuotaSplit`, `totalRemaining` (`@/lib/quota`), `applyCustomPlanExpiryIfDue` (`@/lib/plan-expiry`).

- [ ] **Step 1: Update imports**

Change line 6 from:

```ts
import { applyPlanExpiryIfDue } from "@/lib/plan-expiry";
```

to:

```ts
import { applyPlanExpiryIfDue, applyCustomPlanExpiryIfDue } from "@/lib/plan-expiry";
import { splitQuota, applyQuotaSplit, totalRemaining } from "@/lib/quota";
```

- [ ] **Step 2: Update the early fast-fail gate**

Replace lines 41-48:

```ts
  user = await applyPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.docReviewRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Document review quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

with:

```ts
  user = await applyPlanExpiryIfDue(user);
  user = await applyCustomPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  if (!isAdmin && totalRemaining(user, "docReview") <= 0) {
    return NextResponse.json(
      { error: "Document review quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }
```

(This is a cheap early pre-check before the file is parsed and `pages`/`creditsRequired` are known — the precise, credit-aware check is Step 3 below.)

- [ ] **Step 3: Update the precise credits check and the decrement**

Replace lines 182-190:

```ts
  const creditsRequired = reviewCreditCost(pages);
  if (!isAdmin && (user.docReviewRemaining ?? 0) < creditsRequired) {
    return NextResponse.json(
      {
        error: `This document (${pages} pages) requires ${creditsRequired} review credits; you have ${user.docReviewRemaining ?? 0} remaining.`,
      },
      { status: 403 }
    );
  }
```

with:

```ts
  const creditsRequired = reviewCreditCost(pages);
  const quotaSplit = isAdmin ? null : splitQuota(user, "docReview", creditsRequired);
  if (!isAdmin && !quotaSplit) {
    return NextResponse.json(
      {
        error: `This document (${pages} pages) requires ${creditsRequired} review credits; you have ${totalRemaining(user, "docReview")} remaining.`,
      },
      { status: 403 }
    );
  }
```

Replace lines 237-241:

```ts
  if (!isAdmin) {
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { docReviewRemaining: -creditsRequired },
    });
  }
```

with:

```ts
  if (!isAdmin && quotaSplit) {
    await applyQuotaSplit(session.user.id, "docReview", quotaSplit);
  }
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Set a test user to `docReviewRemaining: 1`, `customDocReviewRemaining: 5`, `customPlanExpiresAt` in the future. Upload a document that costs 3 review credits (`reviewCreditCost` — a multi-page doc). Expected: the request succeeds, `docReviewRemaining` goes to 0 and `customDocReviewRemaining` goes to 3 (5 − 2, since 1 came from primary and 2 from custom). Confirm via the admin Users panel or MongoDB directly.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/review/route.ts
git commit -m "feat(custom-plan): draw doc-review credits from custom pool as overflow"
```

---

### Task 15: Public rate endpoint + admin rate endpoint

**Files:**
- Create: `src/app/api/custom-plan-rates/route.ts` (public GET)
- Create: `src/app/api/admin/custom-plan-rates/route.ts` (admin GET/PUT)

**Interfaces:**
- Consumes: `getCustomPlanRates` (`@/lib/custom-plan-rates`), `STEP_QUANTITIES`, `CUSTOM_SERVICES` (`@/lib/custom-plan-rates-config`), `getAdminSession` (`@/lib/admin`), `dbConnect` (`@/lib/db`), `CustomPlanRates` model.
- Produces: `GET /api/custom-plan-rates` → `{ rates, steps }` (public, used by the pricing-page builder to fetch fresh prices client-side if needed); `GET`/`PUT /api/admin/custom-plan-rates` → `{ data }` (admin-only, mirrors `/api/admin/features`).

- [ ] **Step 1: Public rate endpoint**

```ts
import { NextResponse } from "next/server";
import { getCustomPlanRates } from "@/lib/custom-plan-rates";
import { STEP_QUANTITIES } from "@/lib/custom-plan-rates-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await getCustomPlanRates();
  return NextResponse.json({ rates, steps: STEP_QUANTITIES });
}
```

Save to `src/app/api/custom-plan-rates/route.ts`.

- [ ] **Step 2: Admin rate endpoint**

```ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";
import { dbConnect } from "@/lib/db";
import { CustomPlanRates } from "@/lib/models/CustomPlanRates";
import { getCustomPlanRates } from "@/lib/custom-plan-rates";
import { CUSTOM_SERVICES } from "@/lib/custom-plan-rates-config";

export const runtime = "nodejs";

function isValidSteps(v: unknown): v is number[] {
  return Array.isArray(v) && v.length === 5 && v.every((n) => Number.isInteger(n) && n >= 0);
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await getCustomPlanRates();
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Record<string, number[]> = {};
  for (const service of CUSTOM_SERVICES) {
    const v = (body as Record<string, unknown>)[service];
    if (isValidSteps(v)) update[service] = v;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await dbConnect();
  await CustomPlanRates.findOneAndUpdate({}, { $set: update }, { upsert: true, returnDocument: "after" });
  revalidatePath("/pricing");
  const data = await getCustomPlanRates();
  return NextResponse.json({ data });
}
```

Save to `src/app/api/admin/custom-plan-rates/route.ts`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

```bash
curl -s http://localhost:3000/api/custom-plan-rates | head -c 500
```

Expected: JSON with `rates` (4 arrays of 5 numbers each) and `steps: [10,50,100,200,300]`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/custom-plan-rates/route.ts src/app/api/admin/custom-plan-rates/route.ts
git commit -m "feat(custom-plan): add public and admin rate-table endpoints"
```

---

### Task 16: Admin panel for editing custom-plan rates

**Files:**
- Create: `src/components/admin/CustomPlanRatesPanel.tsx`
- Modify: `src/components/admin/admin-dashboard.tsx`

**Interfaces:**
- Consumes: `CUSTOM_SERVICES`, `STEP_QUANTITIES`, `DEFAULT_CUSTOM_RATES`, `type CustomPlanRatesData` (`@/lib/custom-plan-rates-config`), `Input`/`Label`/`Button` (`@/components/ui/*`).

- [ ] **Step 1: Write the panel**

```tsx
"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CUSTOM_SERVICES,
  STEP_QUANTITIES,
  DEFAULT_CUSTOM_RATES,
  type CustomPlanRatesData,
} from "@/lib/custom-plan-rates-config"

const SERVICE_LABELS: Record<(typeof CUSTOM_SERVICES)[number], string> = {
  consultations: "კონსულტაციები",
  docTemplates: "მზა შაბლონები",
  docGeneration: "დოკუმენტის გენერაცია",
  docReview: "დოკუმენტის ანალიზი",
}

export function CustomPlanRatesPanel() {
  const [rates, setRates] = useState<CustomPlanRatesData>(DEFAULT_CUSTOM_RATES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch("/api/admin/custom-plan-rates")
      const { data } = await res.json()
      if (active && data) setRates(data)
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  function setCell(service: (typeof CUSTOM_SERVICES)[number], idx: number, gel: string) {
    const minor = Math.round((Number(gel) || 0) * 100)
    setRates((p) => {
      const next = { ...p, [service]: [...p[service]] }
      next[service][idx] = minor
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/custom-plan-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rates),
      })
      if (!res.ok) {
        toast.error("შენახვა ვერ მოხერხდა")
        return
      }
      const { data } = await res.json()
      if (data) setRates(data)
      toast.success("ფასები განახლდა")
    } catch {
      toast.error("ქსელის შეცდომა")
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> იტვირთება…
      </div>
    )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">ინდივიდუალური პაკეტის ფასები</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          თითოეული სერვისისთვის, თითოეულ რაოდენობაზე ფასი ლარში (₾). ცვლილება მყისიერად აისახება /pricing გვერდზე.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2 text-left font-medium">სერვისი</th>
              {STEP_QUANTITIES.map((q) => (
                <th key={q} className="px-4 py-2 text-right font-medium">{q}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOM_SERVICES.map((service) => (
              <tr key={service} className="border-b last:border-b-0">
                <td className="px-4 py-2 font-medium">{SERVICE_LABELS[service]}</td>
                {STEP_QUANTITIES.map((q, idx) => (
                  <td key={q} className="px-2 py-2">
                    <Label className="sr-only" htmlFor={`${service}-${q}`}>
                      {SERVICE_LABELS[service]} {q}
                    </Label>
                    <Input
                      id={`${service}-${q}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={(rates[service][idx] / 100).toString()}
                      onChange={(e) => setCell(service, idx, e.target.value)}
                      className="w-24 text-right"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          შენახვა
        </Button>
      </div>
    </div>
  )
}
```

Save to `src/components/admin/CustomPlanRatesPanel.tsx`.

- [ ] **Step 2: Wire into the admin dashboard nav**

In `src/components/admin/admin-dashboard.tsx`:

Add `SlidersHorizontal` to the lucide-react import list (line 6, alongside `CreditCard`):

```ts
  CreditCard,
  SlidersHorizontal,
```

Add the import (after line 35, the `PlansPanel` import):

```ts
import { CustomPlanRatesPanel } from "@/components/admin/CustomPlanRatesPanel";
```

Add a nav item to the "მართვა" group (after line 156, the `plans` item):

```ts
        { id: "plans", label: "გეგმები", icon: CreditCard },
        { id: "custom-plan-rates", label: "ინდ. პაკეტის ფასები", icon: SlidersHorizontal },
```

Add a case to the render switch (after line 232, the `plans` case):

```ts
    case "plans": content = <PlansPanel />; break;
    case "custom-plan-rates": content = <CustomPlanRatesPanel />; break;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, log in as an admin, open `/admin`, click "ინდ. პაკეტის ფასები" in the sidebar. Confirm the 4×5 grid loads with the seeded prices (9, 29, 49, 79, 99 for consultations, etc.), edit one cell, click "შენახვა", reload the page, and confirm the edited value persisted.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CustomPlanRatesPanel.tsx src/components/admin/admin-dashboard.tsx
git commit -m "feat(custom-plan): add admin panel for editing custom-plan rates"
```

---

### Task 17: shadcn Slider primitive

**Files:**
- Create: `src/components/ui/slider.tsx` (already generated via `npx shadcn@latest add slider` during design verification — this task just confirms/commits it)

**Interfaces:**
- Produces: `Slider` component (`@base-ui/react/slider`-backed, `base-nova` style, matches every other primitive in `src/components/ui/`).

- [ ] **Step 1: Confirm the file exists with this exact content**

`src/components/ui/slider.tsx` should read:

```tsx
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
```

If the file is missing (e.g. starting from a fresh checkout of this plan), regenerate it with:

```bash
npx shadcn@latest add slider --yes
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/slider.tsx
git commit -m "feat(custom-plan): add shadcn Slider primitive"
```

---

### Task 18: Custom plan builder client component

**Files:**
- Create: `src/components/site/CustomPlanBuilder.tsx`

**Interfaces:**
- Consumes: `Slider` (`@/components/ui/slider`), `CUSTOM_SERVICES`, `computeCustomTotal`, `type CustomPlanRatesData`, `type CustomSelection`, `type CustomService` (`@/lib/custom-plan-rates-config`).
- Produces: `<CustomPlanBuilder rates steps services strings />` — a self-contained card with 4 toggle+slider rows, a live total, and a "Build & Pay" button that posts to `/api/checkout/custom`.

- [ ] **Step 1: Write the component**

```tsx
"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Slider } from "@/components/ui/slider"
import {
  CUSTOM_SERVICES,
  computeCustomTotal,
  type CustomPlanRatesData,
  type CustomSelection,
  type CustomService,
} from "@/lib/custom-plan-rates-config"

type ServiceMeta = { key: CustomService; label: string }

export function CustomPlanBuilder({
  rates,
  steps,
  services,
  strings,
}: {
  rates: CustomPlanRatesData
  steps: readonly number[]
  services: ServiceMeta[]
  strings: {
    heading: string
    subtitle: string
    buildAndPay: string
    selectAtLeastOne: string
    checkoutError: string
    networkError: string
  }
}) {
  const [enabled, setEnabled] = useState<Record<CustomService, boolean>>({
    consultations: false,
    docTemplates: false,
    docGeneration: false,
    docReview: false,
  })
  const [index, setIndex] = useState<Record<CustomService, number>>({
    consultations: 0,
    docTemplates: 0,
    docGeneration: 0,
    docReview: 0,
  })
  const [loading, setLoading] = useState(false)

  const selection: CustomSelection = useMemo(() => {
    const out = {} as CustomSelection
    for (const service of CUSTOM_SERVICES) {
      out[service] = enabled[service] ? steps[index[service]] : 0
    }
    return out
  }, [enabled, index, steps])

  const total = computeCustomTotal(rates, selection)
  const gel = total !== null ? (total / 100).toFixed(2).replace(/\.00$/, "") : "0"

  async function buildAndPay() {
    if (total === null || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/checkout/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selection),
      })
      if (res.status === 401) {
        const back = encodeURIComponent(window.location.pathname || "/pricing")
        window.location.href = `/login?callbackUrl=${back}`
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.checkoutUrl) {
        toast.error(data.error ?? strings.checkoutError)
        return
      }
      window.location.href = data.checkoutUrl
    } catch {
      toast.error(strings.networkError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card flex flex-col p-7 card-hover h-full">
      <p className="font-bold text-base mb-1 text-primary">{strings.heading}</p>
      <p className="text-sm text-muted-foreground mb-6">{strings.subtitle}</p>

      <div className="space-y-5 flex-1">
        {services.map((s) => (
          <div key={s.key} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{s.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled[s.key]}
                onClick={() => setEnabled((p) => ({ ...p, [s.key]: !p[s.key] }))}
                className={[
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  enabled[s.key] ? "bg-primary" : "bg-sky-200 dark:bg-sky-900/50",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all",
                    enabled[s.key] ? "left-[22px]" : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </div>
            {enabled[s.key] && (
              <div className="flex items-center gap-3">
                <Slider
                  min={0}
                  max={steps.length - 1}
                  step={1}
                  value={[index[s.key]]}
                  onValueChange={(v) => {
                    const next = Array.isArray(v) ? v[0] : (v as number)
                    setIndex((p) => ({ ...p, [s.key]: next }))
                  }}
                  className="flex-1"
                />
                <span className="w-12 shrink-0 text-right text-sm tabular-nums text-foreground">
                  {steps[index[s.key]]}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-end gap-1 mb-4">
          <span className="text-5xl font-bold text-foreground leading-none">{gel}</span>
          <span className="text-lg font-semibold text-foreground mb-0.5">₾</span>
        </div>
        <button
          type="button"
          onClick={buildAndPay}
          disabled={total === null || loading}
          className="w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 btn-hover border border-border text-primary hover:bg-primary/5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : total === null ? (
            strings.selectAtLeastOne
          ) : (
            strings.buildAndPay
          )}
        </button>
      </div>
    </div>
  )
}
```

Save to `src/components/site/CustomPlanBuilder.tsx`. Note the toggle-switch markup deliberately matches `FeaturesPanel.tsx`'s existing switch styling (`bg-primary`/`bg-sky-200 dark:bg-sky-900/50`, same thumb positions) for visual consistency.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/site/CustomPlanBuilder.tsx
git commit -m "feat(custom-plan): add custom plan builder client component"
```

---

### Task 19: i18n strings

**Files:**
- Modify: `src/lib/i18n/dictionaries.ts`

**Interfaces:**
- Produces: new keys under `pricing` (ka block ~line 37-44, en block ~line 406-412), new keys under `billing` (ka ~line 180, en ~line 549), new keys under `profile` (ka ~line 238-277, en ~line 607+).

- [ ] **Step 1: Add `pricing` keys (Georgian)**

In the `ka` object, change the `pricing` block (lines 37-44) from:

```ts
  pricing: {
    title: "თქვენზე მორგებული პაკეტები",
    subtitle: "აირჩიე მზა პაკეტი ან შექმენით თქვენი საკუთარი.",
    popular: "ყველაზე პოპულარული",
    perMonth: "თვეში",
    join: "აირჩიეთ პაკეტი",
    start: "დაიწყეთ უფასოდ",
  },
```

to:

```ts
  pricing: {
    title: "თქვენზე მორგებული პაკეტები",
    subtitle: "აირჩიე მზა პაკეტი ან შექმენით თქვენი საკუთარი.",
    popular: "ყველაზე პოპულარული",
    perMonth: "თვეში",
    join: "აირჩიეთ პაკეტი",
    start: "დაიწყეთ უფასოდ",
    customTitle: "შექმენით საკუთარი პაკეტი",
    customSubtitle: "აირჩიეთ სასურველი მომსახურება და რაოდენობა — ფასი განახლდება მყისიერად. ერთჯერადი გადახდა, მოქმედებს 30 დღე.",
    customConsultations: "კონსულტაციები",
    customTemplates: "მზა შაბლონები",
    customDocGeneration: "დოკუმენტის გენერაცია",
    customDocAnalysis: "დოკუმენტის ანალიზი",
    customBuildAndPay: "შექმენით და გადაიხადეთ",
    customSelectOne: "აირჩიეთ სულ მცირე ერთი სერვისი",
    customCheckoutError: "გადახდის გვერდი ვერ გაიხსნა.",
    customNetworkError: "სერვისთან კავშირი ვერ დამყარდა.",
  },
```

- [ ] **Step 2: Add `pricing` keys (English)**

Find the mirrored `en.pricing` block (around line 406-412) and add the same new keys with English text, e.g.:

```ts
  pricing: {
    title: "Pricing built around you",
    subtitle: "Choose a ready-made plan or build your own.",
    popular: "Most popular",
    perMonth: "mo",
    join: "Choose plan",
    start: "Get started for free",
    customTitle: "Build your own package",
    customSubtitle: "Pick the services and quantities you need — the price updates instantly. One-time payment, valid 30 days.",
    customConsultations: "Consultations",
    customTemplates: "Ready-made templates",
    customDocGeneration: "Document generation",
    customDocAnalysis: "Document analysis",
    customBuildAndPay: "Build & pay",
    customSelectOne: "Select at least one service",
    customCheckoutError: "Could not open the checkout page.",
    customNetworkError: "Could not reach the server.",
  },
```

(Keep whatever `title`/`subtitle`/etc. text already exists in the `en.pricing` block unchanged — only add the eight new `custom*` keys.)

- [ ] **Step 3: Add `billing.customPackageLabel` (ka + en)**

In `ka.billing` (around line 180), add:

```ts
    customPackageLabel: "ინდივიდუალური პაკეტი",
```

In `en.billing` (around line 549), add:

```ts
    customPackageLabel: "Custom package",
```

- [ ] **Step 4: Add `profile` keys for the dashboard's custom-package block (ka + en)**

In `ka.profile` (around line 238-277), add:

```ts
    customPackageTitle: "ინდივიდუალური პაკეტი",
    customPackageExpiresPrefix: "მოქმედებს",
```

In `en.profile` (around line 607+), add:

```ts
    customPackageTitle: "Custom package",
    customPackageExpiresPrefix: "Valid until",
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (the `ka`/`en` object shapes must stay identical — a missing key in one would only surface as a runtime `undefined`, not a type error, since this file doesn't appear to enforce a shared type between them; visually double check both blocks have the same new keys).

- [ ] **Step 6: Commit**

```bash
git add src/lib/i18n/dictionaries.ts
git commit -m "feat(custom-plan): add i18n strings for the custom plan builder"
```

---

### Task 20: Wire the builder into `/pricing`

**Files:**
- Modify: `src/app/pricing/page.tsx`

**Interfaces:**
- Consumes: `CustomPlanBuilder` (Task 18), `getCustomPlanRates` (`@/lib/custom-plan-rates`), `STEP_QUANTITIES` (`@/lib/custom-plan-rates-config`).

- [ ] **Step 1: Update the page**

Replace the full contents of `src/app/pricing/page.tsx` with:

```tsx
import { PricingSection } from "@/components/site/PricingSection";
import { CustomPlanBuilder } from "@/components/site/CustomPlanBuilder";
import { PageHero } from "@/components/site/PageHero";
import { getVisiblePlans } from "@/lib/plans-db";
import { getCustomPlanRates } from "@/lib/custom-plan-rates";
import { STEP_QUANTITIES } from "@/lib/custom-plan-rates-config";
import { getLocale } from "@/lib/i18n/locale";
import { getDict } from "@/lib/i18n/dictionaries";
import type { Metadata } from "next";
import { buildMetadata, KEYWORDS_KA } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ფასები და პაკეტები — AI იურიდიული კონსულტაცია",
  description:
    "აირჩიეთ პაკეტი: AI იურიდიული კონსულტაცია, ხელშეკრულების შემოწმება და გენერირება, რისკების ანალიზი. უფასო პაკეტი ბარათის გარეშე.",
  path: "/pricing",
  keywords: ["იურიდიული კონსულტაცია ფასი", "ონლაინ იურისტი", ...KEYWORDS_KA],
});

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const [plans, customRates] = await Promise.all([getVisiblePlans(), getCustomPlanRates()]);

  return (
    <div className="animate-fade-up">
      <PageHero title={d.pricing.title} subtitle={d.pricing.subtitle} />

      <PricingSection
        initialPlans={plans}
        locale={locale}
        strings={{
          popular: d.pricing.popular,
          join: d.pricing.join,
          start: d.pricing.start,
          perMonth: d.home.perMonth,
        }}
        heading=""
      />

      <section className="container mx-auto px-4 pb-16 max-w-md">
        <CustomPlanBuilder
          rates={customRates}
          steps={STEP_QUANTITIES}
          services={[
            { key: "consultations", label: d.pricing.customConsultations },
            { key: "docTemplates", label: d.pricing.customTemplates },
            { key: "docGeneration", label: d.pricing.customDocGeneration },
            { key: "docReview", label: d.pricing.customDocAnalysis },
          ]}
          strings={{
            heading: d.pricing.customTitle,
            subtitle: d.pricing.customSubtitle,
            buildAndPay: d.pricing.customBuildAndPay,
            selectAtLeastOne: d.pricing.customSelectOne,
            checkoutError: d.pricing.customCheckoutError,
            networkError: d.pricing.customNetworkError,
          }}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification (browser)**

Run `npm run dev`, open `http://localhost:3000/pricing`. Confirm: the existing Free/Standard/Premium cards render unchanged above; below them, the new "Build your own" card renders with 4 toggles, all off, price showing `0`. Toggle "Consultations" on, drag its slider — confirm the displayed quantity and the total price both update instantly with no network request (check the browser devtools Network tab — no request should fire on slider drag). Toggle a second service on, confirm the total is the sum. Click "Build & pay" while logged out — confirm redirect to `/login?callbackUrl=/pricing`. Log in, click again — confirm either a redirect to a Flitt checkout URL or a clear error toast if Flitt env vars aren't configured in this environment.

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat(custom-plan): render the custom plan builder on the pricing page"
```

---

### Task 21: Dashboard — separate "Custom package" block

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `applyCustomPlanExpiryIfDue` (`@/lib/plan-expiry`).
- Produces: a second, visually distinct block rendered only when the user has an active custom package, alongside the existing (unchanged) subscription `LimitsDialog` block.

- [ ] **Step 1: Import the new expiry helper**

Change line 26 from:

```ts
import { applyPlanExpiryIfDue } from "@/lib/plan-expiry";
```

to:

```ts
import { applyPlanExpiryIfDue, applyCustomPlanExpiryIfDue } from "@/lib/plan-expiry";
```

- [ ] **Step 2: Apply the custom-plan expiry check and compute the block's data**

Change line 60 from:

```ts
  const user = await applyPlanExpiryIfDue(userRaw);
```

to:

```ts
  const user = await applyCustomPlanExpiryIfDue(await applyPlanExpiryIfDue(userRaw));
```

After line 77 (`const docTemplatesRemaining = user.docTemplatesRemaining ?? 0;`), add:

```ts
  const hasCustomPlan = !!user.customPlanExpiresAt && new Date(user.customPlanExpiresAt) > new Date();
  const customExpiresLabel = hasCustomPlan
    ? new Date(user.customPlanExpiresAt as Date).toLocaleDateString(dateLocale)
    : null;
  const customMetrics = hasCustomPlan
    ? (
        [
          { key: "consultations", label: dp.questionsAsked, icon: <MessagesSquare className="h-4 w-4 text-primary" />, remaining: user.customConsultationsRemaining ?? 0 },
          { key: "generate", label: dp.documentsGenerated, icon: <FileText className="h-4 w-4 text-primary" />, remaining: user.customDocGenerationRemaining ?? 0 },
          { key: "review", label: dp.documentsAnalyzed, icon: <FileSearch className="h-4 w-4 text-primary" />, remaining: user.customDocReviewRemaining ?? 0 },
          { key: "templates", label: dp.templatesFilled, icon: <FileText className="h-4 w-4 text-primary" />, remaining: user.customDocTemplatesRemaining ?? 0 },
        ] as { key: string; label: string; icon: React.ReactNode; remaining: number }[]
      ).filter((m) => m.remaining > 0)
    : [];
```

(`React` must be in scope for `React.ReactNode` — add `import type React from "react";` near the top imports if it isn't already implicitly available; check by running the type-check in Step 4 first, since Next's JSX transform often makes this unnecessary.)

- [ ] **Step 3: Render the block**

In the JSX, immediately after the closing `</div>` of the existing limits/services grid and its following `{plan === "free" && (...)}` upgrade card (i.e., right after line 236's `)}` and before the `{/* ── Consultation history preview ── */}` comment on line 239), add:

```tsx
          {hasCustomPlan && customMetrics.length > 0 && (
            <Card className="mb-8 border-t-[3px] border-t-gold card-hover">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                  <p className="font-semibold text-sm">{dp.customPackageTitle}</p>
                  <span className="text-xs text-muted-foreground">
                    {dp.customPackageExpiresPrefix} {customExpiresLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {customMetrics.map((m) => (
                    <div key={m.key} className="flex items-center gap-2 text-sm">
                      {m.icon}
                      <div>
                        <div className="font-semibold tabular-nums">{m.remaining}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. If `React.ReactNode` isn't resolvable, add `import type React from "react";` at the top of the file and re-run.

- [ ] **Step 5: Manual verification (browser)**

Set a test user's `customPlanExpiresAt` to a future date and some `custom*Remaining` fields to non-zero values (via MongoDB or the admin Users panel), reload `/dashboard`. Confirm: the existing subscription "Limits" tile is unchanged, and a new distinctly-styled "Custom package" card appears below it showing only the non-zero services with their remaining counts and the expiry date. Set `customPlanExpiresAt` to a past date, reload — confirm `applyCustomPlanExpiryIfDue` zeroed the fields and the block no longer renders.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(custom-plan): show custom package limits and expiry separately on dashboard"
```

---

### Task 22: Billing page — label custom-package payments distinctly

**Files:**
- Modify: `src/app/billing/page.tsx:50-53`

**Interfaces:**
- Consumes: `d.billing.customPackageLabel` (Task 19).

- [ ] **Step 1: Special-case the "custom" plan key in `planLabel`**

Replace lines 50-53:

```ts
  const planLabel = (key: string) => {
    const p = planMap.get(key);
    return p ? pick(p.name, p.nameEn, locale) : key;
  };
```

with:

```ts
  const planLabel = (key: string) => {
    if (key === "custom") return d.billing.customPackageLabel;
    const p = planMap.get(key);
    return p ? pick(p.name, p.nameEn, locale) : key;
  };
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

After Task 10's manual verification created a `Payment` doc with `plan: "custom"` for a test user, open `/billing` as that user and confirm the payment-history row shows "ინდივიდუალური პაკეტი" (or "Custom package" in English) instead of a raw `custom` key.

- [ ] **Step 4: Commit**

```bash
git add src/app/billing/page.tsx
git commit -m "feat(custom-plan): label custom-package charges in payment history"
```

---

## Self-Review Notes

**Spec coverage:** pricing table & pure math (Task 1), admin-editable rates (Tasks 2, 15, 16), isolated custom quota fields + independent expiry (Tasks 3, 5), one-time Flitt checkout with its own order-id scheme (Tasks 7, 9), callback never touching subscription state (Task 10), primary-then-custom quota consumption across all 4 services (Tasks 6, 11-14), instant client-side pricing with no network round-trip (Tasks 17-18, 20), dashboard showing both pools separately (Task 21), payment history labeling (Task 22). All spec sections have a corresponding task.

**Type consistency:** `CustomService`/`CustomSelection`/`CustomPlanRatesData` (Task 1) are the single source of truth threaded through `custom-plan-rates.ts` (Task 2), `validators.ts`'s `CustomCheckoutSchema` (Task 8, same 4 keys/values), the checkout route (Task 9), the builder component (Task 18), and the admin panel (Task 16) — no renamed duplicates. `QuotaService`/`QuotaSplit` (Task 6) are used identically across all 4 route tasks (11-14).

**No placeholders:** every task has complete, runnable code; no "TBD"/"add error handling"/"similar to Task N" shortcuts.

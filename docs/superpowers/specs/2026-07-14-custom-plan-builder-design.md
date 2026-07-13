# Custom "Build Your Own" Plan — Design

## Goal

A 4th pricing option alongside Free/Standard/Premium: users pick their own quantity
for each of the 4 services (consultations, ready-made templates, document
generation, document analysis) independently — 1, 2, 3, or all 4 — see the price
update instantly, then pay once. Valid 30 calendar days, no auto-renew.

## Steps and quantities

All 4 services share the same 5 selectable quantities: **10, 50, 100, 200, 300**.
Only these 5 values are selectable (discrete slider, not free numeric entry). A
service can also be fully excluded (quantity 0 / not purchased).

At least one service must have a non-zero quantity to check out.

## Pricing table

Real per-unit AI cost (Gemini Flash/Flash-Lite calls, occasional web-search/Haiku
fallback) is a few tetri at most — negligible. The real constraint on "not losing
money" is Flitt's per-transaction fee and support overhead on very small
purchases, not compute cost. Table below prices well above real cost, with a 9 ₾
minimum single-service purchase as a floor above transaction fees, and volume
discount (decreasing ₾/unit) at higher quantities, consistent with the existing
Standard/Premium tiers:

| Qty | Consultations | Templates | Doc Generation | Doc Analysis |
|-----|---|---|---|---|
| 10 | 9 ₾ | 9 ₾ | 12 ₾ | 15 ₾ |
| 50 | 29 ₾ | 19 ₾ | 39 ₾ | 49 ₾ |
| 100 | 49 ₾ | 29 ₾ | 65 ₾ | 79 ₾ |
| 200 | 79 ₾ | 45 ₾ | 109 ₾ | 129 ₾ |
| 300 | 99 ₾ | 59 ₾ | 139 ₾ | 169 ₾ |

Total price = sum of the step-price for every included service (excluded
service contributes 0). Min possible purchase: 9 ₾. Max (all 4 at 300): 466 ₾.

These prices are admin-editable after launch (see Admin section) — this table is
the initial seed, not a hardcoded constant.

## Data model

### `CustomPlanRates` (new singleton, mirrors `FeatureFlags` pattern)

One document holding the current step-price table:

```
consultations:  { s10, s50, s100, s200, s300 }  // GEL minor units (tetri)
docTemplates:   { s10, s50, s100, s200, s300 }
docGeneration:  { s10, s50, s100, s200, s300 }
docReview:      { s10, s50, s100, s200, s300 }
```

The 5 step quantities themselves (10/50/100/200/300) are a shared code constant,
not stored per-service — only prices are admin-editable, the quantity ladder is
fixed.

### User plan fields — custom plan is fully separate from the subscription

**Revised requirement:** the custom package must be purchasable *alongside* an
active Standard/Premium subscription, with its own independent expiration, and
must never cancel or overwrite the subscription. So it does **not** reuse
`plan`/`planExpiresAt`/`subscriptionStatus`/`*Remaining` — those stay exactly
as they are for whatever subscription (or free/none) the user already has. New
fields on `User`, additive to the existing ones:

```
customConsultationsRemaining:  { type: Number, default: 0 }
customDocGenerationRemaining:  { type: Number, default: 0 }
customDocReviewRemaining:      { type: Number, default: 0 }
customDocTemplatesRemaining:   { type: Number, default: 0 }
customPlanExpiresAt:           { type: Date, default: null }
```

No `customPlan` boolean/status field needed — a user "has an active custom
package" iff `customPlanExpiresAt` is set and in the future (checked the same
lazy way as the main plan, see Expiry below).

**Stacking on repeat purchase:** buying a second custom package while the
first is still active **adds** the new quantities to whatever's left of the
old ones (`$inc`, not `$set`) and resets `customPlanExpiresAt` to
`now + 30 days` — one fresh 30-day window covering the combined balance,
rather than tracking multiple expiring batches. Simpler to reason about and
matches "buy more capacity" as the natural reason to stack.

### Expiry

New `applyCustomPlanExpiryIfDue(user)` in `lib/plan-expiry.ts`, parallel to
(and independent of) the existing `applyPlanExpiryIfDue`: if
`customPlanExpiresAt` is set and in the past, zero all four `custom*Remaining`
fields and clear `customPlanExpiresAt`. Never touches `plan`,
`planExpiresAt`, or `subscriptionStatus` — the two expiry timers are
completely decoupled. Called wherever quota or dashboard data is read,
alongside the existing call.

## Payment flow (one-time, not recurring)

- New `createOneTimeCheckout()` in `lib/flitt.ts` — same Flitt checkout API as
  `createSubscriptionCheckout`, but `subscription: "N"` and no `recurring_data`
  block.
- New order-id scheme: `custom_<userId>_<timestamp>` (parallel to the existing
  `sub_<plan>_<userId>_<timestamp>`). Selected quantities travel in
  `merchant_data` as JSON (`{userId, consultations, docTemplates, docGeneration,
  docReview}`) since there's no plan `key` to look up server-side for a custom
  order.
- New route `POST /api/checkout/custom`: validates each quantity is 0 or one of
  the 5 steps, requires at least one non-zero, computes the total **server-side**
  from `CustomPlanRates` (client-submitted price is never trusted), calls
  `createOneTimeCheckout`, persists the pending order on **new, separate**
  fields — `customFlittOrderId`, `customFlittPaymentId` — never touching the
  existing `flittOrderId`/`flittPaymentId`/`subscriptionStatus` fields a real
  subscription may already be using. Keeping these separate is what prevents a
  concurrent custom purchase from corrupting an in-flight or active
  subscription's own pending/callback state.
- `/api/flitt/callback` extended: branch on the `custom_` order-id prefix
  (`parseOrderId` gets a sibling `parseCustomOrderId`). On successful payment,
  read quantities back from `merchant_data`, `$inc` the four
  `custom*Remaining` fields and `$set customPlanExpiresAt`. On failure/decline,
  no user field changes at all (nothing was granted yet). Either way, the
  user's `plan`/`planExpiresAt`/`subscriptionStatus`/regular `*Remaining` are
  untouched by this branch.
- No recurring billing, no Flitt subscription object created — this is a single
  charge.

## Quota consumption — two independent pools

Chat/generate/review/templates routes currently do a single check-then-`$inc`
against one `*Remaining` field per service. That becomes a shared helper,
`consumeQuota(userId, service, amount, user)` in a new `lib/quota.ts`:

1. Read `primary = user[<service>Remaining] ?? 0` and, only if
   `customPlanExpiresAt` is in the future, `custom = user[custom<Service>Remaining] ?? 0` (otherwise `custom = 0`).
2. If `primary + custom < amount` → insufficient, block the request (same 4xx
   behavior as today).
3. Otherwise decrement **primary first**, custom as overflow:
   `fromPrimary = min(primary, amount)`, `fromCustom = amount - fromPrimary`.
   Issue `$inc` on whichever field(s) are non-zero.

Primary-first ordering matches the natural use case: a custom package is
bought specifically to keep working *after* hitting the subscription's (or
free tier's) limit, so it's spent last as overflow capacity, not drained
first while subscription quota sits unused. `review`'s multi-page
`creditsRequired` (currently a single `-creditsRequired` `$inc`) uses the same
helper with `amount = creditsRequired`, so a review that's bigger than what's
left of the primary pool can legitimately spill into the custom pool.

## UI — the builder card

New 4th card on `/pricing`, alongside Free/Standard/Premium, replacing the
static price/CTA with an interactive builder:

- One row per service (Consultations, Templates, Doc Generation, Doc Analysis):
  a toggle (include/exclude) + a 5-position discrete slider (shadcn `Slider`,
  snapped to `[10,50,100,200,300]`, not continuous — matches your confirmed
  choice).
- A live total price, recomputed client-side on every change from a rate table
  fetched once on page load (new lightweight `GET /api/custom-plan-rates`,
  public). No network round-trip per interaction — instant per your requirement.
- "Build & Pay" button, disabled until at least one service is toggled on.
  Clicking posts the 4 quantities to `/api/checkout/custom` and redirects to the
  returned Flitt checkout URL, same pattern as the existing `UpgradeButton`.
- Card must be rebuilt/re-selected every time (no saved draft) — this is
  explicitly a one-time, one-shot purchase per your requirement ("user must
  create this plan each time").

Purchasing is available regardless of current subscription state — free,
Standard, Premium, or already holding an active custom package all see the
same builder card and can check out. This is a pure top-up; there's no
interaction with `/api/checkout` (the subscription flow) at all.

## Dashboard — two separate limit blocks

`app/dashboard/page.tsx` currently renders one `LimitsDialog` built from the
user's plan-derived limits (`consultLimit`/`genLimit`/`reviewLimit`/
`templatesLimit` from `getPlanByKey`) and one `*Remaining` set. This becomes
two clearly separated blocks, shown side by side (or stacked on mobile):

1. **Subscription block** (unchanged data) — the existing plan name, status
   badge, period-end date, and the 4 `LimitMetric`s built from
   `planData`/`*Remaining` exactly as today. Hidden only if the user has never
   had any plan info (never happens — `free` always renders).
2. **Custom package block** (new) — only rendered when `customPlanExpiresAt`
   is set and in the future (after `applyCustomPlanExpiryIfDue` runs). Shows
   its own 4 `LimitMetric`s built from `custom*Remaining` (no "total" bundle
   size to compare against since it's a la carte — display used, since last
   purchase, isn't tracked separately from the subscription's usage counters,
   so this block shows **remaining** quota per service, not a used/total bar)
   and its own expiry date (`customPlanExpiresAt`), styled/labeled distinctly
   ("Custom package" vs "Subscription") so the two never read as one merged
   plan.

Both blocks read from the same single `User.findById` — no extra query.

## Admin

New section in the admin dashboard (next to `PlansPanel`), following the
`FeaturesPanel` singleton-save pattern: a 4×5 grid of GEL price inputs (one per
service × step), save button, no other configuration (the quantity ladder
itself is not admin-editable, only prices).

## Out of scope

- Multi-currency (stays GEL like the rest of the app).
- Auto-renewal of the custom plan (explicitly one-time).
- Editable quantity ladder (fixed at 10/50/100/200/300 in code).
- Refunds (not handled for Standard/Premium either).
- Tracking per-pool usage history separately (dashboard shows remaining
  custom quota, not a used/total bar for it — see Dashboard section).

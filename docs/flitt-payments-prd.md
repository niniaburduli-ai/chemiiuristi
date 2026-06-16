# PRD — Flitt Payments (replace Dodo) with subscription billing

## Goal
Replace Dodo Payments with **Flitt** (docs.flitt.com) for subscription billing of two
plans:

| Plan | Price | minor units (GEL) |
| --- | --- | --- |
| `standard` | 19 GEL / month | `1900` |
| `premium`  | 99 GEL / month | `9900` |

A signed-in user picks a plan → hosted Flitt checkout → on approval Flitt calls our
server callback → we upgrade the user's plan and reset their monthly quota.

## Why protocol 2.0
Flitt's flat SHA1 signature (`secret|sorted values|…`) cannot sign the nested
`recurring_data` object (confirmed empirically + via Fondy's Node SDK). Subscriptions
therefore use **protocol 2.0**:

```
data      = base64( JSON({ order: { ...orderFields, subscription:"Y", recurring_data:{…} } }) )
signature = sha1( PAYMENT_KEY + "|" + data )
body      = { request: { version: "2.0", data, signature } }
POST https://pay.flitt.com/api/checkout/url/
→ { response: { data: base64(JSON({ order: { checkout_url, payment_id } })), signature } }
```

Verified live against the Flitt test merchant — returns a real `checkout_url`.

## Credentials (env only — never committed)
| Env | Value source |
| --- | --- |
| `FLITT_MERCHANT_ID` | merchant id (4057182 prod / 1549901 test) |
| `FLITT_PAYMENT_KEY` | purchase secret key (used for checkout + callbacks) |
| `FLITT_CREDIT_KEY`  | payout/credit secret (refunds/payouts — not used yet) |

Test merchant for local dev: `1549901` / `test`. Live merchant charges real cards.

## Components
1. **`src/lib/flitt.ts`** — signing (v2 base64 + v1 flat), `createSubscriptionCheckout(plan, user)`,
   `verifyCallback(body)`, `stopSubscription(orderId)`, plan→amount map, activation helpers
   (reuse `PLAN_LIMITS`).
2. **`POST /api/checkout`** — auth-gated; builds a unique `order_id` that embeds
   `userId` + `plan`, creates a protocol-2.0 subscription checkout, returns `checkoutUrl`.
3. **`POST /api/flitt/callback`** — public; verifies signature (v2 and v1), parses
   `order_id` → user + plan, on `order_status=approved` upgrades + resets quota, on
   declined/expired downgrades. Idempotent by `order_id`/`payment_id`. Returns 200.
4. **UpgradeButton** — unchanged; calls `/api/checkout`.
5. **User model** — `flittOrderId`, `flittPaymentId`, `subscriptionStatus` (keep field).
6. **Remove Dodo** — `lib/dodo.ts`, `/api/webhooks/dodo`, `dodopayments` + `standardwebhooks` deps, env.

## recurring_data
```
{ amount: <plan minor units>, period: "month", every: 1, quantity: 120, state: "y" }
```
`quantity: 120` ≈ 10 years of monthly charges (Flitt requires `quantity` or `end_time`).
Initial checkout `amount` == recurring amount.

## Mapping callback → user
`order_id = "sub_<plan>_<userId>_<ts>"`. Callback parses it; `merchant_data` carries
`{userId,plan}` as backup. Plan changes are set (not incremented) → idempotent.

## Out of scope (later)
Billing page real data, proration on plan change, refunds via credit key, invoice list.

## Test plan
- Signature v2 round-trip (done — live checkout_url).
- Callback signature verify (v2 + v1) + DB activation round-trip with throwaway user.
- `tsc` + `lint` + `build` green.

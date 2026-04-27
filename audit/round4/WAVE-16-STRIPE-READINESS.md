# Wave 16 — Stripe Activation Readiness Report

**Date:** 2026-04-27
**Project:** cesoir-app (Next.js 16, Vercel)
**Bet #1 RICE:** 240 (very high impact, very low effort once gaps closed)
**Verdict (TL;DR):** **Readiness 6/10 — NO-GO until 3 hard blockers fixed.**

The integration code is **excellent** — clean architecture, signed webhooks, server-side flag enforcement, RLS-protected tables, validated metadata, rate limits, fail-safe defaults. **Flipping the boolean alone will produce a broken paywall** because the Stripe products/price IDs do not yet exist. Estimated **2.5–4 h** of operational work + **30 min** of code change to ship safely.

---

## 1. Flag Inventory

### Definition
- **`src/lib/featureFlags.ts:33`** — `monetizationEnabled: false` (single source of truth, exported as `MONETIZATION_ENABLED` and `FEATURE_FLAGS.monetizationEnabled`)
- **`src/lib/featureFlags.ts:44-47`** — `isMonetizationEnabledServer()` requires **both** the client flag **AND** `process.env.STRIPE_ENABLED === "true"` (defence-in-depth, lets staging flip env without rebuild)

### Consumers (15 sites — all gated correctly)

| File | Line(s) | Behavior when flipped |
|---|---|---|
| `src/lib/premium-gate.ts` | 41, 78 | Stops returning `true` for everyone → re-applies free-tier daily-like cap (100/day) |
| `src/lib/useSubscription.ts` | 64, 101, 115, 147 | Hook starts hitting `/api/stripe/checkout`, `/api/stripe/portal` instead of short-circuiting |
| `src/lib/useRoses.ts` | 120, 121, 130, 169, 180 | Roses become finite (was UNLIMITED_ROSES) — users must pay or earn them |
| `src/lib/useSwipeUndo.ts` | 91, 97 | Undo stops being free for non-premium |
| `src/app/(app)/premium/page.tsx` | 89, 107 | Stops redirecting to `/why-free`, renders the paywall picker |
| `src/app/(app)/shop/page.tsx` | 54, 68 | Stops redirecting, renders rose/boost packs |
| `src/app/(app)/browse/page.tsx` | 406, 410 | Surfaces upsell CTAs in the browse footer |
| `src/components/venues/VenueDashboard.tsx` | 249, 515, 518, 522 | "Activer Featured" goes from disabled to live |
| `src/app/api/stripe/checkout/route.ts` | 44 | 503 → 200 with Checkout URL |
| `src/app/api/stripe/portal/route.ts` | 34 | 503 → 200 with portal URL |
| `src/app/api/stripe/webhook/route.ts` | 241 | 503 → 200, processes events |

> **Important:** since the server side reads `process.env.STRIPE_ENABLED === "true"`, the client flag flip alone is **not** enough — the env var must be set on Vercel too, otherwise the API routes keep returning 503.

---

## 2. Stripe Integration Audit

### Files present

| Path | Status | Notes |
|---|---|---|
| `src/lib/stripe/server.ts` | ✅ | Pinned API version `2026-03-25.dahlia`, placeholder fallback for build, `isStripeConfigured()` helper |
| `src/lib/stripe/client.ts` | ✅ | Singleton `loadStripe()`, gracefully returns null if pk missing |
| `src/lib/stripe/plans.ts` | ⚠️ | **All 7 price IDs are placeholders** (`price_REPLACE_ME_*`) — code is correct, data is not |
| `src/app/api/stripe/checkout/route.ts` | ✅ | Auth + rate limit + zod + price-ID whitelist + customer reuse + trial wiring |
| `src/app/api/stripe/portal/route.ts` | ✅ | Auth + rate limit + zod + customer lookup |
| `src/app/api/stripe/webhook/route.ts` | ✅ | **Signature verified**, raw body, service-role client, 7 event types |
| `supabase/migrations/006_stripe_subscriptions_purchases.sql` | ✅ | Tables `subscriptions` + `purchases`, RLS (self-select/update only), service-role-only inserts |
| `STRIPE_SETUP.md` | ✅ | Comprehensive walkthrough, test cards, Vercel CLI commands |
| `src/lib/premium-gate.test.ts` | ✅ | 11 unit tests (isPremium, getDailyLikeCap, edge cases) |

### Env variables expected (from `.env.sample`)

| Var | Required for | Status (sample file) |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side `loadStripe()` | Placeholder `pk_test_REPLACE_ME` |
| `STRIPE_SECRET_KEY` | Server API routes | Placeholder `sk_test_REPLACE_ME` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Placeholder `whsec_REPLACE_ME` |
| `STRIPE_ENABLED` | **Required by `isMonetizationEnabledServer`** | ❌ **Not in `.env.sample`** — will silently fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook RLS bypass | Already used elsewhere |
| `NEXT_PUBLIC_APP_URL` | Stripe redirect URLs (optional) | Optional, falls back to Origin/Host |

### Dependencies (package.json)
- ✅ `stripe@^22.0.2` (server)
- ✅ `@stripe/stripe-js@^9.2.0` (client)

---

## 3. Gap Analysis

### 3.1 Webhook signature verification
**Status: ✅ DONE**
- `webhook/route.ts:261` calls `stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET)` correctly
- Raw body read via `await request.text()` (line 257), `runtime = "nodejs"`, `dynamic = "force-dynamic"` set
- Returns 400 on invalid signature, 503 if secret missing
- Idempotency handled by `upsert` on `stripe_subscription_id` / `stripe_payment_intent_id`

### 3.2 Price IDs hardcoded vs env-configured
**Status: ⚠️ NEEDS REVIEW (intentional design choice)**
- Price IDs are hardcoded in `src/lib/stripe/plans.ts` as a **whitelist** (security: prevents `price_<malicious>` from reaching `stripe.checkout.sessions.create`)
- This is the **right pattern** — env-driven price IDs would weaken validation
- BUT all 7 are placeholders: `price_REPLACE_ME_monthly`, `price_REPLACE_ME_annual`, `price_REPLACE_ME_roses_5/15/30`, `price_REPLACE_ME_boosts_3/10`
- **Action:** create the 7 products in Stripe Dashboard → copy real `price_xxx` → edit `plans.ts` → commit

### 3.3 Success / cancel redirect URLs
**Status: ✅ DONE**
- `resolveBaseUrl()` (checkout:27, portal:19) handles 3 cases in priority order:
  1. `process.env.NEXT_PUBLIC_APP_URL` (explicit override)
  2. `request.headers.get("origin")` (browser-driven)
  3. `request.headers.get("host")` (proxy fallback, picks `https` unless localhost)
- Will work on `cesoir-app.vercel.app` and on a custom domain without code change
- **Optional improvement:** set `NEXT_PUBLIC_APP_URL=https://cesoir.app` (or whatever the prod domain is) on Vercel for explicitness

### 3.4 TODO/FIXME in Stripe code
**Status: ✅ NONE FOUND**
- `grep -r "TODO|FIXME|XXX|HACK"` against `src/app/api/stripe` and `src/lib/stripe` returns 0 matches
- Code reads as production-grade

### 3.5 Test coverage
**Status: ⚠️ NEEDS REVIEW**
- ✅ `src/lib/premium-gate.test.ts` — 11 unit tests (free-tier cap, premium-tier Infinity, status edge cases)
- ❌ **No tests** for `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook` routes themselves
- ❌ No integration test using Stripe CLI fixtures (`stripe trigger checkout.session.completed`)
- **Risk:** a regression in body-parsing or zod schema would only be caught in prod
- **Recommendation:** before flipping, run the manual checklist in `STRIPE_SETUP.md` §6 end-to-end with `stripe listen` forwarding

### 3.6 DB schema
**Status: ✅ DONE**
- Migration 006 exists, defines `subscriptions` (8 statuses CHECK) + `purchases` (4 statuses CHECK)
- RLS enabled, SELECT/UPDATE self-only, INSERT/DELETE service-role-only
- All needed indexes present (`user_id`, `stripe_*_id`, `status`, `customer_id`)
- `updated_at` trigger on subscriptions
- **Verify:** confirm migration is applied in Supabase prod (`SELECT * FROM information_schema.tables WHERE table_name IN ('subscriptions','purchases')`)

### 3.7 Stripe Customer Portal configuration
**Status: ❌ MISSING (manual Stripe Dashboard step)**
- Code calls `stripe.billingPortal.sessions.create()` (`portal/route.ts:109`)
- Stripe **requires** the portal to be activated on the dashboard before sessions can be created
- Without this: `/api/stripe/portal` returns 500 "Impossible d'ouvrir le portail de facturation"

### 3.8 Webhook endpoint registration
**Status: ❌ MISSING**
- Code is ready to receive, but no endpoint registered on Stripe Dashboard yet
- 7 events expected: `checkout.session.completed`, `customer.subscription.{created,updated,deleted,trial_will_end}`, `invoice.{paid,payment_failed}`, `payment_intent.succeeded`

### 3.9 TypeScript strictness on webhook payloads
**Status: ⚠️ NEEDS REVIEW (works but uses casts)**
- Lines 195 + 204 in `webhook/route.ts` cast `invoice` to `{ subscription?: string | Stripe.Subscription }`
- Reason: the pinned API version `2026-03-25.dahlia` returns `subscription` on Invoice, but the SDK type may not reflect it cleanly
- Acceptable but worth re-checking on first real `invoice.paid` event in test mode

### 3.10 Rate limiting
**Status: ✅ DONE (10/min/user on checkout + portal), ⚠️ Upstash recommended for prod**
- Without `UPSTASH_REDIS_REST_URL` set, rate limit is in-memory per Lambda → 5 instances × 10 = 50 attempts/min possible
- See `.env.sample:34-44` — already documented

---

## 4. Activation Steps (in order)

### Phase A — Stripe Dashboard (45 min, zero code)
1. Create Stripe account on `mr.guessousyoussef@gmail.com`, stay in **Test mode**
2. Get `pk_test_xxx` + `sk_test_xxx` from https://dashboard.stripe.com/test/apikeys
3. Create 2 subscription products + 5 one-time products (see `STRIPE_SETUP.md` §2 for exact names/prices)
4. Activate **Customer Portal** at https://dashboard.stripe.com/test/settings/billing/portal (logo, allow cancel + update card + view history)
5. Create Webhook endpoint pointing at `https://<vercel-domain>/api/stripe/webhook` with the 7 events listed in §3.8 → copy `whsec_xxx`

### Phase B — Code (30 min)
6. **`.env.sample`**: add `STRIPE_ENABLED=false` line (with comment explaining flip mechanic)
7. **`src/lib/stripe/plans.ts`**: replace the 7 `price_REPLACE_ME_*` with real `price_xxx` from Phase A step 3
8. **`src/lib/featureFlags.ts:33`**: flip `monetizationEnabled: false` → `monetizationEnabled: true`
9. Commit (e.g., `feat(stripe): activate monetization for Wave 16`)

### Phase C — Vercel env vars (15 min)
10. Add 4 production env vars on Vercel:
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx`
    - `STRIPE_SECRET_KEY=sk_test_xxx`
    - `STRIPE_WEBHOOK_SECRET=whsec_xxx`
    - `STRIPE_ENABLED=true`
11. Optional: `NEXT_PUBLIC_APP_URL=https://<prod-domain>`
12. Trigger redeploy (env var change does not auto-redeploy in all Vercel plans)

### Phase D — Smoke test (45–60 min)
13. Open prod `/premium` → 2 plans render with real prices (9.99 / 59.99 EUR)
14. Click "Essai gratuit 7 jours" → redirect to Stripe Checkout
15. Pay with `4242 4242 4242 4242` (CVC 123, exp 12/34) → redirect back to `/premium?status=success`
16. Verify Supabase: `SELECT * FROM subscriptions WHERE user_id = <test_user>` → row with `status = 'trialing'`
17. Reload `/premium` → CTA changed to "Gérer ma subscription" → click → Stripe Billing Portal opens
18. Cancel sub in portal → verify `cancel_at_period_end = true` in DB
19. Test `/shop` → buy 1 rose pack → verify row in `purchases` table

### Phase E — Live mode promotion (when ready, separate go-live decision)
20. Complete Stripe KYC (IBAN, business address)
21. Recreate the 7 products in **Live mode** (Test mode products are not shared)
22. Update `plans.ts` with new live `price_xxx`, swap env vars to `pk_live_xxx` / `sk_live_xxx`, recreate webhook in Live, swap `STRIPE_WEBHOOK_SECRET`

---

## 5. Time Estimate (to flip safely)

| Phase | Time | Can be parallelized? |
|---|---|---|
| A — Stripe Dashboard setup | 45 min | No (needs human in browser) |
| B — Code changes + commit | 30 min | After A |
| C — Vercel env vars + redeploy | 15 min | After B |
| D — Manual smoke test | 45–60 min | After C |
| **Total (Test mode)** | **~2.5–3 h** | One person, one sitting |
| E — Live mode promotion | 1–2 h + KYC waiting time | Separate go-live |

---

## 6. Risk Assessment (per gap if skipped)

| If you flip without… | What breaks | Severity |
|---|---|---|
| Setting `STRIPE_ENABLED=true` env on Vercel | Every API route returns 503 — paywall shows but checkout fails silently | 🔴 **Critical** (UX disaster) |
| Replacing `price_REPLACE_ME_*` in `plans.ts` | Stripe rejects `price_REPLACE_ME_monthly` → 400 → user sees "Impossible de créer la session de paiement" | 🔴 **Critical** |
| Registering the webhook on Stripe Dashboard | Subscriptions created via Checkout never write to `subscriptions` table → user pays but app keeps treating them as free | 🔴 **Critical** (revenue + trust loss) |
| Activating Customer Portal in Stripe Dashboard | `/api/stripe/portal` returns 500, users can't cancel/update card → support tickets | 🟠 **High** |
| Setting `STRIPE_WEBHOOK_SECRET` env on Vercel | Webhook returns 400 "Invalid signature" → same effect as missing webhook | 🔴 **Critical** |
| Confirming migration 006 is applied in prod DB | Webhook upserts to non-existent table → 500 on every event → Stripe retries indefinitely | 🔴 **Critical** |
| Setting Upstash Redis env vars | Rate limit per-Lambda → ~50 checkout attempts/min/user instead of 10 → minor brute-force surface | 🟡 **Medium** |
| Smoke test before announcing | First real customer is your QA → high-visibility bug if any of the above is wrong | 🟠 **High** |

---

## 7. Final Score & Recommendation

### Readiness: **6 / 10**
- Code: **9/10** (production-grade, no TODOs, signed webhooks, RLS, zod, rate limits)
- Data: **2/10** (price IDs are placeholders, no Stripe account configured)
- Ops: **3/10** (no dashboard products, no webhook endpoint, no portal activated, env vars absent)
- Tests: **5/10** (good unit coverage on premium-gate, no integration tests on routes)

### Verdict: **NO-GO** for "just flip the flag" — but **GO** for a 3-hour deliberate activation session

### Top 3 Blockers
1. **Stripe products do not exist** → 7 placeholders in `plans.ts` will cause 400 on checkout (Phase A step 3 + Phase B step 7)
2. **`STRIPE_ENABLED` env var is missing** from `.env.sample` and Vercel — server-side `isMonetizationEnabledServer()` returns false even after flag flip (Phase B step 6 + Phase C step 10)
3. **Webhook not registered + portal not activated** in Stripe Dashboard → subscriptions silently broken even if checkout succeeds (Phase A steps 4–5)

### Recommended Path
- Block out a **3-hour focused session** (one person, one sitting)
- Follow Phase A → B → C → D in order, do not parallelize
- Stay in **Test mode** for at least one week of internal usage before Phase E (Live promotion)
- After Phase D, schedule a follow-up agent in 7 days to verify no `customer.subscription.*` event got dropped on retry — see Wave 16 Bet #2 if applicable

# CeSoir — API Design Audit (Round 3)

Date: 2026-04-26
Scope: Supabase RPC + Next.js API routes (no Edge Functions exist).

---

## 1. RPC + Endpoint Inventory

### PostgreSQL RPC functions (callable via PostgREST)

| Function | Args | Returns | Security | Comment |
|---|---|---|---|---|
| `nearby_profiles` | lat, lng, radius_km, mode, gender, age_min, age_max, limit | TABLE (12 cols, lat_rough/lng_rough grid-snapped) | INVOKER, STABLE | Yes, mig 024 |
| `online_hotspot_profiles` | () | TABLE(id, lat_rough, lng_rough) | INVOKER, STABLE | Yes |
| `claim_invite_code` | p_code TEXT | TABLE(code, claimed_by, claimed_at, inviter_id, roses_granted, badge_granted) | DEFINER | Yes, mig 025 |
| `mint_user_invite_codes` | p_count INT (1..10) | TABLE(code) | DEFINER | Yes |
| Triggers (non-RPC): `set_user_wallet_updated_at`, `user_settings_touch_updated_at`, `events_touch_updated_at`, `auto_hide_profile`, `grant_early_moon_badge`, `set_subscriptions_updated_at` | n/a | TRIGGER | varies | n/a |

Plus view: `v_waitlist_count` (security_invoker, anon SELECT).

### Next.js /api/* routes

| Method | Path | Auth | Rate-limit | Response shape |
|---|---|---|---|---|
| POST | `/api/auth/login` | none | 5/60s per (ip,email) | `{ ok, user }` / `{ error, code }` |
| POST | `/api/auth/signup` | none | 3/hr per IP | `{ user, session }` / `{ error }` |
| POST | `/api/auth/logout` | cookie | none | `{ ok: true }` |
| POST | `/api/auth/forgot-password` | none | 3/15min per (ip,email) | `{ ok: true }` |
| GET | `/api/health` | none | none | `{ status, checks, version }` |
| GET | `/api/waitlist` | none | s-maxage 60 | `{ signedUp }` |
| GET | `/api/recommendations` | required | none | `{ candidates: [...] }` |
| POST | `/api/swipe` | required | DB-counted daily cap | `{ matched, conversationId, swipesRemaining, resetAt }` |
| GET/POST | `/api/undos`, `/api/undos/[id]` | required | 10/min per user | `{ undos, count }` / `{ id, undoneAt }` |
| GET/POST | `/api/wallet/roses` | required | 10/min per user (POST) | `{ balance, action?, amount? }` |
| POST | `/api/squad/join` | required | 5/min per IP | `{ joined, squad_id }` |
| POST | `/api/invites/claim` | mixed (verify=anon, claim=Bearer) | 10/min per IP | `{ valid, reason }` / `{ claimed, data }` |
| GET/POST | `/api/invites/mine` | Bearer only | none | `{ codes }` |
| POST | `/api/venues/events` | Bearer + email whitelist | none | `{ event }` |
| POST | `/api/account/delete` | required | 1/hr per user | varies |
| POST | `/api/moderate-message`, `/api/moderate-photo` | required | named limiter | `{ flagged, categories, scores }` |
| POST | `/api/stripe/checkout`, `/api/stripe/portal` | required | yes | `{ url }` |
| POST | `/api/stripe/webhook` | Stripe sig | none | `{ received: true }` |

Realtime channels live in `useChat`, `useSupabaseQuery`, `usePushNotifications`, `AuthContext`, `reset-password` page (5 subscribers).

---

## 2. Five Design Wins

1. **`nearby_profiles` RPC is properly hardened (mig 024).** SECURITY INVOKER + STABLE + `SET search_path` + grid-snap (~500m) + bidirectional `user_blocks` filter + `auth.uid()` cached via subquery. This is textbook PostGIS-on-Supabase.
2. **Atomic invite-claim via SECURITY DEFINER RPC (mig 025).** `claim_invite_code` does row lock (`FOR UPDATE`), wallet upsert, achievement insert, and re-mint in a single transaction. No client-side race possible.
3. **Idempotency on swipe (POST /api/swipe).** `interactions` has a unique constraint, INSERT on collision returns `23505` mapped to **HTTP 409 `already_swiped`** — a deliberate fix replacing a previous UPSERT that silently flipped match state.
4. **Centralized auth via `requireUser()` + `apiError`/`apiRaw` helpers.** 13 of 22 routes use the unified helper — consistent 401 handling, Bearer + SSR cookie fallback.
5. **Premium gating via DB-derived caps** (`getDailyLikeCap`) instead of trusting the client; `swipesRemaining` and `resetAt` returned in the same response — clients don't need a second round-trip.

---

## 3. Five Issues (severity + fix)

| # | Sev | Issue | Suggested fix |
|---|---|---|---|
| 1 | **HIGH** | **No pagination anywhere.** `useConversations` does `select("*").or(...)` with no `.range()`; `findMatches` over-fetches `limit*3` and slices in memory; `/api/undos` returns all of today; `/api/invites/mine` returns all codes. At 100+ matches per user this thrashes. | Introduce keyset pagination on `last_message_at` for conversations; add `?cursor=` to `/api/recommendations` returning `nextCursor` + opaque base64 of `(score,id)` tuple. |
| 2 | **HIGH** | **Inconsistent error shape across routes.** Compare: login returns `{ error, code }`; swipe returns `{ error, code, issues }`; venues returns bare `{ error: error.message }` (leaks Postgres text); invites/claim returns `{ error: msg }` with no code. Mobile clients can't reliably switch on a single field. | Standardize on `{ error: { code, message, details? }, requestId }` (RFC 7807-ish). The `apiError` helper exists — make it mandatory via lint rule and migrate the 9 holdouts. |
| 3 | **MED** | **Squad join is non-atomic** (`squads.update` then `squad_invites.update`). If the second write fails (`markErr` only logs) the user is in the squad but invite still appears unused — re-claimable by anyone. | Move to a `claim_squad_invite(p_code)` SECURITY DEFINER RPC like `claim_invite_code`, single transaction. |
| 4 | **MED** | **Rate-limit coverage gaps.** `/api/recommendations` (the most expensive endpoint — 4 batched queries + RPC) has **none**. `/api/invites/mine` has none. `/api/venues/events` has none. | Apply `checkRateLimit(\`recos:${userId}\`, 60, 60_000)` minimum; named limiter `recommendations` profile in `rate-limit.ts`. |
| 5 | **MED** | **Realtime over-subscription risk.** `useConversations` re-subscribes on every userId change without explicit channel cleanup audit; chat hook fires before AuthContext seeds Realtime auth (already partially fixed in supabase.ts but the timing is fragile). One Realtime client per browser tab is fine, but unsubscribed channels accumulate during HMR and on `/messages` route bounces. | Standardize on `useRealtimeChannel` everywhere (already exists in `useSupabaseQuery.ts`), enforce via lint that raw `supabase.channel()` calls outside that hook are forbidden. |

---

## 4. Operational Gaps (no severity, but flagged)

- **No OpenAPI spec.** Mobile/PWA clients infer from `src/types/matching.ts` — drift between `SwipeResponse` TS interface and actual route is on the honor system. Generate spec from Zod schemas in `src/lib/validation.ts` (zod-to-openapi).
- **No versioning.** `/api/swipe` not `/api/v1/swipe`. The day a return field is renamed (`swipesRemaining` → `quota.remaining`) every cached PWA shell breaks.
- **No `requestId`** propagated in responses or logs — incident triage means grepping by user_id only.
- **`venue_location` stubbed to Montpellier centroid** — every venue-created event sits on the same PostGIS point. `nearby` ranking on events will be meaningless until geocoding lands.

---

## 5. Three Strategic Recommendations

1. **Introduce versioned `/api/v2/feed` cursor endpoint** that fuses `recommendations` + `swipe-state` + `wallet-snapshot` into a single hydration call (BFF pattern). Cuts 4 round-trips on `/browse` cold start to 1, unlocks server-side ranking experiments without client deploys, and gives a clean break from the `?lat=&lng=` query bag.
2. **Make every state-changing RPC a SECURITY DEFINER function and forbid table-level INSERT/UPDATE/DELETE from authenticated** (already done for invites + wallet; replicate for `interactions`, `squads`, `mode_activations`). The Next.js routes shrink to thin auth + validation wrappers; business invariants live next to the data and can't be bypassed by a leaked anon key.
3. **Publish an OpenAPI 3.1 contract generated from Zod** (`src/lib/validation.ts` → spec) and gate CI on `openapi-diff` against the previous tag. Kills silent client/server drift, auto-generates the future React-Native SDK, and makes versioning (`/v1` → `/v2`) reviewable in a PR diff.

---

**Files of interest (absolute paths):**
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/supabase/migrations/024_location_privacy.sql`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/supabase/migrations/025_invite_rewards_hybrid.sql`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/src/lib/matching.ts`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/src/app/api/swipe/route.ts`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/src/app/api/squad/join/route.ts`
- `C:/Users/mrgue/CLAUDE CODE/cesoir-app/src/app/api/recommendations/route.ts`

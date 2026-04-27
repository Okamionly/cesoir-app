# CeSoir — Product Roadmap (Wave 16 candidates)
_PM synthesis · 2026-04-26 · based on codebase audit Wave 15_

---

## 1. Current State

CeSoir has made the right hard call: 14 modes killed down to 4, PMF focus locked on Montpellier, and the shift from invite-only to hybrid open-signup with rewards (mig 025) is the correct density-over-exclusivity bet at this stage. The technical foundation is genuinely solid — PostGIS geofencing, bidirectional block enforcement (mig 024), a gamification stack (20 levels, XP system, karma tiers), Stripe fully wired behind a flag, and a referral loop that mints codes atomically. The weakness is that almost none of this is visible to users: `MONETIZATION_ENABLED = false` means zero revenue signal, the gamification engine (levels 1–20, XP rewards, level-gated features like "Createur de Modes") has no frontend surface confirmed in the codebase, referral tracking still falls back to localStorage instead of the DB-backed invite_codes table, and the events system (mig 019/020) is fully admin-only with no user-generated soirees. The app has more backend than product. Wave 16 is about closing that gap.

---

## 2. Top 5 Wave 16 Bets

### Bet 1 — Monetization Switch (Stripe Activation)
**Pitch:** Flip `MONETIZATION_ENABLED = true`, wire real Stripe price IDs, ship the paywall.
**Problem solved:** Zero revenue. Every user is implicitly premium — there is no reason to pay.
**Success metric:** 3% of WAU convert to Premium Mensuel (9.99 EUR) within 30 days of activation. Target MRR: 300 EUR at 100 WAU → 3,000 EUR at 1,000 WAU.
**Effort:** S (Stripe code fully written, plans defined, gate logic exists — pure config + QA)
**Confidence:** High (Tinder/Bumble validated this paywall structure; code is production-ready)
**Open questions:** Which features stay free vs. gated at launch? Recommend: keep 10 likes/day free, gate "see who liked you" (highest willingness-to-pay signal per Hinge data). Does the 7-day trial apply to annual? Confirm Stripe webhook endpoint is deployed on Vercel.

**RICE:** Reach=all users(100%), Impact=3(massive — enables the business), Confidence=80%, Effort=1pw → score=240

---

### Bet 2 — Gamification Frontend (XP visible to users)
**Pitch:** Surface the level/XP system that already exists in the backend on profile and feed screens.
**Problem solved:** Users complete profile, match, and message with no visible progression feedback. The 20-level engine, level rewards (Super Like at L3, Priority Mode at L5, Aura Neon at L10), and XP actions are fully computed but invisible — zero retention hook.
**Success metric:** D7 retention increases by 8pp. Secondary: 40% of active users reach Level 3 ("Explorateur") within first week.
**Effort:** M (profile XP bar, level-up toast, reward unlock screen — design + 3 frontend components)
**Confidence:** High (Duolingo, Bumble BFF, and Hinge's "Roses" all validate visible progression as a D7 retention lever)
**Open questions:** Does level progress persist in DB already or only in memory? If not, need a `user_xp` table. Which XP actions are currently instrumented server-side vs. client-only?

**RICE:** Reach=80%, Impact=2(high), Confidence=80%, Effort=2pw → score=64

---

### Bet 3 — User-Created Soirees (Events write access)
**Pitch:** Let users post a Plus-One invite as a structured event, replacing the freeform mode activation.
**Problem solved:** Plus-One mode ("Besoin d'un +1 pour un event ce soir") has no structured event object — it's a profile tag, not a listable soiree. Users cannot browse "what's happening tonight" from other users. The events table (mig 019) is admin-write-only.
**Success metric:** 20% of Plus-One activations result in a user-posted soiree within 60 days of launch. Target: 10 user soirees/week in Montpellier by day 90.
**Effort:** M (add INSERT RLS policy for authenticated users, build post-soiree form, link to Plus-One mode flow)
**Confidence:** Medium (Shotgun validated curator model; UGC soirees add moderation overhead. Bumble's "BFF Events" flopped — but CeSoir's hook is stronger because it's tonight-specific)
**Open questions:** Moderation plan for spam/inappropriate soirees? Cap on user-created events (e.g., 1/day per user)? Does the `event_rsvps` going_count need a cap to avoid fake social proof?

**RICE:** Reach=40%(Plus-One users), Impact=2(high), Confidence=50%, Effort=3pw → score=13

---

### Bet 4 — DB-Backed Referral (Kill localStorage)
**Pitch:** Replace the localStorage referral tracking in `referral.ts` with the `invite_codes` table (mig 021/025) so refer counts are real, persistent, and cross-device.
**Problem solved:** `trackInvite()` writes to localStorage — clears on logout, breaks on new device, is invisible to the backend, and makes the tier system (Bronze/Argent/Or/Diamant) meaningless since the server never sees it. The `ambassador` achievement (5 invites) can never be awarded server-side.
**Success metric:** 100% of invite claims reflected in user's referral count within 24h. Ambassador badge award rate measurable in DB.
**Effort:** S (claim_invite_code RPC already handles inviter attribution — just wire `getReferralInfo()` to query `invite_codes` via Supabase instead of localStorage)
**Confidence:** High (pure technical fix, no product uncertainty)
**Open questions:** Migration path for users with existing localStorage data (likely negligible at current user count)?

**RICE:** Reach=100%(infrastructure), Impact=1(medium — enables trust in viral loop), Confidence=100%, Effort=0.5pw → score=200

---

### Bet 5 — Push Notification Core Loop (Match + Message)
**Pitch:** Activate `usePushNotifications` (already in the lib) for match and new message events to drive same-session re-engagement.
**Problem solved:** CeSoir is a tonight-app — matches decay in hours. Without push, a user who matches at 8pm and doesn't reopen the app by 10pm misses the window. `notification-config.ts` and `usePushNotifications.ts` exist but there is no confirmation they are live.
**Success metric:** Match-to-first-message rate increases from baseline by 15pp within 30 days. Push opt-in rate above 60% (Tinder benchmark is ~55% on PWA).
**Effort:** M (PWA service worker config, Supabase Realtime subscription for new matches, permission prompt UX)
**Confidence:** Medium (PWA push on iOS is limited pre-iOS 16.4 — target Android-first)
**Open questions:** Is the service worker currently registered and functional? What is the current match-to-message baseline? iOS Safari push support confirmed for target demo?

**RICE:** Reach=70%, Impact=2(high), Confidence=50%, Effort=2pw → score=35

---

## 3. What I Would Kill

**Kill 1 — Mode Explorer achievement (`modesUsed >= 5`)**
Only 4 modes exist. This achievement is permanently unachievable and pollutes the achievements screen. Either redefine it as "used all 4 modes" or remove it. Cost of confusion > cost of deletion.

**Kill 2 — Level 20 reward "Createur de Modes"**
Promising users they can create their own modes at Level 20 (25,000 XP) is a liability the product cannot support. It requires 10,000+ messages or 250 friend invites to reach — no early user will see it. Ship it only when the feature exists, or replace it with something achievable.

**Kill 3 — Annual Premium at 59.99 EUR before proving monthly**
The `premium_annual` plan with "2 mois offerts" messaging is premature. At zero paying users, an annual commitment asks for trust the product hasn't earned. Launch monthly only (9.99 EUR, 7-day trial), prove retention, then introduce annual in Wave 17. The plan object can stay in code — just don't expose it in the paywall UI yet.

---

## 4. 30-60-90 Day Plan

### Day 30 (Wave 16 core)
- DB-Backed Referral live (S effort, high confidence — ship first)
- Stripe activated: real price IDs, `MONETIZATION_ENABLED = true`, paywall on /premium
- Monthly plan only, 7-day trial, Stripe webhook confirmed on Vercel
- Mode Explorer achievement fixed (4 modes, not 5)
- KPI: first paying user, referral count in DB accurate

### Day 60 (Wave 16 growth)
- Gamification frontend: XP bar on profile, level-up toast, reward unlock for L3/L5/L10
- Push notifications live for match + new message (Android-first)
- `user_xp` table confirmed or added if missing
- KPI: D7 retention measured with baseline, push opt-in rate tracked, 3% conversion to premium

### Day 90 (Wave 17 preview)
- User-created soirees: INSERT policy open, post-soiree form in Plus-One flow
- Moderation layer (simple: cap 1 soiree/day/user + report button)
- Annual plan exposed in paywall if monthly conversion proves >2%
- Kill Level 20 "Createur de Modes" reward or ship real mode creation MVP
- KPI: 10 user-created soirees/week, soiree-to-match conversion rate

---

_All RICE scores assume ~100 WAU at Wave 16 launch (Montpellier PMF cohort). Recalibrate Reach numbers once analytics confirm active user count._

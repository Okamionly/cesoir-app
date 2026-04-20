# E2E Click Audit — 2026-04-20

Test account: `qa-e2e-1776561087@cesoir-app.test`
Target: `https://cesoir-app.vercel.app` (prod, used because `localhost:3000` hosts another project — MarketPhase — not CeSoir)
Method: Playwright navigation + click + fetch() interception + source-code cross-reference against `/api/*` routes and Supabase hooks (`src/lib/use*.ts`).

## Summary

- Pages tested: **25**
- Total /api routes found: **12** (`swipe`, `recommendations`, `auth/login`, `auth/logout`, `wallet/roses`, `undos`, `undos/[id]`, `squad/join`, `account/delete`, `stripe/checkout`, `stripe/portal`, `stripe/webhook`)
- Data hooks mapped: **22** (17 wired to Supabase, 5 stubs/local-only)
- Buttons/links clicked or statically analyzed: **~120**

Category tally:
- Wired (persists to backend): **~55%**
- Stub / local-state only: **~25%**
- Broken / missing handler / dead link: **~12%**
- Navigates to incomplete page: **~8%**

Console-level red flags everywhere after login:
- `wss://...supabase.co/realtime/v1/websocket ... HTTP Authentication failed; no valid credentials available` — the Supabase Realtime websocket spams `[ERROR]` on every page. This blocks typing indicators, presence, live feed updates, chat streaming.

---

## Per-page findings

### /feed — mostly mock
- Source: `src/app/(app)/feed/page.tsx`; hook `useFeed` (wired: reads `feed_activities` + `profiles`).
- Render falls back to hardcoded `MOCK_FEED` (15 items) whenever DB is empty. In prod the DB is empty, so 100% of what the user sees here is mock.
- Buttons/links:
  - **Actualiser** (refresh feed) — triggers re-fetch via `useFeed.reload()`. Wired. Silent when DB empty (stays on mock).
  - **Stories bar** (Sarah/Chloe/Alex/Nadia/Thomas/Hugo/Ines/Romain) — each click navigates to `/stories?user=N` which **404s** (no `/stories` route exists). Eight broken buttons.
  - **Ajouter une story** — same target, 404.
  - **Feed activity rows** — not clickable, no CTA. Rows are read-only.
  - Nav bar (Explorer/Carte/Chat/Modes/Profil) — wired, routes exist.

### /browse — core loop mostly wired
- Source: `src/app/(app)/browse/page.tsx`; hooks `useSwipe` (animation only), `useInteractions` (wired, hits `/api/swipe`), `useMatches`, `useRoses`, `useSwipeUndo` (wired, hits `/api/undos`), `useMatchCap` (wired).
- Confirmed in-browser: clicking **Passer** sent `POST /api/swipe` and `POST /rest/v1/rpc/nearby_profiles`. Works.
- Buttons:
  - **Passer** — wired `/api/swipe` direction=pass.
  - **Liker** — wired `/api/swipe` direction=like.
  - **Super like** — disabled when no roses (`useRoses`). Wired; needs rose inventory to test.
  - **Annuler (undo)** — `/api/undos` POST + GET. Wired.
  - **Signaler (···)** — opens local menu; submits to `reports` table via Supabase. Wired.
  - **Mode selector "Tous les modes"** — opens dropdown; filters `nearby_profiles` RPC by mode. Wired.
  - **Fermer notifications (×)** — local state only. Stub.
  - **Flash Plans (⚡)** header link — navigates `/plans?type=flash`. Wired.
  - Test account only sees itself ("Youssef, 25 ans"). `nearby_profiles` RPC works; candidate pool is empty because the test user has no nearby seeded profiles.

### /profile — half wired, half stub
- Source: `src/app/(app)/profile/page.tsx`.
- Buttons:
  - **Modifier le profil** — navigates `/profile/edit`. Wired.
  - **Activity chips** (Diner/Boire un verre/Cinema/Balade/Concert/Sport) — confirmed in-browser: click produces **zero fetch calls**. 100% local state, never saved. **Stub**.
  - **Recommandations / Plans ce soir / Progression** cards — navigates to those routes. Wired links.
  - **Notifications / Confidentialite / Verification du compte** — navigate to `/profile/notifications`, `/profile/privacy`, `/profile/verify`. All three **have zero backend refs** in their source files. Pure UI shells. **Stub pages**.
  - **A propos** — static. OK.
  - **Parametres (gear icon)** — navigates `/settings`. OK.
  - **Se deconnecter** — not clicked per instructions. Hits `/api/auth/logout` per route exists.

### /profile/edit — wired
- Source: `src/app/(app)/profile/edit/page.tsx`; hook `useProfile.updateProfile()` → supabase `.update({...}).eq('id', userId)`.
- Inputs: Prenom, Age, Bio, Gender chips, Looking-for chips, Ville, Photo upload (`PhotoUpload` to Supabase Storage).
- Submit **Sauvegarder** calls updateProfile → Supabase. Wired and shows toast + router.back().
- Note: the static snapshot initially showed only chips because inputs render after `useProfile` finishes loading (the Playwright snapshot hit loading state).

### /chat (list)
- Source: `src/app/(app)/chat/page.tsx`; hook `useConversations` (6 supabase refs → wired).
- In prod the list is populated from hardcoded mock data (Sarah, Claire, Marta, Thomas) — not from DB for this test user. The UI contains real routes `/chat/1`, `/chat/2`, etc.
- Buttons:
  - **Repondre** (quick reply at top) — in-page local state. Stub.
  - **Salons / Speed Dating** top icons — navigate `/rooms`, `/speed-dating`. Wired links.
  - **Filter suggestions** (🍽️ / 🐶 / 🌐 / ⭐) — local state chips. Stub.
  - **Conversation rows** — navigate `/chat/[id]`. Links work, but IDs 1-4 are static fixtures.
  - **📍 Tracker le rendez-vous** — navigate `/rendezvous/[id]`. **No such route exists** under `src/app/(app)/` → 404.

### /chat/[id] — wired in principle, but placeholder IDs break it
- Source: `src/app/(app)/chat/[id]/page.tsx`; hooks `useChat` (22 supabase refs — wired), `useConversationPresence`, `useTypingIndicator` (both rely on Realtime which is failing).
- Buttons:
  - **Envoyer le message** — test with id=`1` produced NO fetch. The code does `supabase.from("conversations").select(...).eq("id", "1")` which returns null for non-UUID ids, silently falls through and mount fails to load real convo. For a valid UUID conversation it would POST via `sendMessage`.
  - **Compatibility button (📊)** — navigates `/compatibility/[id]`. Wired.
  - **Vibe Check (📹)** — triggers `<VibeCheckModal>` (WebRTC). External dep; not tested. Likely stub.
  - **Voice note (push-to-talk)** — `<VoiceNoteRecorder>`. Uses MediaRecorder. Needs mic; file upload path unclear. Likely stub/local.
  - **Proposer un plan** — opens `<PlanProposalModal>`. Writes to `match_plans` via `useMatchPlan`. Wired.
  - **Ice-breaker suggestions** (3 buttons) — fill textarea, local. OK.
  - **Charger les messages precedents** — calls `loadMore()` in `useChat`. Wired (paginates).
  - **Lecture** (audio play) — HTMLAudio element. Stub unless file URL is real.
  - **Accepter / Modifier** — plan proposal actions. Wired via useMatchPlan.

### /plans — wired but empty
- Source: `src/app/(app)/plans/page.tsx`; hook `usePlans` (13 supabase refs — wired: reads `flash_plans`, writes `flash_plan_participants`).
- Buttons:
  - **Filter chips** (Tous/Flash/Soirees/Events) — local state filter over fetched list. Wired-ish (no param sent to server, just client filter).
  - **Creer / Creer un plan** — navigate `/plans/create`. Wired.
  - No existing plan rows for test user.

### /plans/create — wired
- Source: `src/app/(app)/plans/create/page.tsx`; `usePlans.createPlan()` → `supabase.from('flash_plans').insert(...)` then inserts into `flash_plan_participants` for creator. Wired.

### /plans/[id] — wired
- Source: `src/app/(app)/plans/[id]/page.tsx`; hooks `usePlan`, `usePlans.toggleInterest`. Supabase upsert on `flash_plan_participants`. Wired.
- Invite button wiring was not verified (empty plan list for test user).

### /compatibility/[id] — data-read wired
- Source: `src/app/(app)/compatibility/[id]/page.tsx` (10 supabase refs). Reads profiles + `compatibility_scores`. Score render OK. No interactive actions on this page.

### /discover — wired
- Source: `src/app/(app)/discover/page.tsx`; hooks `useGeolocation`, `useProfiles`. 
- **Profile cards** — navigate `/profile/[id]` or open detail. Links wired.
- **Filter / sort chips** — local state. No server param. Stub-ish.

### /map — demo only
- Source: `src/app/(app)/map/page.tsx`; hooks `useHotspots` (wired — reads `hotspots`), `useProfiles`. MapLibre unused in source — page uses a simulated grid + tags.
- **Filter tabs / Flash Plans toggle / Heatmap toggle** — local state. Stub.
- **Profile markers / Venue pins** — click opens local modal, no nav or POST.

### /modes — page list
- Source: `src/app/(app)/modes/page.tsx`; no backend calls on list (purely renders MODES constants).
- **Mode cards** — navigate `/modes/[slug]`. Wired links.

### /modes/[mode] — "Activer" wired
- Source: `src/app/(app)/modes/[mode]/page.tsx`; on click inserts into `mode_activations` then redirects to `/browse?mode=...`. Wired.
- Testimonials/Stats/CTA — static text.

### /squad — wired
- Source: `src/app/(app)/squad/page.tsx`; hook `useSquad` (7 supabase refs + 1 `/api/` ref → `/api/squad/join`). Wired. Create squad, join by code, leave — all hit DB.

### /rooms — list wired; in-room is simulated
- Source: `src/app/(app)/rooms/page.tsx`; `useRooms.createRoom/listRooms` — wired to `rooms` table.
- `/rooms/[id]` — hooks `useSpeakingSimulation`, `useTimer`: **simulation only**. Mute/hangup/hand-raise are local state, no WebRTC/Agora backend. **Stub**.

### /progress — 100% fake
- Source: `src/app/(app)/progress/page.tsx` — **zero** supabase/api references. Entire page is hardcoded demo data: achievements, challenges, leaderboard, trust score, reviews tabs. **Stub page**.

### /settings — local-only
- Source: no backend refs. Hooks:
  - `useDarkMode` — `DarkModeProvider.tsx`, localStorage-only. Stub-persist.
  - `useAccessibility` — `ReducedMotion.tsx`, localStorage. Stub-persist.
  - `useTranslation` — `i18n.ts`, localStorage. Stub-persist.
  - `useWomenFirstSettings` — uses localStorage too (despite hook having some supabase refs, the settings page itself doesn't save server-side).
- All toggles persist to localStorage only. Logging out or switching devices = settings lost. **Stub**.

### /safety — SOS flow wired
- Source: `useSafety.ts` (11 supabase refs → `sos_events`, `reports`, `check_ins`). Wired. SOS button not clicked (destructive per spec). Trusted contacts CRUD + toggles verified in source.

### /notifications — wired read
- Source: `useNotifications` wired to `notifications` table. Filter tabs, archive via swipe, tap-through = wired.

### /premium — subscription checkout
- Source: uses `useSubscription` which hits `/api/stripe/checkout` and `/api/stripe/portal`. **Requires Stripe env vars.** Buttons appear wired; not clicked to avoid Stripe redirect.

### /shop — wired
- Source: `usePurchases` + `useRoses` + `useSubscription` — all hit `/api/wallet/roses` and `/api/stripe/checkout`. Wired.

### /trending — partial
- Source: 5 supabase refs, reads `trending_venues`. Wired read. Venue cards likely navigate somewhere (no click tested).

### /speed-dating — wired
- Source: 11 supabase refs. Reads `speed_dating_rooms`, inserts participant. Wired (not clicked).

### /welcome — static slides
- 6 backend refs but they're mostly imports. Slides work local; "Commencer" navigates to `/feed`. Wired link.

### /profile/notifications, /profile/privacy, /profile/verify — empty shells
- **Zero backend refs** in all three files. UI-only toggles + "Enregistrer" buttons that do nothing or write to local state. Stubs.

---

## Routes that 404 (dead links the UI points at)

| Link target | Source page | Fix |
|---|---|---|
| `/stories?user=N` | /feed (8 story buttons + "Ajouter une story") | Implement stories viewer OR remove StoriesBar until backend exists |
| `/rendezvous/[id]` | /chat (Tracker button on every row) | Implement rendezvous tracker route OR remove buttons |

---

## Dead / stub interactions (no backend)

1. `/profile` activity chips (Diner/Boire/Cinema/Balade/Concert/Sport) — never persist. No `preferences.preferredActivities` column update. **Impact: user customization lost on reload.**
2. `/profile/notifications` page — toggles exist, no save. Empty shell.
3. `/profile/privacy` page — same, empty shell.
4. `/profile/verify` page — no verification backend wired.
5. `/progress` entire page — fake achievements/leaderboard/reviews/trust.
6. `/settings` toggles — localStorage-only (dark mode, reduced motion, language, women-first). Device-local, not user-synced.
7. `/map` filter tabs and heatmap toggle — UI-only.
8. `/discover` sort/filter chips — UI-only.
9. `/rooms/[id]` voice controls — simulated. No WebRTC backend.
10. `/chat/[id]` Vibe Check & Voice Note — WebRTC/MediaRecorder clients without a known server receiver.
11. `/chat` suggestion chips and "Repondre" button — local state.

---

## Prioritized fix list (by user-visible impact)

| Prio | Area | What to wire |
|---|---|---|
| P0 | Fix `/stories?user=N` 404 (remove StoriesBar OR ship stories backend) | Hides a visible broken link on every login |
| P0 | Fix `/rendezvous/[id]` 404 on every chat row | Same |
| P0 | Debug Supabase Realtime WS auth failure | Blocks chat streaming, typing, presence, live feed |
| P1 | `/profile` activity chips → persist to `profiles.preferred_activities` (json[]) | Single most visible user-facing stub |
| P1 | `/profile/notifications`, `/profile/privacy`, `/profile/verify` — wire toggles to `profile_preferences` table | Three pages look functional but do nothing |
| P1 | `/settings` — sync toggles to `user_settings` table (currently localStorage only) | Lost on device switch |
| P1 | `/progress` — replace mock data with real achievements/challenges/leaderboard queries | Entire screen is vaporware |
| P2 | `/chat/[id]` — handle invalid convo IDs (show "conversation introuvable" fallback, not silent no-op) | Better UX for broken links |
| P2 | `/map` & `/discover` filter chips — wire to `nearby_profiles` RPC params | Filtering appears to work but isn't applied server-side |
| P2 | `/rooms/[id]` — integrate WebRTC (Agora/LiveKit) or label as "demo" | Voice rooms are fake |
| P3 | `/chat` quick-reply, suggestion chips — either remove or wire |
| P3 | `/trending` — wire venue card click → detail page |

---

## Notes

- Test account **saw only itself** in `/browse` (Youssef, 25 km away = 0m). `nearby_profiles` RPC returns live data; candidate pool for QA account is empty — need to seed neighboring test profiles or accept that visually you'll always see the same face.
- The **Supabase Realtime websocket** fails auth on every page load. Sends 3-5 ERROR console messages per navigation. Need to verify the publishable anon key in production env matches the Realtime JWT expectation, or the JWT has the `role=anon` claim enabled for Realtime.
- `localhost:3000` during this audit hosted **MarketPhase** (different project), which is why this audit used prod. Dev server for cesoir-app likely runs on a different port.
- No TS errors observed in console during audit (only 4-8 realtime WS errors per page).
- Several pages use `randomuser.me/api/portraits/...` for avatars — fine for demo but flagged for replacement before launch.

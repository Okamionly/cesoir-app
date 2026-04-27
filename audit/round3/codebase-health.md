# CeSoir Codebase Health Audit (Round 3)
Date: 2026-04-26 — Scope: src/**/*.{ts,tsx}, total ~72,237 LOC

## God files (top 15, >500 LOC)
1. `src/lib/supabase-types.generated.ts` — 2531 — Supabase types (auto-generated, IGNORE)
2. `src/components/chat/IceBreakerGame.tsx` — 1636 — 6 game types in one file (2v1m/preferes/question/multi/top3/emoji-story)
3. `src/app/(app)/chat/[id]/page.tsx` — 1104 — Chat room: 8 special-message types, voice/plan/location/game/music/AI wingman
4. `src/lib/motion-design.ts` — 1087 — Motion system (springs/variants per page) — large but cohesive design tokens, OK
5. `src/app/(app)/profile/verify/page.tsx` — 1080 — Selfie/ID verification flow
6. `src/app/(app)/map/page.tsx` — 1029 — Maplibre + Supercluster + filters + carousel + hotspots
7. `src/lib/useEvents.ts` — 857 — Events CRUD + RSVP + filters
8. `src/components/landing/SceneController.tsx` — 824 — Landing 3-scene cinematic
9. `src/lib/dateIdeas.ts` — 741 — Static dataset
10. `src/app/(app)/discover/page.tsx` — 698 — Swipe deck + filters
11. `src/app/(app)/progress/page.tsx` — 668 — Gamification dashboard
12. `src/lib/useChat.ts` — 647 — Chat hooks (messages/typing/presence)
13. `src/components/venues/VenueDashboard.tsx` — 626 — Venue admin
14. `src/app/(app)/browse/page.tsx` — 613 — Profile browser grid
15. `src/lib/useAssistant.ts` — 602 — AI assistant hook (still has hardcoded datasets, see TODO)

## God functions (>100 LOC inside one function)
- `src/app/(app)/chat/[id]/page.tsx` — `ChatPage` default export is essentially ~900 LOC of JSX/handlers (split by "feature blocks" but single component)
- `src/components/chat/IceBreakerGame.tsx` — `GameCard` + 6 game-type renderers in one file
- `src/app/(app)/map/page.tsx` — `MapPage` map init + cluster effect chain (~400 LOC effects)
- `src/app/(app)/profile/verify/page.tsx` — verification step machine, single component

## Dead code candidates
- `src/lib/useAuth.ts` — re-export shim of `@/context/AuthContext`, marked `// DEPRECATED`. **No imports** from `@/lib/useAuth` anywhere — safe to delete after one final grep
- `src/lib/useProfile.ts` — only consumed by `src/app/(app)/profile/edit/page.tsx`. Single-call wrapper around `supabase.from('profiles').select('*')`. Either inline or replace with `useSupabaseQuery`
- `src/components/app/MockQR.tsx` — deterministic fake QR (no scanning), used in `PresentationClient.tsx` only. Confirm if real QR is planned (mig 026?) or keep as design placeholder
- `src/app/(app)/profile/invites/page.tsx` — pure redirect stub to `/invites/mine` — KEEP (intentional bookmark redirect, dated 2026-04-26)
- No similar legacy redirect-only stubs found elsewhere

## Duplicated patterns
1. **`useState(true)` loading + manual fetch + setLoading(false)** — repeated in `compatibility/[id]/page.tsx`, `invites/mine/page.tsx`, `progress/page.tsx`. Should use `useAsyncResource` (already exists in `src/lib/hooks/`)
2. **Haversine / distance calculations** — implemented in 7 files: `lib/compatibility.ts`, `lib/mapClustering.ts`, `lib/matching.ts`, `lib/useHotspots.ts`, `app/(app)/map/page.tsx`, `components/map/LiveActivityPanel.tsx`, `components/map/MapFiltersSheet.tsx`. No central `geo.ts` util
3. **Direct `supabase.auth.getUser()` calls** — 10 files (`map/page.tsx`, `profile/delete`, `register`, `signup-quick`, `useInteractions`, `api/auth.ts`, `supabase/helpers.ts`, etc.). Should funnel through `AuthContext` everywhere
4. **`new Date(x).toLocaleDateString/TimeString`** in 18 files — no shared `formatDate(x, locale)` helper

## TODOs by severity (16 total)
- **P0 (blocking real prod use): 2**
  - `usePushNotifications.ts:53` — push endpoint placeholder, no real subscribe-to-Edge-Function
  - `useAssistant.ts:23` — hardcoded prompt datasets instead of `/api/assistant/suggestions`
- **P1 (soon): 5**
  - `chat/page.tsx:18` — flash-notes new-match flag not wired
  - `feed/page.tsx:160` — squads/mutual-likes proximity not wired
  - `plan/[matchId]/page.tsx:48` — peer profile not fetched, uses placeholder
  - `modes/[mode]/page.tsx:538` — `mode_reviews` table missing
  - `useRoses.ts:43` — refill done client-side only, no DB cron
- **P2 (later): 9** — 8 are `WAVE-16` reactivation comments for killed modes (`dateIdeas`, `eventModeMapping`, `mode-colors`, `modes`, `recommendations`, `useAssistant`, `validation`) + `useInteractions:253` (merge block into swipe API)

## Type safety
- **2 `as any`** (both in `SelfieVerification.tsx` for face-api.js dynamic import — justified)
- **1 `@ts-expect-error`** (`lib/nsfw.ts:65` — nsfwjs dynamic import — justified)
- **28 `eslint-disable`** — mostly `react-hooks/exhaustive-deps` (10) + `no-explicit-any` for face-api/dynamic imports (8) + `no-console` in logger/sw (6) + `no-require-imports` for nav lazy-load (4). Low risk

## Mock data status (46 files match "mock", 14 actually wired)
- **`src/lib/mock-profiles.ts`** — `MOCK_PROFILES` array REMOVED 2026-04-20, only `Profile` type remains. Type still imported by 14 files (browse/discover/map/modes pages + SwipeCard/ProfileCard/MapCarousel/ProfileFlyInCard + useProfiles/useAssistant/useSwipeUndo/recommendations) — type-only, no runtime mocks
- **Real mocks in production code: 0** — all `mock` matches are either: (a) type imports, (b) `MockQR` design placeholder, (c) test fixtures in `src/test/`
- **Tests using mocks (legitimate): 6 files** in `src/test/mocks/` + `*.test.ts(x)` (api/auth, swipe, response, matching, premium-gate, hooks)

## Suggested next steps
1. Delete `src/lib/useAuth.ts` (deprecated shim, zero imports)
2. Extract `lib/geo.ts` (haversine + bearing) — kills 7 duplicate impls
3. Extract `lib/format.ts` (`formatDate`, `formatTime`, `formatRelative`) — kills 18 duplicates
4. Migrate 3 manual-loading pages to `useAsyncResource`
5. Resolve P0 TODOs: push endpoint + assistant suggestions API
6. Split `chat/[id]/page.tsx` into `<ChatHeader>`, `<ChatComposer>`, `<ChatMessageList>` (1104 → ~3x300)
7. Split `IceBreakerGame.tsx` into 6 per-type files + barrel export

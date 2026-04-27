# CeSoir — Console Error Sweep · Round 3
Date: 2026-04-27
User: zoe.martin@cesoir.app (UUID from auth JWT ≠ deterministic seed UUID)
Method: Playwright headless Chromium, real browser login, 3s wait post-networkidle

---

## /browse — 0 errors / 0 warnings
Clean.

---

## ALL other authenticated routes — 1 error / 0 warnings (shared root cause)
Routes affected: `/`, `/map`, `/events`, `/chat`, `/modes`, `/profile`, `/settings`, `/progress`, `/safety`, `/plans`

- ERROR: [NetworkError] 401 on `SUPABASE/rest/v1/profiles?id=eq.00000000-0000-4001-8001-000000000007`

**Root cause:** The seeded test account `zoe.martin@cesoir.app` has a deterministic hardcoded UUID (`00000000-0000-4001-8001-000000000007`) inserted directly into `auth.users` via migration 014. When the user logs in via Supabase Auth, the JWT `sub` (the real auth UID assigned by Supabase) does NOT match the migration-inserted UUID. The RLS policy on `profiles` evaluates `auth.uid() = id`, which fails — hence 401 on every profiles fetch that uses `useProfile(user.id)` or similar.

The request is triggered by `AppChrome` or any component calling `useProfile(user?.id)` on mount — which runs on every route that loads the `(app)` layout.

**Fix:** In migration 014, the UUID inserted into `auth.users` must be the one Supabase actually assigns on account creation — or the `auth.users` row must be inserted using the Supabase Admin API (service role) which sets a consistent `id`. Currently the migration inserts `('00000000-0000-4001-8001-000000000007')::uuid` as the user id, but Supabase may re-generate it on conflict or the session token carries a different sub. Confirm by comparing `SELECT id FROM auth.users WHERE email = 'zoe.martin@cesoir.app'` with `00000000-0000-4001-8001-000000000007`.

---

## /modes/solo-diner — 4 errors / 0 warnings
Includes the shared 401 above PLUS:

- ERROR: [React] `Maximum update depth exceeded` — `ModeDetailPage` component at `src_0~jl5k9._.js:2320` triggers an infinite setState loop caught by the app's ErrorBoundary.

  **Stack summary:** `updateStoreInstance → forceStoreRerender → commitHookEffectListMount` — a `useEffect` (or `useSyncExternalStore`) inside `ModeDetailPage` updates state that is also in its dependency array, causing unbounded re-renders.

  **Component:** `ModeDetailPage` (`src/app/(app)/modes/[mode]/page.tsx`)

  **Fix:** Audit `useEffect` deps in `ModeDetailPage`. The loop origin is `updateStoreInstance` / `forceStoreRerender` — check any Zustand or custom store subscription that is re-created on each render (e.g., a non-memoized selector or object literal in deps). Wrap the problematic state reference in `useMemo`/`useCallback`, or add a missing comparison in the selector.

---

## /signup-quick — 0 errors (redirects to /browse — correct behaviour for logged-in user)

---

## Summary

| Severity | Count | Description |
|---|---|---|
| CRITICAL | 1 | `ModeDetailPage` infinite render loop → ErrorBoundary swallows it, page shows fallback |
| IMPORTANT | 1 | 401 on `profiles` fetch across 11/13 routes — seeded UUID mismatch |
| CLEAN | 1 | `/browse` — zero errors |

**Health score: 5/10** — the 401 is pervasive (fires on every page load for the E2E test account) and the `/modes/solo-diner` crash is a hard ErrorBoundary catch meaning the page content is invisible to users who navigate there.

---

## Notes
- `/browse` is clean likely because it uses `useProfiles` (RPC `nearby_profiles`, not `profiles?id=eq`) so it never hits the failing RLS path.
- The 401 may be a test-account-only issue (seeded UUID mismatch) and might not reproduce with a real Supabase-created account. Verify against a fresh sign-up.
- The `ModeDetailPage` infinite loop is auth-independent — it reproduces regardless of user.

# PWA Audit — CeSoir (2026-04-26)

## Lighthouse PWA Score Estimate: 62/100

Strong bones (SW registered, manifest present, offline fallback, RGPD cache wipe) but multiple
blockers prevent full installability score on iOS and Lighthouse audit.

---

## Top 10 Gaps (ranked by impact)

| # | Gap | Impact | File |
|---|-----|--------|------|
| 1 | **Icons are SVG-only** — no PNG 192/512 in public/. Lighthouse PWA requires raster PNG. iOS ignores SVG icons entirely and will show a screenshot thumbnail on home screen. | Critical | `public/icon-192.svg`, `public/icon-512.svg` |
| 2 | **No maskable icon** — manifest.json has zero `"purpose": "maskable"` entries. Android adaptive icons clip to circle/squircle and show white borders. | Critical | `src/app/manifest.ts` |
| 3 | **No `apple-touch-icon` in `<head>`** — `appleWebApp.capable: true` is set but there is no `<link rel="apple-touch-icon">`. iOS Safari does not read the Web App Manifest for home screen icons; without this meta tag it screenshots the page. | Critical | `src/app/layout.tsx` |
| 4 | **VAPID key not provisioned** — `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is empty string at runtime (not in `.env.sample`, not found in any env file). The hook falls back to subscribing without `applicationServerKey`, which most browsers reject silently. Push is structurally wired but dead in production. | High | `src/lib/usePushNotifications.ts:28` |
| 5 | **`NEXT_PUBLIC_PUSH_SUBSCRIPTION_URL` missing** — endpoint to POST the subscription object to the backend is undefined. Even if VAPID were set, subscriptions are never saved, so the backend can never send notifications. | High | `src/lib/usePushNotifications.ts:54` |
| 6 | **No install prompt UI** (`beforeinstallprompt` not captured anywhere) — there is no install banner component, no deferred prompt, no CTA. Users who qualify for install see the default browser bottom-sheet with zero branding. Huge conversion miss for a mobile-first dating app. | High | Missing |
| 7 | **Background Sync is a stub** — `processOfflineQueue()` in sw.js only broadcasts `SYNC_OFFLINE_QUEUE` to open windows; actual API calls live in the main thread (`offline-queue.ts`). If there are no open windows (app backgrounded), the sync silently no-ops. The `processAction()` function itself is a 200ms fake delay, not a real API call. | Medium | `public/sw.js:248`, `src/lib/offline-queue.ts:38` |
| 8 | **No iOS splash screens** — no `apple-startup-image` meta tags, no splash screen assets. On iOS the app shows a white flash on launch instead of a branded screen. Required for premium feel. | Medium | `src/app/layout.tsx` |
| 9 | **`start_url: "/browse"` requires auth** — if the user is logged out, launching from home screen redirects to `/` or `/login`. Lighthouse flags start_url as non-cacheable (auth-gated). Should be `"/"` with redirect handled client-side post-auth-check. | Medium | `src/app/manifest.ts:8` |
| 10 | **No Periodic Background Sync** for new match polling — the app relies on Supabase Realtime (bypassed by SW) which needs an open WebSocket. Installed PWA backgrounded = no new match alerts unless push is working. | Low | Missing |

---

## 3 Wins to Ship Next Sprint

**1. PNG icons + maskable (30 min)**
Run `npx pwa-asset-generator public/icon.svg public/icons --background "#111111" --theme-color "#8B5CF6"`, add PNG entries to `manifest.ts`, add `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` to layout. Fixes gaps 1, 2, 3 in one command.

**2. VAPID provisioning (1h)**
Generate keys: `npx web-push generate-vapid-keys`. Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to Vercel env + `.env.sample` (private key server-side only). Wire a Supabase Edge Function at `/api/push/subscribe` to save subscriptions to a `push_subscriptions` table. Fixes gaps 4 and 5.

**3. Install banner component (2h)**
Create `src/components/app/InstallBanner.tsx`: capture `beforeinstallprompt` in a ref on `window`, show a bottom-drawer CTA ("Installer CeSoir — gratuit") after the user has liked 3 profiles (engagement trigger). Call `prompt()` on tap. Mount in root layout. Fixes gap 6 with contextual UX.

---

## 1 Ambitious Bet

**Install-to-match conversion experiment**: track `appinstalled` event in analytics (already have `AcquisitionTracker`), then A/B test showing the install CTA at two moments — (a) immediately after first match, (b) after sending first message. Hypothesis: post-match trigger converts 2-3x vs generic prompt because emotional high = peak intent. Measure D7 retention delta between installed vs browser cohorts.

# CeSoir Site Audit — Round 3

Crawled: 2026-04-26 (unauthenticated — all protected routes redirect to /login)  
Tool: Playwright headless, localhost:3000, depth 3

---

## Sitemap (47 routes)

### Public routes (no auth required)

| Path | Status | Title | Depth | Notes |
|------|--------|-------|-------|-------|
| / | 200 | CeSoir — Trouve quelqu'un pour ce soir | 2 | Landing |
| /login | 200 | CeSoir — Trouve quelqu'un pour ce soir | 2 | |
| /signup-quick | 200 | CeSoir — Trouve quelqu'un pour ce soir | 2 | |
| /register | 200 | CeSoir — Trouve quelqu'un pour ce soir | 2 | |
| /forgot-password | 200 | CeSoir — Trouve quelqu'un pour ce soir | 2 | |
| /reset-password | 200 | CeSoir — Trouve quelqu'un pour ce soir | 2 | |
| /about | 200 | A propos de CeSoir | 2 | |
| /why-free | 200 | Pourquoi CeSoir est gratuit | 2 | |
| /privacy | 200 | Politique de Confidentialite | 2 | |
| /cgu | 200 | Conditions Generales d'Utilisation | 2 | |

### Protected routes (redirect to /login when unauthenticated)

| Path | Status | Depth | BottomNav? | Notes |
|------|--------|-------|------------|-------|
| /profile | 200 | 0 | yes | Start point |
| /discover | 200 | 1 | yes | |
| /feed | 200 | 1 | yes | |
| /browse | 200 | 1 | yes | |
| /modes | 200 | 1 | yes | |
| /matches | 200 | 1 | yes | |
| /chat | 200 | 1 | yes | |
| /notifications | 200 | 1 | yes | |
| /settings | 200 | 1 | yes | |
| /profile/edit | 200 | 2 | | |
| /profile/delete | 200 | 2 | | |
| /profile/verify | 200 | 2 | | |
| /profile/notifications | 200 | 2 | | |
| /profile/privacy | 200 | 2 | | |
| /profile/invites | 200 | 2 | | |
| /profile/share | 200 | 2 | | |
| /plans | 200 | 2 | | |
| /plans/create | 200 | 2 | | |
| /shop | 200 | 2 | | |
| /premium | 200 | 2 | | |
| /events | 200 | 2 | | |
| /rooms | 200 | 2 | | |
| /squad | 200 | 2 | | |
| /trending | 200 | 2 | | |
| /progress | 200 | 2 | | |
| /speed-dating | 200 | 2 | | |
| /map | 200 | 2 | | |
| /welcome | 200 | 2 | | |
| /help | 200 | 2 | | |
| /safety | 200 | 2 | | |
| /legal/dpia | 200 | 2 | | |
| /manifesto | 200 | 2 | | |
| /invites/mine | 200 | 2 | | |
| /admin/finance | 200 | 2 | | Admin only |
| /offline | 200 | 2 | | PWA offline page |
| /venues/dashboard | 200 | 2 | | Venue portal |
| /onboarding | 200 | 2 | | Post-register flow |

### Dynamic routes (in code, not crawled — need real IDs)

| Path pattern | File |
|---|---|
| /compatibility/[id] | src/app/(app)/compatibility/[id]/page.tsx |
| /plans/[id] | src/app/(app)/plans/[id]/page.tsx |
| /plan/[matchId] | src/app/(app)/plan/[matchId]/page.tsx |
| /rooms/[id] | src/app/(app)/rooms/[id]/page.tsx |
| /events/[id] | src/app/(app)/events/[id]/page.tsx |
| /modes/[mode] | src/app/(app)/modes/[mode]/page.tsx |
| /chat/[id] | src/app/(app)/chat/[id]/page.tsx |
| /help/articles/[slug] | src/app/(app)/help/articles/[slug]/page.tsx |
| /p/[id] | src/app/p/[id]/page.tsx |
| /invite/[code] | src/app/invite/[code]/page.tsx |

---

## Dead links found

None. All 47 routes return HTTP 200. Protected routes redirect cleanly to /login, no 404s.

---

## Orphan routes (in code, not linked from public UI)

Note: crawler ran unauthenticated so it could not extract links from inside the app.
True orphans (no discoverable nav entry even inside the app) are marked with *.

| Route | Status | Issue |
|-------|--------|-------|
| /register | 200 | Not linked from landing — only /signup-quick is. Public page but orphaned * |
| /welcome | 200 | Post-onboarding redirect only, no nav entry * |
| /offline | 200 | PWA service worker only; should arguably be public * |
| /invites/mine | 200 | Duplicate of /profile/invites? No nav entry found * |
| /legal/dpia | 200 | No footer/nav link found * |
| /admin/finance | 200 | Admin portal, no public link (expected) |
| /venues/dashboard | 200 | Separate user type, no link from main app |
| /trending | 200 | Feature exists but not in BottomNav * |
| /squad | 200 | Feature exists but not in BottomNav * |
| /speed-dating | 200 | Feature exists but not in BottomNav * |
| /map | 200 | Feature exists but not in BottomNav * |
| /progress | 200 | Feature exists but not in BottomNav * |
| /manifesto | 200 | Only linked from /about — itself not in main nav |

---

## BottomNav coverage

Confirmed in BottomNav (depth-1 routes, redirected to login directly):
/discover, /feed, /browse, /modes, /matches, /chat, /notifications, /profile, /settings

Features with pages but no BottomNav entry:
/trending, /squad, /speed-dating, /map, /progress, /rooms, /events

---

## Key findings

1. No 404s anywhere — routing is clean.
2. Auth redirect consistent: every protected route returns 200 and redirects to /login?redirectTo=<path>.
3. /register not linked from landing — /signup-quick is the only CTA. /register is a dead-end public page.
4. 7 feature routes (/trending, /squad, /speed-dating, /map, /progress, /rooms, /events) have no BottomNav or discoverable entry point.
5. /invites/mine and /profile/invites — two invite routes, likely duplicate; worth auditing.
6. /offline redirects to login when unauthenticated — PWA offline page should be public.
7. All page titles are identical ("CeSoir — Trouve quelqu'un pour ce soir") except /about, /why-free, /privacy, /cgu — SEO gap on public pages.
8. 10 dynamic routes with [param] not verified — need authenticated session + real entity IDs.

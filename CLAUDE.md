# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: Next.js version

This project uses **Next.js 16.2.3** with **React 19.2.4**. APIs, conventions, and file structure differ from older releases. Before writing any Next.js-specific code (route handlers, `cookies()`, metadata, middleware, fonts, etc.), read the relevant guide in `node_modules/next/dist/docs/` and respect deprecation notices. Do not rely on training-data memory for Next.js behavior.

## Commands

```bash
npm run dev           # next dev
npm run build         # next build
npm run start         # next start
npm run lint          # eslint (flat config: eslint.config.mjs)

npm run db:check      # verify NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY in .env.local
npm run db:types      # regenerate src/lib/supabase-types.ts from project ycyxmvzilzkusecpgvbi
npm run db:start      # supabase start (local stack)
npm run db:stop
npm run db:reset      # supabase db reset — applies supabase/migrations/*
npm run db:push       # supabase db push
```

No test runner is configured. Don't invent `npm test`.

TypeScript path alias: `@/*` → `./src/*`.

## Architecture

### App Router layout with route groups

`src/app/` splits into two route groups with different providers:

- **`(app)/`** — authenticated shell. `layout.tsx` wraps children in `AuthProvider` → `DarkModeProvider` → `AccessibilityProvider` → `ToastProvider`, plus `OfflineBanner`, `BottomNav`, `FABMenu`, `SOSButton`, `ErrorBoundary`, and `PageTransition`. Any new authenticated page goes here and inherits all of that.
- **`(auth)/`** — login / register / onboarding / forgot-password / reset-password. Separate layout, no nav chrome.
- `src/app/page.tsx` is the public landing page (no group).
- `src/app/api/` holds route handlers (`account/delete`, `auth/login`, `auth/logout`, `recommendations`, `swipe`).

Route-group parentheses do not affect URLs — `(app)/browse/page.tsx` is served at `/browse`.

### Auth: three layers that must stay consistent

1. **`src/middleware.ts`** — runs on every non-static request. Uses `@supabase/ssr` `createServerClient` to refresh the session cookie and redirects: protected prefixes (`/browse`, `/map`, `/chat`, `/modes`, `/profile`, `/app`) require a user; auth routes (`/login`, `/register`) redirect to `/browse` when already signed in. If env vars are missing it silently no-ops so builds don't crash.
2. **`src/lib/supabase/{client,server,helpers}.ts`** — the *canonical* SSR clients. Use `createClient()` from `server.ts` in Server Components / route handlers, and `createClient()` from `client.ts` in Client Components that need SSR-aware cookies. `helpers.ts` exposes `getUser()`, `getProfile(id)`, `getCurrentProfile()` for server code.
3. **`src/context/AuthContext.tsx`** (`"use client"`) — provides `useAuth()` with `user`, `signIn`, `signUp`, `signOut`. Mounted once by `(app)/layout.tsx`. It uses the legacy `src/lib/supabase.ts` singleton (a lazy `Proxy` around `createClient` from `@supabase/supabase-js`) for realtime auth state + cross-tab sync. Also refreshes the session every 50 minutes and uses `navigator.sendBeacon` on `beforeunload` to mark the profile offline.

`src/lib/useAuth.ts` is a deprecated shim that re-exports `useAuth` from the context — prefer `@/context/AuthContext` directly.

Profiles are auto-created by a Supabase DB trigger (`handle_new_user`, `SECURITY DEFINER`) on `auth.users` INSERT; do not insert into `profiles` manually after signup.

### API routes: Bearer-token pattern

`src/app/api/recommendations/route.ts` and `src/app/api/swipe/route.ts` do *not* use the SSR cookie flow. They expect `Authorization: Bearer <access_token>`, instantiate a per-request `createClient(URL, ANON_KEY, { global: { headers: { Authorization } } })`, and call `db.auth.getUser()` to authenticate. Follow this pattern for any new client-called API route that needs the user's RLS context. In contrast, `api/auth/login/route.ts` and `api/auth/logout/route.ts` use the SSR `createClient` from `@/lib/supabase/server` to set/clear cookies.

### Matching pipeline

`src/lib/matching.ts` → `findMatches(userId, lat, lng, opts)` is the core scoring function exposed via `GET /api/recommendations`. Score is 0–100: **mode compatibility 40 / distance 25 / timing 20 / social proof 15**. The 14 supported modes live in `src/lib/modes.ts` as `MODES` / `ModeKey` and are the source of truth — DB `mode_activations.mode` and `interactions.mode` must match these keys.

`POST /api/swipe` enforces a 100-swipe daily limit (resets at midnight UTC), records to `interactions`, and on mutual like/superlike upserts a `conversations` row with deterministic `(user_a, user_b)` ordering to avoid duplicates.

Shared request/response types for these routes live in `src/types/matching.ts` — import them on both sides.

### Database

- Main schema: `supabase-schema.sql` (PostGIS-enabled). Migrations: `supabase/migrations/*.sql`.
- Generated types: `src/lib/supabase-types.ts` — regenerate with `npm run db:types` after schema changes.
- `src/lib/supabase.ts` re-exports `Database` plus `Db*` row types (e.g. `DbProfile`, `DbInteraction`, `DbConversation`). Import table row types from `@/lib/supabase` rather than reaching into `supabase-types` directly.
- `profiles.location` is a PostGIS `GEOGRAPHY(POINT, 4326)`.

### Client-side domain logic

Most feature state lives in `src/lib/use*.ts` hooks (swipe, chat, conversations, matches, notifications, badges, gamification, geolocation, safety, etc.). They call through the legacy `supabase` singleton from `@/lib/supabase`. Components under `src/components/{app,chat,landing,map,ui}/` consume these hooks — business logic belongs in the hook, not in the component.

`src/lib/motion-design.ts` is the shared Motion (Framer) tokens file (springs, easings, ambient animations). Reuse its exports rather than hand-rolling transitions.

### i18n

`src/lib/i18n.ts` is a zero-dependency translation layer, default locale `fr`, also supports `en`. The whole UI is French-first (see user-facing strings like `"Non authentifie"` in API routes).

### PWA

`public/manifest.json` + `public/sw.js` + `src/lib/registerSW.ts` + `src/lib/offline-queue.ts` provide offline support. `OfflineBanner` in `(app)/layout.tsx` surfaces connectivity.

### Security headers

`next.config.ts` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` allowing only self geolocation + camera. Also allow-lists image remote patterns for `api.dicebear.com`, the Supabase project bucket, and `randomuser.me` — add new image hosts there.

## Conventions

- Components that use hooks, browser APIs, or motion must start with `"use client"`. Everything under `src/app/(app)/` and `src/app/(auth)/` is a client-leaning feature area, but page files should stay server components when possible and delegate to client children.
- API routes return French error messages (e.g. `"Non authentifie"`, `"Session invalide"`) — match the existing tone.
- Don't commit `.env.local`; `db:check` validates it before dev work.

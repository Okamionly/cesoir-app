# CeSoir — Vulnerability Scan (Round 3)

Date: 2026-04-26 | Scope: dependencies + outdated majors + bundle | Tool: `npm audit`, `npm outdated`

## CVEs (5 total)
- CRITICAL: 0 | HIGH: 0 | MODERATE: 5 | LOW: 0

All 5 stem from **one root CVE** (PostCSS) — fanout: postcss → next → @sentry/nextjs / @storybook/nextjs-vite / vite-plugin-storybook-nextjs.

## Top 5 to fix immediately
1. **postcss <8.5.10** — GHSA-qx2v-qp2m-jg93 — moderate (CVSS 6.1) — XSS via unescaped `</style>` in stringify. **Fix**: `npm i postcss@^8.5.10` as override (Next 16.2.4 still pins old). Impact = build-time only, no runtime exposure unless user-supplied CSS is rendered.
2. **next 16.2.3 → 16.2.4** — patch bump fixes the postcss transitive — `npm i next@16.2.4 eslint-config-next@16.2.4`.
3. **@sentry/nextjs 10.49.0 → 10.50.0** — minor bump, clears advisory once next bumped.
4. **@storybook/nextjs-vite** — `fixAvailable: false` upstream — accept-the-risk: storybook is dev-only, never shipped to prod. Add to allowlist in CI.
5. **vite-plugin-storybook-nextjs** — same as #4, dev-only chain. No prod risk.

## Outdated majors (worth upgrading)
- **next 16.2.3 → 16.2.4** — patch only, fixes postcss CVE.
- **react / react-dom 19.2.4 → 19.2.5** — patch, no breaking.
- **@supabase/supabase-js 2.103.0 → 2.104.1** — minor, safe.
- **@stripe/stripe-js 9.2.0 → 9.3.1** — minor, safe.
- **stripe 22.0.2 → 22.1.0** — minor, safe.
- **@types/node 20 → 25** — major, but Node 20 LTS is fine; defer until Node 22 LTS migration.
- **typescript 5.9.3 → 6.0.3** — major. TS 6 removes some legacy decorators behavior + tightens narrowing. Defer 1–2 weeks, test on branch first.
- **eslint 9.39.4 → 10.2.1** — major. Flat config required (already used). Low risk, schedule for next sprint.
- **lucide-react 1.8.0 → 1.11.0** — minor, but 37 MB installed (see bundle).
- **motion 12.38.0** — current latest, no upgrade.
- **@sentry/nextjs 10.49 → 10.50** — minor.
- **vite 8.0.8 → 8.0.10**, **vitest 4.1.4 → 4.1.5**, **maplibre-gl 5.23 → 5.24**, **posthog-js 1.371 → 1.372**, **tailwindcss 4.2.2 → 4.2.4** — all patch, safe to bump in one PR.

## Unmaintained risk
None of the critical deps (next, react, supabase, stripe, sentry, motion, tailwind) are stale — all published within the last 60 days. **@vladmandic/face-api 1.7.15** is a fork (original face-api.js abandoned 2020) — fork is actively maintained, OK.

## Bundle bloat candidates
- **@tensorflow/tfjs — 274 MB installed** — by far the heaviest. Used by nsfwjs. **Action**: ensure it's lazy-loaded client-side only via `next/dynamic` with `ssr:false`, never imported in shared bundles. Consider `@tensorflow/tfjs-core` + only the ops nsfwjs needs (saves ~150 MB on disk, ~2 MB on wire). Alternative: server-side moderation via Cloudflare AI / Replicate API — removes the entire dep.
- **maplibre-gl — 45 MB** — keep, no smaller alternative for vector tiles. Ensure dynamic import on map routes only.
- **nsfwjs — 41 MB** — only needed at upload time. Lazy-load on the upload component, not in `_app`.
- **lucide-react — 37 MB** — tree-shakes correctly when using named imports (`import { Heart } from 'lucide-react'`). Verify no `import * as Icons` anywhere.
- **@vladmandic/face-api — 24 MB** — same lazy-load rule as nsfwjs.
- **@sentry/nextjs** — heavy runtime. Confirm `tunnelRoute` + tree-shaking enabled; consider sampling rate < 0.1 in prod.

No `lodash` / `moment` / `axios` bloat detected — stack is modern.

## Recommended action plan
1. **Today**: `npm i next@16.2.4 eslint-config-next@16.2.4 @sentry/nextjs@10.50.0 react@19.2.5 react-dom@19.2.5` + add `"overrides": { "postcss": "^8.5.10" }` in package.json. Re-run `npm audit` → expect 0 prod vulns (storybook moderates remain, dev-only, accepted).
2. **This week**: bump all patch versions (one PR), verify Storybook + Vitest still build.
3. **Next sprint**: TS 6 + ESLint 10 majors on a branch with full test run.
4. **Backlog**: evaluate moving NSFW + face moderation server-side to drop ~340 MB of ML deps from the client install.

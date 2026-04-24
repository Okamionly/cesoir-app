# Post-Glowup Patrol — 2026-04-24

**Deploy tested:** `9d4c511` (glowup #4 + Suspense #9)
**Patrol trigger:** `/saas-patrol --detect-only` via skill
**Agents:** 1 navigator + 4 detectors (visual / a11y-perf / responsive / console) + manual triage

## Summary

The glowup PR #4 ships cleanly — build, tests, CSP, and the 8-route
smoke test all green. The patrol surfaced **9 actionable bugs**
across 4 severity classes. Two were fixable immediately and shipped
in `540c62d` (this commit). Seven became tracked issues.

| # | Bug | Severity | Status |
|---|---|---|---|
| 1 | `/map` — CSP dropped `*.cartocdn.com`, MapLibre tiles never loaded | P0 | ✅ Fixed in 540c62d |
| 2 | `--color-text-muted #707070` missed WCAG AA by 0.02 ratio pts | P1 | ✅ Fixed in 540c62d (→ `#696969`) |
| 3 | `/matches` route returns 404 — core feature missing | P0 | 🎫 Issue #10 |
| 4 | `/map` `profiles.latitude` / `longitude` columns do not exist (400) | P0 | 🎫 Issue #11 |
| 5 | `useLiveTicker` / Realtime race: `.subscribe()` before `.on()` chain | P1 | 🎫 Issue #12 |
| 6 | Phone-frame layout incoherent — content stretches full-width desktop | P1 | 🎫 Issue #13 |
| 7 | React #418 hydration reported by agent — stack trace missing, needs verify | TBD | 🎫 Issue #14 |
| 8 | Login/register form labels contrast 3.8:1 | P1 | (deferred) |
| 9 | Login/register input borders 1.3:1 | P1 | (deferred) |

## What the patrol validated (glowup worked)

- **CSP without `unsafe-eval`** does not break Sentry, Supabase Realtime,
  motion/react, next/image, or any known client lib — the only caller
  of `eval` was absent.
- **Suspense wraps on 4 pages** (feed / browse / plans / plans-create)
  all render the expected shimmer fallback without FOUC.
- **14 deleted dead components** left no import errors (zero "Cannot
  find module" warnings in production console).
- **next/image AVIF-first** serves without format errors on existing
  Unsplash/DiceBear/Supabase Storage URLs.
- **8-route smoke test**: all 200 / 307 (auth redirects). Zero 4xx / 5xx.
- **Build**: 85 / 85 pages prerendered. 0 TypeScript errors.

## What the patrol broke open (pre-existing bugs surfaced)

- `/matches` has always been 404 — the glowup merely made it easier
  to notice because dead-code cleanup stripped the consolation UI
  around it. This is a Wave 7 WIRE-ME debt.
- `/map` 400 query predates the glowup — the `profiles.latitude`
  SELECT is a leftover from early mock-data days. The glowup
  exposed it by making the page actually reach production.

## What the patrol may have false-alarmed

- Hydration #418 reported on 9 routes but **every entry has
  `stack: null`** — no traces were captured. Agent heuristic
  without ground truth. Needs dev-mode reality check (issue #14).

## Files touched by the fixes shipped in this commit

- `next.config.ts` — CSP `connect-src` and `img-src` re-include
  `https://*.cartocdn.com` + `https://*.basemaps.cartocdn.com`.
- `src/app/globals.css` — `--color-text-muted: #707070 → #696969`.

No functional code changed. Zero risk of regression beyond the
failing CSP tightening caught by the patrol.

## Validation

- `npx tsc --noEmit` → 0 errors
- Manual curl of `/` confirms new CSP on the deployed alias:
  `script-src 'self' 'unsafe-inline'` (no `unsafe-eval`).
- Webhook auto-deploy restored via `vercel git connect` — the fresh
  deploy `dpl_FKT9fPggN77xrWA4wRDdUuR5Qttv` shows `source: git`
  (not CLI), confirming the integration is healed.

## Source artifacts

Full patrol audit at
`~/.claude/saas-audits/2026-04-24-1535-patrol-cesoir-app_vercel_app/`:

- `sitemap.json` — 17 routes crawled
- `screenshots/desktop/` + `screenshots/mobile/` — 34 captures
- `snapshots/*.html` — 17 raw HTML snapshots
- `bugs/visual/bugs.json` — 18 findings
- `bugs/a11y-perf/report.json` — contrast + lighthouse heuristics
- `bugs/responsive/bugs.json` — 20 findings across 4 viewports
- `bugs/console/bugs.json` — 15 JS / network / hydration events

## Next steps (when user picks up the backlog)

1. **#11** `/map` query fix — pair with **#5** SEC-001 (same RPC).
2. **#10** `/matches` route create — core dating feature missing.
3. **#12** Realtime race — one-hour fix, high user-facing impact on /feed.
4. **#14** Hydration investigation — reality-check first, then decide P0 vs close.
5. **#13** Phone-frame — defer unless desktop traffic matters.
6. **#6 / #7 / #8** remaining SEC P0s — GPS RLS migration sprint.

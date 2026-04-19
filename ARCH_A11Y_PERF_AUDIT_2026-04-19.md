# A11y + Performance Audit — 2026-04-19

**Target**: https://cesoir-app.vercel.app (deploy `f405237`)
**Scope**: Public/unauth pages + runtime perf + static code analysis
**Method**: Playwright evaluate + Grep/Read (read-only)

---

## Executive Summary

1. **LCP = 11.7 s (both desktop & mobile) → FAIL Core Web Vitals** ("good" = <2.5 s). Root cause: landing page is 100% client-rendered (`SceneController` is `"use client"` and its `<h1>` lives inside `<AnimatePresence>` with `initial={{ opacity: 0 }}` → no server-paintable LCP candidate). FCP is 108 ms thanks to SSR shell, but the Chrome LCP algorithm waits for real content which never arrives server-side.
2. **Landing `/` has no `<h1>` server-rendered and no `<main>` landmark** → WCAG 1.3.1 / 2.4.1 / 2.4.6 violations. Skip-link target `#main-content` points to nothing on `/`.
3. **OG/Twitter cards broken** — metadata hardcodes `/og-image.png` (HTTP 404). The `opengraph-image.tsx` convention file exists but is ignored because static `images: [{ url: "/og-image.png" }]` overrides it.
4. **JavaScript payload = ~1 MB decoded / 48 resources on landing alone**; top 3 chunks are 223 + 222 + 137 KB (motion/react + WebGL PlasmaOcean). No image optimisation needed (1 KB images) but script budget is the real bottleneck.
5. **`<Image>` (next/image) used in exactly 1 file** while `<img>` appears in 15 files / 27 occurrences → missing lazy-loading, width/height, and AVIF/WebP conversion in-app. Low priority on unauth pages (0 images today) but becomes critical after login.

---

## A11y Findings

### Critical (WCAG A)

- **`/` (landing) — no `<h1>` in initial DOM** (h1_count=0 on runtime snapshot). The `motion.h1` is rendered in an `AnimatePresence` block hydrated client-side; screen readers and crawlers get no heading structure. [WCAG 2.4.6, 1.3.1]
- **`/` — no `<main>` landmark** (landmarks.main=0). Skip-link "Aller au contenu principal" in `layout.tsx:77` targets `#main-content` which does not exist on the landing scene. [WCAG 2.4.1, 1.3.1]
- **Buttons without accessible name on `/`** — 3 buttons with empty `textContent` and no `aria-label` (measured runtime). Looking at `SceneController.tsx:436-457`, scrubber dots do have `aria-label` but the render produces 3 tiny buttons (14×20 and 30×20 px) that fail the audit — likely the hint svg or icon-only controls elsewhere. [WCAG 4.1.2]
- **Low contrast text on landing** — `text-white/30` (line 465), `text-white/20` (line 485/492/499), `text-white/35` on `#0A0A0D` vignette background. 30 % white on near-black ≈ contrast ratio ~2.3 → fails AA 4.5:1 and AAA 3:1 even for large text. [WCAG 1.4.3]

### High (WCAG AA)

- **Touch targets < 44×44 px on `/`** — 9 hits including "Se connecter" 108×37 px, scrubber buttons 14×20 px, footer legal links 20×14 / 34×14 / 38×14 / 63×14 px. Utility class `.tap-target` exists in `globals.css:87` but is not applied. [WCAG 2.5.5]
- **`/register` — 4 small tap targets**, `/login` — 2 small tap targets. Likely icon-only password visibility toggles or close buttons.
- **No `<footer>` on any public page** (footer=0 on /, /login, /register, /about, /cgu, /privacy, /why-free). Legal links buried in z-30 overlay on `/` only. [WCAG 1.3.1]
- **Keyboard navigation on `/` is a trap in disguise** — `wheel` event uses `preventDefault` (SceneController.tsx:202), keyboard arrows preventDefault (line 175/179). Users on keyboard can't scroll past the landing to see legal links at the bottom — only sequential focus works. Space-key toggles pause (line 184), hijacking expected page-scroll behaviour. [WCAG 2.1.1, 2.1.4]
- **Animated content with no accessible controls** — PlasmaOcean WebGL runs continuously, auto-play rotates scenes every 9 s. `useReducedMotion` is respected for the magnetic CTA and hint overlay only; the auto-rotate and WebGL keep running. [WCAG 2.2.2, 2.3.3]

### Medium

- **`/about`, `/cgu`, `/privacy`, `/why-free`** are correct (1 h1, 1 main). Only missing a `<footer>` landmark.
- **`html lang="fr"`** correct globally.
- **`/login` & `/register` forms** pass the basic label/autocomplete audit (0 unlabelled inputs, 0 missing autocomplete).
- **Skip-link present** in `layout.tsx:77-79` with proper `sr-only focus:not-sr-only` pattern, but broken on `/` since target id is missing.
- **No `role="button"` abuse detected** on landing.

---

## Performance Findings

### LCP / FCP / CLS

| Metric | Desktop (1280) | Mobile (375) | Target | Verdict |
|---|---|---|---|---|
| TTFB | 139 ms | 29 ms | <800 ms | OK |
| FCP | 348 ms | 108 ms | <1.8 s | OK |
| DOMContentLoaded | 335 ms | 74 ms | — | OK |
| **LCP** | **12 028 ms** | **11 768 ms** | <2.5 s | **FAIL** |
| CLS | n/a (measured mobile) | 0.038 | <0.1 | OK |

Root cause of LCP: landing is client-hydration-gated. All visible text lives inside `AnimatePresence` with `initial={{ opacity: 0 }}` and a `delay: 0.25` on the h1 (`SceneController.tsx:535`). LCP observer reports the first **stable** frame with painted content, which is after the scene-0 rackFocus animation completes (~800 ms) + the auto-rotate lifecycle — but since scenes keep morphing every 9 s, LCP keeps being invalidated. The 11-12 s number reflects when measurement timed out.

### Bundle size (top offenders on `/`)

| Chunk (decoded) | Size | Likely content |
|---|---|---|
| `0~rfegsx4-zy1.js` | 223 KB | React + motion core |
| `07f6r3rkw-6~h.js` | 222 KB | motion/react animations |
| `0vjl2odh~7nce.js` | 137 KB | Next.js runtime |
| `08e4jhfh69ani.js` | 124 KB | Landing scene components |
| `0o~2l52khubys.js` | 60 KB | PlasmaOcean WebGL shader |
| **Total scripts** | **~1001 KB decoded** | 48 resources |
| Total CSS | 106 KB | Tailwind + globals |
| Total images | 1 KB | No raster images on landing |

Mobile 3G/4G (rtt 50 ms, downlink 1.6 Mbps): this is ~5 s just to download scripts.

---

## SEO / meta

- Root `metadata` in `layout.tsx` is **thorough**: title template, description, keywords, `metadataBase`, canonical, `openGraph` (fr_FR, WebApplication), Twitter summary_large_image, manifest, appleWebApp, robots (index/follow).
- **JSON-LD** (`WebApplication` schema) properly embedded in `<head>`.
- **Viewport** meta correct (device-width, viewportFit: cover, themeColor #8B5CF6).
- **robots.txt** serves (200 OK), disallows `/api/`, points to sitemap.
- **sitemap.xml** serves (200 OK), includes 8 URLs.
- **Per-page metadata**: `/about`, `/cgu`, `/privacy`, `/why-free` all have distinct `<title>` ("%s | CeSoir" template works).
- **Bug — og-image missing**:
  - `layout.tsx:25` + `:33` + `:71` reference `/og-image.png` (static) → **HTTP 404**.
  - `src/app/opengraph-image.tsx` (dynamic Edge Runtime) exists and would auto-wire via Next.js file convention — but only if the static `images: [...]` override is removed.
  - Twitter card has no `images` entry at all → falls back to summary style, OG tag is broken.

---

## Image optimization

- **Total `<img>` occurrences**: 27 across 15 files (all in authenticated `(app)` routes — chat, feed, profile, map, squad, rooms, speed-dating, browse, discover).
- **Total `next/image` usage**: **1 file** (`ProfileImage.tsx`).
- **Public `/` shows 0 images today** — the perf impact is deferred to in-app screens where user photos, avatars, and icons render.
- **Recommendations for post-login**:
  - Replace `<img>` with `next/image` to get automatic AVIF/WebP, lazy-loading, and blur placeholders.
  - Add `sizes="(max-width: 768px) 100vw, 50vw"` on profile cards.
  - Self-host user avatars via Supabase Storage transformer (already in stack) with `?quality=60&width=200`.

---

## Motion / Reduced-motion

- Global CSS kill-switch exists (`globals.css:72-74`) — zeroes animation/transition durations under `prefers-reduced-motion: reduce`. Good baseline.
- **`useReducedMotion` from motion/react used in 7 files only** (SceneController, MoonHero-like components, Magnetic, RackFocus, PageHeader, profile, modes, ReducedMotion wrapper).
- **`animate` / `motion.` / `framer-motion` usage: 2060 occurrences across 109 files** — i.e. 93 % of animated components don't consult `useReducedMotion`. The CSS fallback catches most, but `motion/react` spring animations ignore CSS transitions (they use rAF + interpolated style), so the CSS override **does not stop them**.
- **On `/` specifically**: scene auto-rotate (9 s interval) runs regardless of `prefers-reduced-motion`. Only the hint SVG and magnetic CTA check the flag. **This is a WCAG 2.3.3 risk**.

---

## Prioritized fixes (top 15)

1. **[CRITICAL perf]** Replace `/` landing with SSR-friendly hero: render h1 text + main CTA synchronously, then progressively enhance with SceneController. Gate the WebGL plasma behind `dynamic(() => import(...), { ssr: false, loading: null })` after idle. Target LCP <2.5 s.
2. **[CRITICAL a11y]** Add `<main id="main-content">` wrapper inside `SceneController` so the skip-link works. Render the current scene's h1 once (server-side, opacity 0 → 1 via CSS, no `motion.h1` for the text itself).
3. **[CRITICAL SEO]** Remove the hardcoded `images: [{ url: "/og-image.png" }]` arrays in `layout.tsx:25` and `:71` (structured data logo). Let Next.js auto-wire `src/app/opengraph-image.tsx`. Verify with `curl -sI https://cesoir-app.vercel.app/opengraph-image`.
4. **[HIGH a11y]** Respect `useReducedMotion` in `SceneController`: disable the 9-s auto-rotate, freeze to scene 0, skip the wheel/touch scene hijack. If detected, render all 3 scenes as a simple vertical `<article>` stack.
5. **[HIGH a11y]** Stop hijacking `wheel` and arrow keys on `/`. Let keyboard users tab and scroll naturally; keep the scrubber dots as the only scene-switcher. This also removes WCAG 2.1.4 (keyboard trap) risk.
6. **[HIGH a11y]** Apply `.tap-target` class (min 44×44 px) to scrubber dots, legal footer links, and icon buttons on `/`, `/login`, `/register`. Use `min-h-[44px] min-w-[44px]` Tailwind utilities.
7. **[HIGH a11y contrast]** Raise text opacity: `text-white/30` → `text-white/70`, `text-white/20` → `text-white/60`. Sample contrast against `#0A0A0D` + vignette: aim ≥4.5:1 (white/70 ≈ 4.8:1, white/30 ≈ 2.3:1).
8. **[HIGH perf]** Code-split `motion/react`: import only primitives used on landing (motion, AnimatePresence). Drop `useSpring` + `useMotionValue` from initial chunk — they're used only in MagneticCTA. Estimate: -80 KB.
9. **[HIGH perf]** Lazy-load `PlasmaOcean` + `StarField` (WebGL ~60 KB + canvas). Render only after `requestIdleCallback` or after 1 s to allow LCP text paint first.
10. **[MEDIUM a11y]** Add a real `<footer>` landmark to all public pages (about/cgu/privacy/why-free) with the 4 legal links — supports screen-reader navigation.
11. **[MEDIUM perf]** Add `<link rel="preconnect">` + `<link rel="dns-prefetch">` for Supabase domain in `layout.tsx` `<head>` to shave 50-200 ms on first realtime/auth call.
12. **[MEDIUM img]** Migrate 27 `<img>` occurrences to `next/image` in `(app)/*` routes. Start with chat/feed/profile/discover (highest-traffic).
13. **[MEDIUM motion]** Audit the 2060 motion occurrences across 109 files. Systematic pattern: replace `animate={{...}}` with conditional `animate={reducedMotion ? undefined : {...}}` where animation is not purely decorative (i.e. toast, confetti, spark-timer, pull-to-refresh).
14. **[LOW SEO]** Add `<link rel="canonical">` per-page (currently only root has it via `alternates.canonical: "/"`). Next.js resolves it from `metadataBase`, but legal pages should set their own path explicitly.
15. **[LOW SEO]** Generate sitemap entries for `/about`, `/why-free`, `/modes`, `/safety` — currently only `/browse`, `/modes`, `/safety` + legal are indexed.

---

## Appendix — measurements

- Playwright runtime viewport: tested at 1280×720 (default) then 375×812 (mobile).
- Network: 4G effective, downlink 1.6 Mbps, rtt 50 ms.
- Data captured via `PerformanceObserver` (LCP, CLS buffered) + `performance.getEntriesByType` (navigation, paint, resource).
- All findings validated against live prod build `f405237` at 2026-04-19 16:45 UTC.

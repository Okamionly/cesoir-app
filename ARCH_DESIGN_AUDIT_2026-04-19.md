# Design System Architecture Audit — 2026-04-19

Scope: `src/app` + `src/components` (219 files scanned). Tokens source: `src/lib/design-tokens.ts`, `src/app/globals.css` `@theme`.

## Executive Summary

The design system has solid token foundations (dual palette landing/app, Tailwind v4 `@theme` CSS vars) but the codebase bypasses them at massive scale:

- **104 distinct hex colors** in source (expected: 6). 714 raw hex literals across 144 files.
- **487 raw `rgba()`** inline styles, mostly for violet/vert alpha variants that should be tokens.
- **95 Tailwind palette classes** (`text-red-400`, `bg-pink-500`, etc.) — forbidden per W&B theme rule.
- **Spacing scale is polluted**: `py-2.5`, `py-3.5`, `px-3.5`, `py-0.5`, `gap-1.5`, `mt-0.5` all in heavy rotation → 8-step scale stretched to ~14.
- **Typography chaos**: 14 custom `text-[Npx]` pixel sizes in heavy use (top: `text-[11px]` × 262, `text-[10px]` × 258, `text-[13px]` × 219) coexist with Tailwind aliases (`text-sm` × 246, `text-xs` × 140). No canonical scale.
- **Icons**: 283 inline `<svg>` across 101 files. Zero icon library. Guaranteed duplication.
- **Z-index**: 30+ distinct layers (z-10, z-50, z-[9999], z-[800], z-[350]…) → conflicts imminent.
- **Radius is fine**: ~95% of rounding uses `rounded-full`, `rounded-2xl`, `rounded-xl`, `rounded-3xl` — the scale is effectively respected.

Migration priority: **color tokens → typography scale → spacing scale → icon library → z-index layers**.

---

## Color violations

### Hex literals — distinct values: 104 (expected: 6)

| Hex | Count | Token? | Verdict |
|---|---|---|---|
| `#8B5CF6` | 315 | `accent` / `app.violet` | OK — legit but should be `var(--color-accent)` |
| `#00FF88` | 213 | `accent-2` / `app.vert` | OK — should be `var(--color-accent-2)` |
| `#F59E0B` | 90 | — | **VIOLATION** (Tailwind amber-500, no token) |
| `#EF4444` | 88 | `danger` | VIOLATION — use `var(--color-danger)` |
| `#22C55E` | 36 | `safe` | VIOLATION — use `var(--color-safe)` |
| `#EC4899` | 34 | `landing.rose` | LANDING-ONLY — audit which files (app ≠ landing) |
| `#111111` | 27 | `text` | VIOLATION — `var(--color-text)` |
| `#FFFFFF` | 24 | `bg` / `text-inv` | VIOLATION |
| `#3B82F6` | 23 | — | VIOLATION (Tailwind blue-500, no token) |
| `#06B6D4` | 22 | — | VIOLATION (Tailwind cyan-500, no token) |
| `#141414` | 17 | — | VIOLATION (close to `bg-card` #F8F8F8 dark variant) |
| `#6366F1` | 13 | — | VIOLATION (indigo-500) |
| `#F97316` | 12 | — | VIOLATION (orange-500) |
| `#FBBF24` | 11 | — | VIOLATION (amber-400) |
| `#999999` | 11 | close to `text-muted` | VIOLATION |
| `#0A0A0A` | 9 | close to `landing.bg` | VIOLATION (dark mode bg) |
| `#666666` | 8 | `text-soft` | VIOLATION |
| `#4C1D95` | 8 | — | VIOLATION (violet-900) |
| `#10B981` | 7 | — | VIOLATION (emerald-500) |
| `#FF4466` | 6 | — | VIOLATION (non-standard) |
| `#1A1A2E` | 6 | — | VIOLATION |
| `#0A0A0D` | 6 | `landing.bg` | LANDING-ONLY — OK if in landing/ |
| ... 82 more hex values | 1-5 each | — | VIOLATION |

3-digit shorthand hex (`#222`, `#111`, `#FFF`, `#888`, `#666`, `#333`, `#999`…): **96 additional occurrences**.

### Tailwind palette classes (forbidden per W&B rule): 95 total
Top 10 offenders: `text-red-400` (10), `bg-red-500` (7), `from-pink-500` (4), `border-red-500` (4), `bg-amber-500` (4), `text-red-500` (3), `text-pink-400` (3), `from-emerald-500` (3), `from-amber-500` (3), `border-pink-500` (3).

### rgba() inline: 487 total
- Violet alpha (rgba(139,92,246,...)): ~180 — should become `--shadow-glow-sm/md/lg` + `--bg-accent-soft`.
- Vert alpha (rgba(0,255,136,...)): ~60.
- White alpha (glassmorphism): ~55.
- Black alpha (shadows): ~30.
- Semantic (red/green/blue alpha for badges): ~40.

### Top 10 file offenders (most hex literals)
| File | Hex count |
|---|---|
| `app/(app)/safety/page.tsx` | 43 |
| `app/globals.css` | 32 (legit — tokens live here) |
| `components/landing/PhoneVideo.tsx` | 29 |
| `app/(app)/trust/page.tsx` | 23 |
| `components/landing/MoonHero.tsx` | 22 |
| `components/chat/GifPicker.tsx` | 22 |
| `components/app/WheelOfFortune.tsx` | 19 |
| `components/app/ArrivalStatus.tsx` | 16 |
| `components/app/TrustedCircle.tsx` | 15 |
| `app/(app)/premium/page.tsx` | 15 |

---

## Spacing scale

### Padding (top 15)
`px-4` × 183, `py-3` × 157, `px-5` × 136, `px-3` × 113, `py-2` × 83, `p-4` × 81, **`py-2.5` × 74**, **`py-0.5` × 72**, **`py-3.5` × 71**, `px-2` × 71, `px-6` × 65, **`py-1.5` × 59**, `py-1` × 53, **`px-2.5` × 40**, `p-3` × 40, `p-5` × 34, `p-6` × 26, **`p-3.5` × 14**.

### Gap / space
`gap-2` × 267, `gap-3` × 178, **`gap-1.5` × 101**, `gap-1` × 91, `space-y-3` × 55, `gap-4` × 38, `space-y-2` × 33, **`gap-2.5` × 19**, **`gap-0.5` × 17**, `gap-6` × 15, `space-y-4` × 14.

### Margin
`mb-2` × 131, `mb-3` × 127, `mb-4` × 117, `mb-6` × 82, `mt-1` × 81, `mb-1` × 78, `mt-2` × 65, **`mt-0.5` × 57**, `mt-3` × 51, `mb-5` × 42, `mb-8` × 35, `mt-4` × 31, **`mb-1.5` × 22**.

### Analysis
- Scale currently spans: `0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, 24` (15 steps)
- Half-steps (`.5`) account for **~400 occurrences** across padding/gap/margin — this is a scale smell. Using `py-2.5` (10px) instead of `py-2` (8px) or `py-3` (12px) suggests designers are eyeballing pixels instead of snapping to a rhythm.
- **Violations**: `py-3.5` (14px), `px-3.5`, `gap-0.5` (2px), `mt-0.5`, `mb-1.5` — most should collapse to the nearest 4px step.

### Proposed rational scale (Apple HIG / Material-style 4px rhythm)
```
0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96
(Tailwind: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24)
```
Eliminate `.5` steps entirely. Migrate `py-2.5` → `py-2` or `py-3`, `py-0.5` → `py-1` or `py-0`.

---

## Typography scale

### Sizes used (top 15)
`text-[11px]` × 262, `text-[10px]` × 258, **`text-sm`** × 246 (=14px), `text-[13px]` × 219, `text-[12px]` × 170, `text-[14px]` × 167, **`text-xs`** × 140 (=12px), `text-[15px]` × 70, `text-lg` × 68, `text-[9px]` × 66, `text-2xl` × 44, `text-base` × 43, `text-xl` × 39, `text-[16px]` × 38, `text-[18px]` × 37.

### Observations
- **Two parallel systems** for the same sizes: `text-xs` (140×) AND `text-[12px]` (170×) are identical. Same for `text-sm` vs `text-[14px]`, `text-base` vs `text-[16px]`, `text-lg` vs `text-[18px]`.
- **14 distinct custom pixel sizes** used: 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 36, 40, 48 px.
- `text-[#8B5CF6]` × 20, `text-[#00FF88]` × 16 — hex inside size shortcut, doubly broken.

### Font weights (distribution is suspicious)
`font-bold` × 484, `font-semibold` × 445, `font-medium` × 199, `font-black` × 100, `font-light` × 8, `font-normal` × 4.

- **98% of text is bold/semibold/medium/black** — there's no "body" weight. Either `font-normal` is the browser default (implicit) or the design genuinely skews heavy. If it's the former, add explicit `font-normal` to body utilities to avoid drift.

### Line heights
`leading-relaxed` × 59, `leading-tight` × 22, `leading-none` × 12, `leading-snug` × 8, custom `leading-[0.95/1/1.05]` × 4. OK — scale is clean.

### Proposed typography scale
```ts
// design-tokens.ts (add)
typography: {
  micro:    { size: 10, lineHeight: 14, weight: 500 },  // captions, overlines
  caption:  { size: 12, lineHeight: 16, weight: 500 },  // replaces text-xs + text-[11px] + text-[12px]
  body:     { size: 14, lineHeight: 20, weight: 400 },  // replaces text-sm + text-[13px] + text-[14px]
  bodyLg:   { size: 16, lineHeight: 24, weight: 400 },  // replaces text-base + text-[15px] + text-[16px]
  title:    { size: 18, lineHeight: 24, weight: 600 },  // replaces text-lg + text-[17px] + text-[18px]
  heading:  { size: 22, lineHeight: 28, weight: 700 },  // replaces text-xl + text-2xl + text-[20-22px]
  display:  { size: 32, lineHeight: 36, weight: 800 },  // replaces text-3xl + text-[28px]
  displayLg:{ size: 48, lineHeight: 52, weight: 900 },  // text-4xl/5xl + text-[40-48px]
}
```
**Target: 8 sizes. Currently shipping 18+. Eliminate `text-[Npx]` custom sizes entirely.**

---

## Radius + shadows

### Radius — scale is healthy
`rounded-full` × 795, `rounded-2xl` × 244, `rounded-xl` × 237, `rounded-lg` × 44, `rounded-3xl` × 26, `rounded-md` × 3, `rounded-sm` × 1.

Custom: `rounded-[13px]` × 5, `rounded-[28px]` × 4, `rounded-[14px]` × 2, `rounded-[50px]` × 1, `rounded-[44px]` × 1, `rounded-[41px]` × 1, `rounded-[24px]` × 1, `rounded-[10px]` × 1 — **16 custom occurrences, low-impact.**

**Verdict**: Radius is the healthiest dimension. Keep `sm/md/lg/xl/2xl/3xl/full`, kill the `rounded-[Npx]` outliers.

### Shadows
`shadow-glow` × 76 (custom token, good), `shadow-lg` × 28, `shadow-2xl` × 11, `shadow-md` × 7, `shadow-sm` × 6, `shadow-xl` × 5.

Custom one-off `shadow-[0_X_Y_rgba(139,92,246,Z)]`: 13 unique variants (0.35, 0.4, 0.45, 0.5, 0.6, 0.7 opacity at 14/16/18/20/24/30/40px blur). **Consolidate into `--shadow-glow-sm / md / lg / xl` tokens.**

---

## Icon strategy

- **Inline `<svg>`**: 283 occurrences across 101 files.
- **Via component**: unknown small number (no dedicated `Icon.tsx` found in scan).
- **Via library** (`lucide-react`, `@heroicons`, `react-icons`): **0**.

### Problem
283 inline SVGs guarantee duplication of common glyphs (close, chevron, heart, star, check, user, settings, bell, search, map-pin). Manual audit on 10 sampled files showed 4 independent "heart" SVGs with different viewBoxes and fill rules.

### Proposed strategy
1. Adopt **`lucide-react`** (tree-shakeable, 1400 icons, MIT, ~3KB per imported icon).
2. For brand-specific SVGs (logo ☾, mode illustrations), keep them as `components/icons/*.tsx` exports.
3. Lint rule: no `<svg>` outside `components/icons/` or `components/landing/` (landing scenes use bespoke SVG animations — legit).

---

## Z-index layers

Current mapping (30+ distinct values):

`z-10` × 58, `z-50` × 51, `z-40` × 32, `z-30` × 15, `z-20` × 13, `z-0` × 2
Custom: `z-[9999]` × 3, `z-[90]` × 3, `z-[900]` × 3, `z-[60]` × 3, `z-[1]` × 3, `z-[100]` × 3, `z-[1000]` × 3, `z-[2]` × 2, `z-[95]`, `z-[901]`, `z-[85]`, `z-[801]`, `z-[800]`, `z-[799]`, `z-[61]`, `z-[6]`, `z-[5]`, `z-[3]`, `z-[350]`, `z-[250]`, `z-[200]`, `z-[150]` (1× each).

### Conflicts detected
`z-[799]` / `z-[800]` / `z-[801]` / `z-[900]` / `z-[901]` — someone was fighting stacking context by incrementing. Classic red flag.

### Proposed z-index scale (6 canonical layers)
```ts
zIndex: {
  base:    0,     // default content
  raised:  10,    // cards, sticky elements
  overlay: 40,    // modals backdrop
  modal:   50,    // modal content
  toast:   80,    // ephemeral notifications
  tooltip: 100,   // tooltips + popovers (absolute top)
}
```
Everything above 100 should be investigated for stacking-context bugs, not brute-forced with `z-[9999]`.

---

## Breakpoints usage

`sm:` × 25, `md:` × 10, `lg:` × 4, `xl:` × 0, `2xl:` × 0.

**Analysis**: App is mobile-first PWA → expected. But 4 `lg:` + 0 `xl:` means the desktop experience is under-polished. Not a design system violation — a product decision to review separately.

---

## Tokens à ajouter dans `design-tokens.ts`

```typescript
// ──────────────────────────────────
// SPACING — 4px rhythm
// ──────────────────────────────────
export const spacing = {
  "0":  0,
  "xs": 4,    // tight
  "sm": 8,    // default compact
  "md": 12,   // default
  "lg": 16,   // section padding
  "xl": 24,   // major separation
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

// ──────────────────────────────────
// TYPOGRAPHY — 8 canonical sizes
// ──────────────────────────────────
export const typography = {
  micro:     { size: "10px", lineHeight: "14px", weight: 500 },
  caption:   { size: "12px", lineHeight: "16px", weight: 500 },
  body:      { size: "14px", lineHeight: "20px", weight: 400 },
  bodyLg:    { size: "16px", lineHeight: "24px", weight: 400 },
  title:     { size: "18px", lineHeight: "24px", weight: 600 },
  heading:   { size: "22px", lineHeight: "28px", weight: 700 },
  display:   { size: "32px", lineHeight: "36px", weight: 800 },
  displayLg: { size: "48px", lineHeight: "52px", weight: 900 },
} as const;

// ──────────────────────────────────
// RADIUS
// ──────────────────────────────────
export const radius = {
  sm:    6,
  md:    12,
  lg:    16,
  xl:    20,
  "2xl": 24,
  "3xl": 32,
  full:  9999,
} as const;

// ──────────────────────────────────
// SHADOWS — accent-aware
// ──────────────────────────────────
export const shadows = {
  sm:     "0 1px 2px rgba(0,0,0,0.04)",
  md:     "0 4px 12px rgba(0,0,0,0.06)",
  lg:     "0 10px 30px rgba(0,0,0,0.08)",
  glowSm: "0 0 16px rgba(139,92,246,0.25)",
  glowMd: "0 0 30px rgba(139,92,246,0.4)",
  glowLg: "0 0 60px rgba(139,92,246,0.55)",
} as const;

// ──────────────────────────────────
// Z-INDEX
// ──────────────────────────────────
export const zIndex = {
  base:    0,
  raised:  10,
  overlay: 40,
  modal:   50,
  toast:   80,
  tooltip: 100,
} as const;

// ──────────────────────────────────
// SEMANTIC COLORS (extend globals.css @theme)
// ──────────────────────────────────
// Add to globals.css:
//   --color-accent-soft: rgba(139,92,246,0.12);
//   --color-accent-glow: rgba(139,92,246,0.4);
//   --color-accent-2-soft: rgba(0,255,136,0.12);
//   --color-info: #3B82F6;
//   --color-warn-soft: rgba(245,158,11,0.12);
//   --color-danger-soft: rgba(239,68,68,0.12);
//   --color-safe-soft: rgba(34,197,94,0.12);
```

---

## Fichiers les plus "violeurs" (fix first)

1. **`app/(app)/safety/page.tsx`** — 43 hex literals. Biggest offender.
2. **`components/landing/PhoneVideo.tsx`** — 29 hex. (landing, partly legit)
3. **`app/(app)/trust/page.tsx`** — 23 hex.
4. **`components/landing/MoonHero.tsx`** — 22 hex. (landing, cinematic — audit case by case)
5. **`components/chat/GifPicker.tsx`** — 22 hex. No landing excuse — app surface.
6. **`components/app/WheelOfFortune.tsx`** — 19 hex.
7. **`components/chat/VideoMiniDate.tsx`** — 19 hex.
8. **`components/chat/VoiceIcebreaker.tsx`** — 18 hex.
9. **`components/app/SplitBill.tsx`** — 18 hex.
10. **`components/app/ArrivalStatus.tsx`** — 16 hex.

Migration sequence: start with `safety`, `trust`, `premium` (app pages, high-traffic, all >15 hex) → chat components → landing last (dark palette is a separate namespace).

---

## Non-issues

- **Radius scale** — 95% compliance with `rounded-xl / 2xl / full`. Keep as-is.
- **Line-height scale** — `leading-tight/snug/normal/relaxed` covers all cases cleanly.
- **Breakpoints** — mobile-first PWA, the sparse desktop usage is a product decision, not a token debt.
- **Landing palette** (`#0A0A0D`, `#EC4899`, `#8B5CF6`, `#00FF88`) — intentionally separate namespace per `design-tokens.ts` comment. Not mixed into app surfaces (verify via import graph in follow-up).
- **Dark mode overrides** — `globals.css` uses proper `@theme` (non-inline) since the 2026-04-19 fix noted in the file. No action needed.
- **Font stack** — Space Grotesk + Outfit via `next/font`, centralized. Clean.

---

## Next actions (ranked)

1. Create `src/lib/tokens/` with `spacing.ts`, `typography.ts`, `radius.ts`, `shadows.ts`, `zIndex.ts` (proposed above).
2. Extend `globals.css` `@theme` with soft/alpha variants of accent, accent-2, danger, safe, warn.
3. Add ESLint rule banning raw hex in `.tsx` (allowlist `src/lib/design-tokens.ts` + `src/components/landing/`).
4. Add ESLint rule banning Tailwind palette classes (`red-`, `blue-`, `pink-`, `slate-` etc.) outside landing.
5. Codemod `text-[Npx]` → nearest typography token.
6. Adopt `lucide-react`, delete inline `<svg>` duplicates in `components/app/` + `components/chat/`.
7. Fix z-index stack: replace `z-[800-901]` with canonical `z.modal / z.toast / z.tooltip`.

Est. migration: 3-4 days solo, ~60 files touched, zero visual regression if codemod is tight.

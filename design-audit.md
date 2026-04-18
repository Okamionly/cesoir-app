# CeSoir — Design audit (page-level)

Scope: all `page.tsx` under `src/app/` (excludes API route handlers).

## Design spec

Two palettes, **DO NOT merge**:
- **Landing** (public, dark, cinematic): bg `#0A0A0D`, fg `#FFFFFF`, violet `#8B5CF6`, rose `#EC4899`, vert `#00FF88`
- **App** (post-login, White Fluo Minimal): bg `#FFFFFF`, card `#FAFAFA`, text `#111111`, muted `#888888`, border `#EBEBEB`, accent violet `#8B5CF6`, accent vert `#00FF88`

Fonts shared: Space Grotesk (display) + Outfit (body), wired via `next/font` in root layout and exposed as `var(--font-space-grotesk)` / `var(--font-outfit)`.

Tailwind v4 tokens live in `src/app/globals.css @theme inline`: `bg-bg`, `bg-bg-card`, `text-text`, `text-text-muted`, `text-text-soft`, `border-border`, `text-accent`, `text-accent-2`, plus utility classes `.gradient-bg`, `.gradient-bg-subtle`, `.gradient-text`, `.font-display`.

## Page inventory

Total user-facing pages walked: **54** (`page.tsx` only).

### Route groups
- `(auth)/` — 5 pages: `login`, `register`, `forgot-password`, `reset-password`, `onboarding`
- `(app)/` — 44 pages (plus nested dynamic routes)
- root/other — `p/[id]`, `invite/[code]`, `page.tsx` (landing, **not in scope**)

## Theme detection — what each surface does today

**Good news**: zero pages use legacy `bg-gray-*`, `bg-slate-*`, `bg-neutral-*`, `bg-zinc-*`, or raw `bg-black` / `bg-white`. The color-migration to Tailwind tokens is already complete.

**Consistent with White Fluo Minimal (52/54 pages)**: nearly every app page already uses `bg-bg` + `bg-bg-card` + `text-text*` + `border-border` tokens. Feed, Profile, Browse, Chat, Discover, Events, Modes, Settings, Soiree, etc. are all aligned.

**Missing the cinematic landing treatment (2 auth pages)**: `login` and `register` use `bg-bg` (pure white) — functional, but they feel like generic app screens, not special onboarding moments. Register especially: it's the highest-stakes screen (30% drop-off risk) and deserves the landing-style "cinematic dark" treatment with gradient + glow, not flat white.

## Top issues

1. **Login is visually identical to any utility page.** `bg-bg` + black form fields on white, zero depth. Users arriving from the landing experience a jarring light-mode slap in the face. Needs the landing's dark cinematic palette (bg `#0A0A0D`, violet glow, gradient CTA).
2. **Register has the same problem at 4x the severity** because it's 4 steps long. No sense of "journey" or cinematic momentum. CTAs use `.gradient-bg` (good) but the container is flat white. Should be dark + cinematic like landing, with the progress bar and CTAs carrying the gradient.
3. **Feed uses raw hex `#00FF88`** inline (lines 170-172, 272) instead of `text-accent-2` / `bg-accent-2` tokens. Works, but should use the tokenized class for consistency.
4. **Profile uses inline `style={{ background: "linear-gradient(...)" }}`** in 3 places (avatar ring, gradient-text fallback, status dot) instead of the `.gradient-bg` / `.gradient-text` / `bg-accent-2` utility classes already defined in globals.css. Cosmetic DRY violation.
5. **Onboarding (public)** already uses `MeshGradient` + gradient-text heading + cinematic spring motion — fully compliant with the spec.
6. **Onboarding (auth internal)** exists as a second file at `(auth)/onboarding/page.tsx`; uses `STEP_GRADIENTS` array with per-step colors that include `#EC4899` (landing-only rose) on a light `bg-bg`. This is a mild palette bleed — rose should stay in landing only.
7. **Welcome** already uses `gradient-text` + `welcomeVariants` + `MeshGradient` — compliant.
8. **Minor**: several pages hand-roll fade variants instead of importing from `motion-design.ts` (e.g. profile uses its own `fade()` instead of `profileVariants`). Not a bug, but motion system is underused relative to available tokens.

## Prioritization — which 3 to harmonize

The task spec called out register, feed, profile as the most visible. After reading them:
- **Feed** and **Profile** are already 95% correct — edits would be cosmetic (#3, #4 above).
- **Register** is the most-broken against spec: lots of visible surface, wrong palette, highest stakes.
- **Login** is a smaller but equally-wrong surface, same palette fix.
- **Feed** has one easy win: swap inline `#00FF88` for token.

Chosen top 3 fixes:
1. `src/app/(auth)/register/page.tsx` — full cinematic dark rewrite (the biggest impact).
2. `src/app/(auth)/login/page.tsx` — matching cinematic dark treatment (visual pair with register).
3. `src/app/(app)/feed/page.tsx` — swap inline hex accents for tokens; keep light palette.

## Not touched (per task constraints)

- `src/app/page.tsx` (landing — owned by parallel subagent)
- `src/components/landing/*` (owned by parallel subagent)
- `src/app/globals.css`, `tailwind.config.*`, `next.config.*`

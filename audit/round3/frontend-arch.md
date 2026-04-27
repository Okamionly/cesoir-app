# CeSoir Frontend Architecture Audit — Round 3
> Date: 2026-04-26 | Auditor: Frontend Lead

---

## Architecture Map

```
src/components/
├── ui/                  ← Primitives layer (Button, Card, BottomSheet, Toast, EmptyState,
│   ├── forms/           │  ErrorState, PageHeader, Section, Container, skeletons,
│   └── ...              │  FilterTabs, ProfileCard, PullToRefresh, ReducedMotion…)
├── motion/              ← Motion primitives (Magnetic, MotionImage, RackFocus, PageTransition)
├── ambient/             ← Looping decorative (BreatheAvatar, FloatEmoji, GradientShift)
├── landing/             ← Public marketing (PlasmaOcean, MoonHero, PhoneVideo + 5 more)
├── app/                 ← Shell + cross-cutting (AppChrome, BottomNav, TopNav, FABMenu,
│                        │  SwipeCard, ModeCard, MatchCinematic, SOSButton…)
├── chat/                ← Chat features (14 components)
├── events/              ← Event listing (EventCard, EventFilters, EventLineup, RsvpBar, Map)
├── feed/                ← Feed widgets (EventsWidget, FilterBar, LiveTicker, ReactionBar…)
├── map/                 ← Map overlay (10 components — pins, fly-in cards, heatmap…)
├── messages/            ← Conversation list (3 components)
├── moments/             ← Gamification moments (4 components)
├── profile/             ← Profile features (SelfieVerification)
└── venues/              ← Venue dashboard (1 component)

src/lib/
├── motion-design.ts     ← 20 page-scoped Variants exports + springs/easings/micro/ambient
└── design-tokens.ts     ← landing / app / fonts / spacing / typography / radius / shadows / zIndex
```

Total: ~130 components across 14 folders.

---

## 5 Wins

**1. Motion design system is exemplary.**
`motion-design.ts` exports 7 named spring presets + 4 easing curves + 20 page-scoped Variants objects. Every animated surface has a documented intent (e.g. "Waterfall cascade", "Elastic bubbles"). Magic numbers in components are near-zero — only 9 inline `stiffness/damping/mass` triplets across 4 files, all justified by context-specific overrides.

**2. Design tokens cover both palettes cleanly.**
`design-tokens.ts` maintains a strict `landing` / `app` split with typed exports. The AA contrast audit comment on `textMuted` (#707070) is exactly the right pattern for living token docs.

**3. Primitive layer is solid.**
`Button` (5 variants, 3 sizes, a11y-complete), `Card`, `BottomSheet`, `Toast`, `EmptyState`, `ErrorState`, `skeletons` (7 variants including `SkeletonPage`), and a full `ui/forms/` sub-system with `FormField` auto-wiring `aria-invalid` / `aria-describedby`. This is not "a few primitives" — it's a real design system.

**4. `"use client"` is surgically applied.**
119 out of ~130 components are client-side with good reason (motion, interaction state). The 11 that are server components (layout shells, static landing sections) are left clean. No indiscriminate top-level directives.

**5. Reduced-motion + haptics are first-class.**
`useReducedMotion()` guards every cinematic interaction in `ModeCard`, `EventCard`, `ProfileFlyInCard`. `ReducedMotion.tsx` + `LazyMotionProvider.tsx` exist as wrappers. Haptics is decoupled from `Button` (intentionally, per the comment in Button.tsx).

---

## 5 Problems

**1. `AvatarStack` is copy-pasted — not extracted.**
Identical component (small avatar circles, `-space-x-1.5`, zIndex stacking) implemented independently in:
- `components/app/ModeCard.tsx` (local `AvatarStack`)
- `components/events/EventCard.tsx` (local `AvatarStack`)
- `components/map/ProfileFlyInCard.tsx` (inline, same DOM structure)

Impact: three diverging implementations. When `ring` style or size changes, it requires three edits.

**2. 3D-tilt + hover cinematic pattern duplicated across 3 cards.**
`ModeCard`, `EventCard`, and `ProfileFlyInCard` each independently implement:
- `useMotionValue(0.5)` × 2
- `useSpring(useTransform(...))` × 2
- `handleMouseMove` callback with `getBoundingClientRect()`
- `pointerFine && !reducedMotion` guard
- `rotateX / rotateY / transformPerspective / transformStyle` style block

This is ~40 lines of identical physics code per file. The `motion/Magnetic.tsx` primitive already exists but is not used for these cases. Impact: bugs fixed in one card don't propagate to others.

**3. `EmptyState` actionHref CTA bypasses `Button` primitive.**
`EmptyState.tsx` renders a raw `<Link>` styled manually with `inline-flex`, `rounded-full`, `text-[13px]`, `font-semibold`, and an inline `background: app.gradient` style. This is exactly what `<Button variant="primary" size="md">` encapsulates. One-off diverges from the design system, and the gradient boxShadow value is hardcoded differently (`rgba(139,92,246,0.2)` vs Button's `rgba(139,92,246,0.35)`).

**4. Forms use no validation library — hand-rolled everywhere.**
`react-hook-form` and `zod` are absent from the codebase. `src/lib/validation.ts` has some Zod schemas but they're API-route-only (webhook validation). The `FormField` / `FormInput` / `FormSubmit` primitives are well-built but have no connection to a form state manager. Every form page must manage `useState` per field + manual validation + error hydration manually. Impact: no schema-driven forms, no type-safe field registration, duplication grows with each new form.

**5. `app/` folder is a catch-all that will not scale.**
Currently holds 28 components spanning: shell infrastructure (`AppChrome`, `AppShell`, `BottomNav`), onboarding flows (`PhotoUpload`, `AudioIntro`), gamification (`KarmaBadge`, `SmartQueueBadge`), safety (`SOSButton`, `TrustBadge`, `TrustedCircle`), sharing (`ProfileShareCard`, `ShareProfile`), and live features (`MatchCinematic`, `MidnightReset`). At 50 features this becomes unsearchable. Feature-based sub-folders are needed.

---

## 3 Refactor Proposals (ROI-ranked)

### 1. Extract `useCinematicTilt` hook + `<AvatarStack>` primitive
**ROI: High — 3 files, 0 new dependencies, ~120 lines removed.**

Create `src/lib/hooks/useCinematicTilt.ts` returning `{ rotateX, rotateY, handleMouseMove, style }`. The hook already has all inputs standardized (`stiffness: 200-220, damping: 20-25`). Move `AvatarStack` to `src/components/ui/AvatarStack.tsx` with `size`, `max`, `users` props covering both `Profile` and `CesoirEvent["attendeePreview"]` shapes via a common `{ id: string; avatarUrl?: string; name?: string }` adapter type.

### 2. Wire `EmptyState` CTA to `Button`, add `react-hook-form` to forms
**ROI: Medium — unblocks form scalability before new features land.**

Two changes bundled:
- `EmptyState`: replace the raw `<Link>` CTA with `<Button variant="primary" asChild>` pattern (or a `Link`-wrapped `Button`) to consume the same gradient + shadow tokens.
- Forms: install `react-hook-form` + `zod`, add a `useFormField` context to `FormField` so it can read `fieldState.error` automatically. `FormSubmit` already has a `loading` prop — wire it to `formState.isSubmitting`. Zero visual change, eliminates per-form `useState` boilerplate.

### 3. Split `components/app/` into feature sub-folders
**ROI: Medium-term — structural, no runtime impact.**

Proposed split:
```
app/shell/        → AppChrome, AppShell, BottomNav, TopNav, FABMenu, PageLoader, OfflineBanner
app/onboarding/   → AudioIntro, PhotoUpload, PhotoGallery, VenuePicker
app/safety/       → SOSButton, TrustBadge, TrustedCircle, ReportSheet
app/gamification/ → KarmaBadge, SmartQueueBadge, ModeCard, ModeSwitcher
app/social/       → MatchCinematic, ProfileShareCard, ShareProfile, WeMetFeedback
app/system/       → ServiceWorkerRegister, WebVitalsReporter, KeyboardShortcuts, MidnightReset
```
Keep barrel `app/index.ts` for existing imports — no consumer changes required at refactor time.

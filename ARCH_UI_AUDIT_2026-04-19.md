# UI Architecture Audit — 2026-04-19

Scope: `src/components/**` + `src/app/(app)/**` + `src/app/(auth)/**`. Stack: Next.js 16 App Router, React 19, Tailwind v4, motion library. Read-only audit.

## Executive Summary

- **~55 unused components** ship to the bundle — `src/components/app` has 48/81 files with zero imports. This is the #1 structural issue: massive dead code inflating bundle and mental model.
- **Two parallel chrome architectures** coexist: `layout.tsx` wires `BottomNav + SOSButton + FABMenu` directly; `AppChrome.tsx` also wraps them, but `AppChrome` is never imported. One of them must die.
- **`<EmptyState>`, `<PageHeader>`, `<Skeleton>` ALL EXIST but are under-adopted** — `EmptyState` is used in only 4 pages (of 16+ with "Aucun/aucune" empty copy inline). `PageHeader` has **zero usages outside its own file**, yet 31 pages roll their own `sticky top-0 backdrop-blur` header.
- **Skeleton split-brain**: two parallel files — `ui/Skeleton.tsx` (named exports, 6 variants) vs `ui/LoadingSkeleton.tsx` (default export, 4 variants). Neither is used widely; pages use `animate-shimmer` divs inline.
- **Motion redundance**: `src/lib/motion-design.ts` = 1087 lines with **27 page-specific variant namespaces** (feedVariants, browseVariants, chatVariants, …), yet 40+ pages still hand-roll `initial/animate` inline (top offenders: `profile/verify` 95 occurrences, `map` 49, `modes/[mode]` 40).

---

## Findings

### Composants dupliqués / à consolider (6)

1. **`DateCountdown` — 2 copies, both unused**
   - `src/components/app/DateCountdown.tsx`
   - `src/components/chat/DateCountdown.tsx`
   - Neither is imported anywhere. Proposition: delete both, or pick one and reuse.

2. **`Skeleton` — two implementations**
   - `src/components/ui/Skeleton.tsx` (named exports: `Skeleton`, `SkeletonAvatar`, `SkeletonText`, `SkeletonCard`, `SkeletonProfile`)
   - `src/components/ui/LoadingSkeleton.tsx` (default export, variant prop: `card | row | avatar | text`)
   - Proposition: keep `Skeleton.tsx` (richer API, includes `SkeletonCard` and `SkeletonProfile`); delete `LoadingSkeleton.tsx`.

3. **`ProfileCard` vs `SwipeCard` vs `FlipCard`** — overlap unclear
   - `ui/ProfileCard.tsx` used only in `discover/page.tsx`
   - `app/SwipeCard.tsx` used once
   - `ui/FlipCard.tsx` — generic
   - Proposition: `<ProfileCard>` should be the base primitive; `<SwipeCard>` composes it with drag logic.

4. **Two chrome wrappers, one dead**
   - `src/app/(app)/layout.tsx` directly imports `BottomNav + SOSButton + FABMenu + OfflineBanner + PageLoader + DarkModeProvider + ToastProvider + AccessibilityProvider + AuthProvider + ErrorBoundary + PageTransition`.
   - `src/components/app/AppChrome.tsx` wraps the same chrome, but is imported **nowhere**.
   - Proposition: either adopt `AppChrome` and simplify `layout.tsx` to `<AppChrome>{children}</AppChrome>`, or delete `AppChrome.tsx`.

5. **`VibeCard` vs `NeighborhoodVibeCard`** — both unused currently, same name root
   - Proposition: consolidate under one `<VibeCard variant="neighborhood">` if reused, else delete both.

6. **Card component family not unified** — 14 `*Card*.tsx` files across `app/`, `map/`, `ui/` with no shared base
   - Files: `CrossLinkCard, DateSuggestionCard, ProfileShareCard, QueueCard, RecommendationCard, SoireeCard, SwipeCard, TimelineCard, VibeCard, EventCard, HotspotCard, NeighborhoodVibeCard, FlipCard, ProfileCard`
   - Proposition: extract `<Card>` primitive in `ui/` (rounded-2xl, bg-card, border) — every specialized card composes it.

### Patterns manquants / sous-utilisés (4)

1. **`<EmptyState>` exists but ignored in 12+ pages**
   - Uses it: `notifications`, `discover`, `browse`, `feed`
   - Should use it (has "Aucun"/"aucune" inline empty copy): `chat`, `chat/[id]`, `events`, `events/[id]`, `events/marketplace`, `group`, `plan/[matchId]`, `premium`, `reviews`, `rooms`, `safety`, `soiree`, `speed-dating`, `trending`, `trust`
   - Proposition: sweep pages, replace inline `<div className="...py-20">🎉 Aucun X</div>` with `<EmptyState emoji subtitle actionLabel actionHref />`.

2. **`<PageHeader>` has zero external adoption — 31 pages hand-roll sticky header**
   - File exists at `src/components/ui/PageHeader.tsx` with proper `sticky + backdrop-blur-xl + border-b + back button + right action slot`. Not imported anywhere.
   - Affected pages (31): all of `shop, flash-plans, rooms, squad, events/*, guide, soiree, trending, leaderboard, safety, trust, discover, chat/*, profile/*, modes, feed, why-free, speed-dating, group, about`, etc.
   - Proposition: refactor sweep — replace 31 inline `<header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b ...">` with `<PageHeader title backHref rightAction />`.

3. **Toast system exists (`ui/Toast.tsx` + `ToastProvider` in layout) but only 2 pages use it**
   - Users: `events/marketplace`, `shop`
   - Other pages use `alert()` / inline banners / silent fails for errors.
   - Proposition: document `useToast()` hook, sweep error paths in hooks (`useSwipe`, `useMatches`, `useEvents` etc.) to emit toasts.

4. **No shared `<Tabs>` / `<FilterTabs>` primitive**
   - Pages with hand-rolled tabs: `events/page.tsx`, `notifications/page.tsx`, `reviews/page.tsx`. `ModeFilter` exists but only used by itself.
   - Proposition: extract `<FilterTabs options activeId onChange>` primitive.

### Layout inconsistencies (3)

1. **Horizontal padding mixed (px-4 / px-5 / px-6)**
   - `px-5`: 99 occurrences | `px-4`: 96 | `px-6`: 29
   - No apparent rational split (e.g., px-4 for lists, px-6 for hero). Proposition: pick one default (px-4 recommended, matches Tailwind mobile baseline) + document exceptions (px-6 for hero sections) in `design-tokens.ts`.

2. **max-w inconsistent but mostly fine**
   - `max-w-lg`: 23 usages | `max-w-md`: 1 usage. This is actually the cleanest axis — only one outlier. Recommend standardizing on `max-w-lg` via a `<Container>` primitive.

3. **Vertical spacing scattered (space-y-2/3/4/5/6/8)**
   - `space-y-3`: 38 | `space-y-2`: 20 | others sparse. Proposition: enforce `space-y-3` default for list sections, `space-y-6` between page sections, document in design tokens.

### Motion redondance (3)

1. **`motion-design.ts` = 1087 lines, 27 page-specific variant namespaces**
   - Each page theoretically owns its animation "signature" — good principle — but execution is inconsistent: many pages import these variants **and** also write inline `initial/animate` blocks.

2. **Top offenders mixing inline + design-tokens**
   - `profile/verify/page.tsx` (95 inline motion props), `map/page.tsx` (49), `modes/[mode]/page.tsx` (40), `squad` (38), `speed-dating` (37), `discover` (36).
   - Proposition: add lint rule "prefer variants from motion-design.ts over inline `initial/animate`" — or consolidate patterns into `springs.heavy`, `ambient.float`, etc. that are already exported.

3. **Duplicate micro-interaction primitives**
   - `components/motion/Magnetic.tsx`, `components/motion/RackFocus.tsx`, `components/ui/MicroAnimations.tsx`, `components/ui/Ripple.tsx`, `components/ui/Confetti.tsx` — no clear naming convention for where animations live (`motion/` vs `ui/`).
   - Proposition: move all motion-only primitives to `components/motion/`.

---

## Composants à créer (priorité)

1. **`<Container>`** — wraps `max-w-lg mx-auto px-4` — replaces ~96 inline instances → single source of layout width.
2. **`<FilterTabs>`** — replaces hand-rolled tab logic in `events`, `notifications`, `reviews`.
3. **`<Card>`** (base primitive) — rounded-2xl + bg-card + border — replaces 14 ad-hoc Card components' common shell.
4. **`<Section title description>`** — handles section title typography + consistent bottom margin.
5. **`<ErrorState>`** — counterpart to `<EmptyState>` for failed data loads (currently inconsistent: some pages crash, some show nothing).

## Adoptions à forcer (existe mais pas utilisé)

1. `<PageHeader>` — 31 pages à migrer → ROI énorme, plus gros win du refactor.
2. `<EmptyState>` — 12+ pages avec empty inline à migrer.
3. `<AppChrome>` — soit l'adopter dans `layout.tsx`, soit le supprimer.
4. `useToast` — généraliser sur paths d'erreur dans hooks.

---

## Fichiers à supprimer (dead code candidates)

**Components `app/` sans import (48 fichiers)** :
`AppChrome` (sauf si adopté dans layout), `ArrivalStatus`, `ConversationStarters`, `DateCountdown`, `DateSuggestionCard`, `LiveMeetingMap`, `PostDateFeedback`, `PostDateReview`, `PremiumBadge`, `PremiumGate`, `PrivacyMode`, `ProfileCompletion`, `ProfileStrength`, `PromptPicker`, `PromptReaction`, `ProximityAlert`, `PullIndicator`, `PulseClock`, `PushPermission`, `QueueCard`, `QuickBlock`, `RadarAnimation`, `RecommendationCard`, `ReportFeedback`, `Revanche`, `ReviewPrompt`, `SafetyCheck`, `SeasonalBanner`, `SeasonalOverlay`, `SmartBanner`, `SmartTimeBadge`, `SnoozeMode`, `SocialProof`, `SparkCountdown`, `SplashScreen`, `StreakCounter`, `StreakDisplay`, `TimelineCard`, `TonightCountdown`, `TutorialOverlay`, `VibeCard`, `VibeTagsCloud`, `VideoVerification`, `VouchSystem`, `WeeklyWrapped`, `WheelOfFortune`, `WingmanMode`, `WomenFirstMode`, `XPPopup`.

**Components `chat/` sans import (8)** :
`AudioPlayer`, `DateCountdown`, `GifPicker`, `ModeStarters`, `PhotoBlurReveal`, `QuickReplies`, `SplitBill`, `VideoMiniDate`, `VoiceIcebreaker`.

**Components `map/` sans import (4)** :
`ClusterMarker`, `HotspotCard`, `LiveWalkMode`, `NeighborhoodVibeCard`, `SafeRoute`.

**Duplication à trancher** :
- `ui/Skeleton.tsx` vs `ui/LoadingSkeleton.tsx` → garder Skeleton, delete LoadingSkeleton.

**Avertissement** : Avant de supprimer en masse, vérifier que ces composants ne sont pas des "features à brancher" (ex: `VouchSystem`, `WheelOfFortune`, `SplashScreen` sonnent comme roadmap non-activée). Faire passe avec user : "à brancher ou à jeter ?".

---

## Non-issues / bonnes pratiques observées

- `motion-design.ts` bien centralisé avec philosophy "chaque page a sa signature" — l'architecture est bonne, c'est juste l'adoption qui traîne.
- Providers bien empilés dans `layout.tsx` (`AuthProvider > DarkModeProvider > AccessibilityProvider > ToastProvider`) — ordre logique.
- `PageTransition` + `Suspense` + `ErrorBoundary` en place — good bones.
- `max-w-lg` quasi-unanime (23/24) — cohérence width déjà là.
- Séparation `components/app`, `components/chat`, `components/map`, `components/landing`, `components/motion`, `components/ui` est claire conceptuellement.
- Accessibility primitives (`ReducedMotion`, `aria-label` sur `Skeleton`, `role="status"`) présents.

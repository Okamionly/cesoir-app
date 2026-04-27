# Visual Bug Report — Round 3
Date: 2026-04-26
Viewport: 390x844 (iPhone 14, mobile UA)
Auth: zoe.martin@cesoir.app (CeSoir2026!)
Tool: Playwright 1.59.1, headless Chromium

---

## P0 — Blocks usage

### BUG-01 · /modes/solo-diner — Runtime crash, ErrorBoundary fires
**Route:** `/modes/solo-diner`
**Category:** edge / runtime error
**Repro:** Navigate to `/modes/solo-diner` while logged in (geolocation denied in headless).
**Observed:** Full page replaced by ErrorBoundary fallback ("Oups, quelque chose s'est mal passé" + "Reessayer" button). The mode data for `solo-diner` exists in `src/lib/modes.ts:42` so the `!modeData` guard does not trigger — the crash happens during render of the main page body.
**Likely cause:** `useGeolocation()` returns `{ latitude: null, longitude: null }` in headless. `useProfiles(undefined, undefined, "solo-diner")` or `filterEventsByMode` / `useSyncExternalStore` (server snapshot returns `0`) causes an unguarded exception in the render tree.
**Suggested fix:** `src/app/(app)/modes/[mode]/page.tsx` — wrap the `compatibleEvents` useMemo or the `modeProfiles` usage with null-guards. Also add a per-route `error.tsx` inside `src/app/(app)/modes/[mode]/` so crashes show a targeted message rather than the global boundary.

---

## P1 — User notices

### BUG-02 · ErrorBoundary — Literal `!!` instead of an emoji icon
**Route:** all routes (fires on any crash)
**Category:** typography / edge
**Repro:** Any uncaught render error triggers the boundary.
**Observed:** The "icon" displayed is the literal text `!!` rendered as body copy size in a `<m.span className="text-5xl">`. Looks like a broken character or debug leftover.
**File:** `src/components/ui/ErrorBoundary.tsx:63`
**Suggested fix:** Replace `!!` with an appropriate emoji, e.g. `⚠️` or `😵`. The `text-5xl` class is correct for an emoji icon.

### BUG-03 · /events — ~1400px dead whitespace below 2 event cards
**Route:** `/events`
**Category:** layout
**Repro:** Open `/events` — only 2 seed events load ("Expo Nocturne" + "Afterwork Electro-Jazz"). The `<main>` wrapper has `min-h-screen` via the parent `<div className="min-h-screen bg-bg">` plus `pb-32` on the `<main>`. With only 2 short cards the content ends around y=800; the page inflates to a full 844px minimum, creating ~1400px of empty scrollable white in the full-page capture.
**File:** `src/app/(app)/events/page.tsx:61,99`
**Suggested fix:** Remove `min-h-screen` from the outer div (the page doesn't need to fill viewport height when it has a nav bar), or clamp with `flex flex-col` + `flex-1` pattern. Keep `pb-32` for nav clearance.

### BUG-04 · /events — Second EventCard image renders a "READ" Scrabble tiles photo
**Route:** `/events`
**Category:** image
**Repro:** View second event card ("Afterwork Electro-Jazz — La Grosse Radio").
**Observed:** The card hero image shows a Scrabble tiles photo spelling "READ" — completely unrelated to a jazz afterwork. The first card shows a correct concert/fire image. This is a seeded Unsplash image slug that resolves to the wrong photo.
**File:** `supabase/migrations/020_seed_events_montpellier.sql` — check the `image_url` for the Afterwork Electro-Jazz event.
**Suggested fix:** Replace the Unsplash photo ID for that event with a correct jazz/music venue image.

### BUG-05 · /events — FAB and BottomNav overlap second event card
**Route:** `/events`
**Category:** z-index / layout
**Viewport:** mobile
**Repro:** Scroll to second card — the purple FAB ("C") and the BottomNav bar visually sit over the card content. The "Gratuit" badge on the second card is partially obscured by the FAB.
**Observed coords (original px):** FAB at approx x=330 y=745; BottomNav at y=784. Second card extends past y=700.
**Note:** The FAB is `z-40`, BottomNav `z-50` — both correct by spec, but the page content does not have enough bottom padding for 2 full-height cards + nav clearance.
**Suggested fix:** The `pb-32` (128px) on `<main>` should be enough for a 60px nav, but the stagger animation (`delayChildren: 0.08`, `staggerChildren: 0.06`) means the second card animates in after the screenshot. Confirm in a real browser. If confirmed, increase to `pb-40` or add `scroll-pb-32`.

### BUG-06 · /map — TopNav subtitle text truncates mid-sentence, no ellipsis
**Route:** `/map`
**Category:** typography / layout
**Repro:** Open `/map` with geolocation denied. The TopNav right slot renders the error string from `useGeolocation`: "Active la geolocalisation pour voir les gens pres de toi".
**Observed:** Text truncates at the viewport right edge as "...gens pres de fo" (cuts mid-word). No ellipsis, no `truncate` class, text just bleeds and clips.
**File:** `src/app/(app)/map/page.tsx:823` — the `error` string is rendered inline in a `text-[11px]` div with no overflow control.
**Suggested fix:** Add `truncate` or `line-clamp-1` to the error span, or shorten the error string in `src/lib/useGeolocation.ts:118` to ≤40 chars ("Géolocalisation requise").

### BUG-07 · /safety — FAB overlaps "Cercle de confiance" body text
**Route:** `/safety`
**Category:** z-index / layout
**Repro:** Open `/safety`. The purple FAB ("C") at bottom-right (position: fixed, ~x=330 y=690) sits directly over the sentence "Tes contacts ne voient ta position que quand tu l'activi..." cutting it off visually.
**Observed:** The last ~30% of that text line is covered by the FAB circle.
**Suggested fix:** The FAB is `right-4 bottom-[88px]` (above BottomNav). The safety page content should have `pr-16` or `pr-20` on the card containing that text to avoid the FAB collision zone. Alternatively the FAB should not render on `/safety` — it's a utility page, not a discovery flow.

### BUG-08 · /squad — "Rejoindre" button near-invisible (low contrast, disabled state looks broken)
**Route:** `/squad`
**Category:** color / contrast
**Repro:** Open `/squad` — the "Rejoindre" button next to the invite code input.
**Observed:** Button renders as a very light mint/green on white background. Text appears to be `text-accent` (`#8B5CF6` purple) but the button background is almost white. The visual result looks like a ghost button that failed to load its state, not an actionable CTA.
**File:** `src/app/(app)/squad/page.tsx:209` — `className="... border border-accent/30 text-accent ..."` — the `bg-transparent` default + `border-accent/30` (10% opacity border) creates near-zero visual affordance.
**Suggested fix:** Add a solid background on this button: `bg-accent text-white` instead of the ghost variant, or at minimum `bg-accent/10 border-accent/50` for sufficient contrast.

### BUG-09 · /chat — Suggestion card right-truncates text without ellipsis
**Route:** `/chat`
**Category:** typography / layout
**Repro:** Open `/chat` — "BRISE-GLACES SUGGERES" row shows 2 cards side by side.
**Observed:** Right card ("Ton chien s'entend bien av...") text cuts at container boundary with no ellipsis. The cards row appears to be `overflow-hidden` with no `line-clamp` on the text inside.
**Suggested fix:** Add `line-clamp-2` to the suggestion text inside each card, so it truncates gracefully instead of clipping.

---

## P2 — Polish

### BUG-10 · /browse — Large dead whitespace in geolocation empty state
**Route:** `/browse`
**Category:** layout / empty state
**Repro:** Open `/browse` without geolocation permission.
**Observed:** The "Active la géolocalisation" empty state block is vertically centered, but leaves ~350px of dead white below it before the BottomNav. The `min-h-screen` parent inflates the container beyond what the content needs.
**Suggested fix:** Use `flex flex-col items-center justify-center flex-1` instead of `min-h-screen` so the empty state is properly bounded by the available viewport minus the nav.

### BUG-11 · /settings — BottomNav overlaps "Profil visible" toggle row (mid-scroll snapshot)
**Route:** `/settings`
**Category:** z-index / layout
**Repro:** Scroll settings page to the CONFIDENTIALITE section.
**Observed:** In the full-page screenshot the BottomNav (fixed, z-50) captures over the "Profil visible" toggle row visually. This is a scroll-position artifact in the static screenshot — the `pb-24` (96px) clearance is correct for the 60px nav. Verify in live browser; if the last items in ACCESSIBILITE section are unreachable due to scroll clipping, increase to `pb-32`.
**Severity:** P2 — likely screenshot artifact only.

### BUG-12 · /profile — Avatar image is a male photo for account "Zoe"
**Route:** `/profile`
**Category:** image / data
**Repro:** Log in as zoe.martin@cesoir.app and open `/profile`.
**Observed:** Profile avatar shows a man in a light blue shirt. The seed data in `migration 014` assigns Unsplash photo `1531427186611-ecfd6d936c79` to Zoe — that ID resolves to a male portrait.
**File:** `supabase/migrations/014_real_accounts.sql:30`
**Suggested fix:** Replace the Unsplash photo ID for Zoe with a female portrait that matches the profile gender.

---

## Summary scores (mobile, 390px)

| Dimension   | Score |
|-------------|-------|
| Layout      | 5/10  |
| Typography  | 7/10  |
| Color       | 7/10  |
| Responsive  | 7/10  |
| **Overall** | **6.5/10** |

## Routes with no new bugs
- `/home` (landing) — clean, no regressions
- `/modes` — 4 mode cards render correctly
- `/progress` — badges grid renders, no white-on-white issue visible
- `/plans` — empty state clean
- `/login` → redirects to `/browse` correctly when authed
- `/signup-quick` → redirects to `/browse` correctly when authed

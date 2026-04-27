# Design Critique — CeSoir (Round 3)

> Reviewed: landing page (visual), SwipeCard.tsx, ModeCard.tsx, EventCard.tsx,
> browse/page.tsx, profile/page.tsx, design-tokens.ts, globals.css signals
> Date: 2026-04-26

---

## 5 Design Wins

**1. Landing hero has a genuine point of view.**
"Personne ne dîne seul ce soir à Montpellier." is one of the best onboarding headlines in French dating apps — concrete, local, emotionally resonant. The crescent moon SVG with layered glow and the violet→rose→vert gradient CTA button read as a real brand, not a template fill. The INTRO / scroll hint below the fold shows craft.

**2. Token system is disciplined.**
Two palettes (landing / app) are typed separately with no bleed. Spacing uses a 4px rhythm. Typography has 8 canonical sizes with explicit line heights. Radius tokens are defined. This is senior-level infrastructure that will prevent drift over 12+ months. No rogue `rounded-[23px]` or `text-[17.5px]` found in the reviewed files.

**3. SwipeCard info hierarchy is correct.**
Name at 38px/font-black anchors the eye. Age + distance + time follow at muted weight. Bio clips at 2 lines in collapsed state. The gradient overlay (`from-black via-black/40 to-transparent`) is well-tuned — text is readable without killing photo. The tap-to-expand interaction is sensible; the `bottom 60% click = gallery, top 40% = card drag` zone split is thought out.

**4. Motion has reduced-motion awareness throughout.**
Every animated component — ModeCard 3D tilt, MoonHero float, profile avatar halo, EventCard parallax — checks `useReducedMotion()` before animating. This is non-negotiable for accessibility and it is actually done correctly, not just `prefers-reduced-motion` in CSS.

**5. ModeCard cinematic hover is differentiated.**
The 3D tilt + per-mode radial glow + scale-others-down focus effect + ripple on click is the kind of interaction that competitors (Tinder, Bumble, Hinge) do not have. The `pointer: fine` guard correctly disables it on touch devices. This is the app's strongest moment of craft.

---

## 5 Design Weaknesses

**1. Animated status dot on profile page — anti-cliché confirmed.**
`profile/page.tsx:213-229` — the online indicator (`w-4 h-4 rounded-full`) has a looping `boxShadow` pulse animation that runs every 2 seconds indefinitely. This is exactly the "animated status dot" anti-cliché pattern from the checklist. It provides zero informational gain (the text "Disponible ce soir" already says it) and on a profile page where the user is looking at their own avatar, it just adds visual noise. The breathing halo on the avatar ring is already doing the same job.
- **Fix:** Remove the boxShadow animation. Keep the green dot static. Let the text "Disponible ce soir" carry the status.

**2. The landing hero has no urgency signal above the fold.**
The moon, the headline, and the gradient CTA are strong. But nothing on the visible screen communicates *tonight* as a clock-bound event. "Ce soir" is in the headline but buried mid-sentence in the bold gradient text — the eye reads "Montpellier" first because it is the largest green word. The "INTRO" label at the bottom is too subtle to be a CTA.
- **Fix:** Add a live countdown or "X personnes actives ce soir" social proof number directly below the headline, above the CTA. The `WaitlistCounter` and `CountUpNumbers` components exist — use one here.

**3. Browse page EmptyState and error states are generic.**
`browse/page.tsx:587-600` — when the queue is empty, the user gets a gradient `IconStar` circle, "C'est tout pour ce soir", and a "Recommencer" pill. This is Tinder circa 2016. Worse, the geo-denied state uses a `📍` emoji in a `div` — the emoji is decorative but `aria-hidden` is missing, and more importantly the visual design drops to a completely different lower-quality tier than the rest of the app (no tokens, `gradient-bg` classname instead of proper styling).
- **Fix:** Empty state should show a mode-specific illustration or a textured card surface. Replace the geo-denied emoji container with a proper icon component. At minimum these states deserve the same card surface + motion entrance as the rest of the browse UI.

**4. Profile page is a generic iOS settings sheet.**
The "Essentials" and "Reglages" sections are `<div>` lists with chevrons — identical to every iOS settings screen built in 2022-2024. For a dating app where the profile is where you broadcast your identity, this is a missed opportunity. The avatar hero is well-done (gradient ring, elastic entrance), but everything below the "Modifier le profil" CTA collapses into a menu list that has no brand character.
- **Fix:** The "Mes envies ce soir" chip section is actually good — lean into that pattern. Replace the list rows for "Recommandations / Plans / Progression" with something that visually earns the navigation: ambient thumbnails, active-user counts, or mode tints. The data is available (ModeCard already shows `count * 12 + ...` active users).

**5. EventCard date badge uses a clock emoji — inconsistent icon system.**
`EventCard.tsx:317` — `<span aria-hidden>🕓</span>` sits next to the Lucide `MapPin` icon. Mixing emoji icons with Lucide stroke icons within the same card is visually inconsistent — different stroke weights, sizes, optical baselines. The `MapPin` is 13px Lucide; the clock emoji renders at system emoji size (~14-16px depending on font metrics). On Android this diverges further.
- **Fix:** Replace `🕓` with `<Clock size={13} strokeWidth={2} aria-hidden />` from the existing Lucide import set. Consistent icon family throughout.

---

## 3 Bold Redesign Moves to Differentiate from Tinder/Bumble/Hinge in 2026

**Move 1: Kill the swipe deck. Replace with a "Tonight Board" pressure surface.**
Tinder's swipe deck is 12 years old. CeSoir's proposition — intentional, tonight, specific — is completely undermined by the same left/right mechanic. The redesign: replace the card stack with a spatial board where profiles are placed in a time axis (22h00 / 23h00 / 00h00 columns) based on their `availableTime` field. You swipe to a column, not left/right. The urgency is spatial. Nobody else does this. The backend data (`availableTime`, `time` field in Profile) already supports it.

**Move 2: Make the match moment a shared ritual, not a toast.**
The `MatchCinematic` component exists but is a full-screen takeover that auto-dismisses in 4 seconds. The bold version: when a match happens, both users get a shared 60-second "moment" — a countdown timer where they both decide on one plan chip (Diner / Boire un verre / Balade). If they both pick within 60s, a plan is auto-drafted. This transforms the match from a passive notification into a live coordination ritual. No dating app does synchronous post-match micro-interactions. The existing `TONIGHT_CHIPS` system is the exact right vocabulary for this.

**Move 3: Give the SwipeCard a "Tonight Energy" score instead of generic tags.**
Currently the card shows cuisine / event / dog / language tags — a Hinge-style static fact strip. Replace this with a single dynamic "Tonight Energy" visual: a radial arc that blends mode color + availability time + distance into one glanceable signal (close + now + shared mode = full arc, far + later + different mode = dim partial arc). No text, no tags — pure visual signal. This would be the one screenshot-worthy UI element that users share. The scoring data already flows through `MatchCandidate` (sharedModes, distance_km, availableTime).

---

## Anti-clichés Status

| Pattern | Status |
|---|---|
| Teal #16d5e6 | Not detected |
| Animated status dot | **DETECTED** — profile/page.tsx:213-229, chat/page.tsx:179 |
| Triple padding 24/24/24 | Not detected — 4px rhythm respected |
| Tiempos serif + generic sans | Not detected — Space Grotesk + Outfit is a distinctive pair |
| Left accent bar on cards | Not detected |
| Three-column feature grid hero | Not detected |
| Lucide icons mixed with emoji | **DETECTED** — EventCard.tsx:317 (🕓 + MapPin) |
| Generic gradient CTA | Present on landing but executed well enough to not feel generic |

---

## Verdict

**REQUEST CHANGES**

The foundation is genuinely strong — token discipline, motion craft, landing copy, and the ModeCard hover pattern are all above-average for a dating app in 2026. But two issues need fixing before this feels finished: the animated status dot on profile (anti-cliché that undermines the design's credibility) and the EventCard icon inconsistency (breaks the visual system). The profile page's generic settings-list treatment is the biggest design debt but not a blocker.

The app does not yet have its one "shareworthy moment" — the thing a user screenshots and sends to friends. The ModeCard comes closest but lives too deep in the nav. The bold redesign moves above are sequenced from most impactful to most technically involved; Move 2 (match ritual) could be shipped in a sprint and would immediately differentiate.

## Priority Fix Queue

1. Remove animated boxShadow pulse from online dot (profile/page.tsx:220-228) — 15 minutes
2. Replace 🕓 emoji with Lucide `Clock` in EventCard.tsx:317 — 5 minutes
3. Add live "X actifs ce soir" counter below landing headline — 1 hour (component exists)
4. Profile page navigation section — replace list rows with branded tiles — 1 day
5. EmptyState / geo-denied state — bring up to same design tier as main UI — half day
6. Evaluate Move 2 (match ritual 60s) for next sprint — product + design spike needed

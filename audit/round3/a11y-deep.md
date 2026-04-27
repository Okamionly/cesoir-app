# CeSoir — A11y Deep Audit (Round 3)
Date: 2026-04-26 | WCAG 2.1 AA

---

## SwipeCard.tsx

**:88 — `aria-expanded` misuse (major)**
`aria-expanded` is on a `motion.div` with `role="button"` but semantically describes whether a controlled *panel* is open. The div IS the panel, not the trigger. Move `aria-expanded` to a semantic trigger button or remove it and use `aria-label` to reflect state ("Voir plus / Voir moins").

**:85–93 — Double interaction: drag + keyboard conflict (major)**
ArrowLeft/Right work for swipe, but Tab order puts focus on the card wrapper, which also receives `role="button"`. Pressing Space triggers `onToggleExpand`, not swipe — inconsistent with keyboard mental model. Add `aria-keyshortcuts="ArrowLeft ArrowRight"` and document that Enter/Space toggle info, arrows swipe.

**:144 — Report button: 32×32px (minor)**
`w-8 h-8` = 32px. Below the 44px minimum. Add `tap-target` class (already used elsewhere) or `min-w-[44px] min-h-[44px]`.

**:151 — Photo counter "1 / 5" is decoration-only (minor)**
No `aria-live` — screen reader never announces photo navigation. The surrounding carousel region handles this, but changes are silent. PhotoGallery should fire `aria-live="polite"` on index change.

**:196–202 — LIVE_COLOR only indicator for availability (major)**
"Maintenant" is rendered solely with `style={{ color: LIVE_COLOR }}` on a `<span>`. Color alone must not be the sole differentiator (WCAG 1.4.1). Add a visible icon (e.g. a filled circle already present at :192) with `aria-hidden="true"` alongside it — the circle is there but separate from the text.

---

## PhotoGallery.tsx

**:195–217 — Photo bar buttons are 3px tall (block)**
`h-[3px]` on the `<button>` elements for photo navigation. Visually they look like progress bars, but they are interactive buttons. The 3px height violates 44×44px minimum touch target even though they stretch full-width. Wrap clickable logic in an overlay button that is 44px tall, placed over the decorative bar.

**:231–279 — Fullscreen modal: no focus trap (block)**
When the fullscreen overlay opens, focus is NOT moved into the modal. The close button (`button` at :242) is not auto-focused. Keyboard users cannot close the overlay without Tab-cycling through all page elements first. Need: `autoFocus` on the close button, trap focus within the modal, restore focus to the gallery trigger on close.

**:239 — Backdrop click-to-close only (major)**
The `motion.div` backdrop fires `onClick={() => setFullscreen(false)}` but there is no keyboard equivalent (Escape is not wired to close this fullscreen — only FABMenu has Escape handling). Wire `onKeyDown` Escape or add an `aria-modal="true" role="dialog"` with `useEffect` that listens for Escape.

**:232 — `isBlurred` guard silently fails (minor)**
When `isBlurred(currentIndex)` is true, clicking the blurred photo does nothing visible for keyboard users. The Lock icon has `aria-hidden="true"` but the surrounding `motion.div` has no role/label. Add `aria-label="Photo verrouillee — matchez pour voir"` on the blur overlay.

---

## ModeCard.tsx

**:219–224 — Dual focusable elements: `m.div` + `<Link>` (block)**
The outer `m.div` has `onFocus/onBlur` handlers but no `tabIndex` (defaults to -1), so the inner `<Link>` is the real focus target. However the outer div intercepts hover events for the 3D effect. This creates two competing focus signals. Remove `onFocus/onBlur` from the outer `m.div` and drive `isFocused` from the Link's `onFocus/onBlur` instead — the glow/tilt already responds to `isFocused`.

**:224 — `tabIndex={0}` on `<Link>` is redundant (minor)**
Next.js `Link` renders an `<a>` which is natively focusable. `tabIndex={0}` is a no-op but adds clutter; remove.

**:87 — AvatarStack `alt=""` (minor)**
Decorative avatars correctly use `alt=""`. However the containing `div` has no `aria-hidden`. Add `aria-hidden="true"` to the entire stack since the count is conveyed textually by "+N actifs".

---

## BottomNav.tsx

**:125–137 — DotBadge: `role="status"` inside `aria-hidden` span (major)**
The outer `<span>` has `aria-hidden="true"` at line 121, but the inner `<m.span>` has `role="status" aria-label="Notification"`. Screen readers will see neither because the parent hides the subtree. Move the live notification announcement to a visually hidden `sr-only` span outside the `aria-hidden` container, e.g.:
```html
<span class="sr-only" role="status" aria-live="polite">
  Nouvelles notifications
</span>
```

**:209 — `aria-current="page"` is correct (pass)**
Already implemented properly.

**:226 — Tab label 9px (minor)**
`text-[9px]` labels ("Explorer", "Chat"...) may fail readability at default zoom on some browsers; WCAG does not set a minimum px but 200% zoom test will render these at 18px equivalent which is fine. Non-blocking.

---

## ConversationRow.tsx

**:181–222 — Swipe actions keyboard-inaccessible (block)**
The swipe-reveal actions (Epingler, Archiver, Supprimer) are only triggered by `handleTouchStart/Move`. A keyboard user has no way to access these actions. The desktop hover quick-actions (`:467–523`) are hidden on mobile (`hidden sm:flex`). On mobile keyboard (iOS Switch Control, Android keyboard), these destructive actions are completely unreachable.

Fix: add a keyboard-accessible context menu trigger on the row itself (e.g. a `...` button always visible or revealed via `onFocus`).

**:226–287 — Context menu: no focus trap (major)**
The context menu (`contextMenu === true`) renders without trapping focus or moving focus to the first menu item. Pressing Tab while the context menu is open lets focus escape behind the semi-transparent backdrop.

**:306–308 — `outline-none` on Link with only `ring-inset` (major)**
`outline: none` removes the native focus ring. The custom `ring-2 ring-accent/50 ring-inset` only shows when `isFocused` is true (a React state). If a user tabs quickly, the state update may lag behind the native focus, leaving a momentary invisible focus state.

---

## EventCard.tsx

**:84 — AvatarStack `aria-hidden="true"` (pass)**
Correctly marked decorative.

**:278–285 — Flyer image has `alt=""` (major)**
The event flyer `<Image alt="" />` is purely decorative IF the card's link `aria-label` at :249 fully describes the event — and it does. This is acceptable. However the fallback gradient div at :292–300 has `aria-hidden` correctly.

**:383–386 — "Rejoindre" button has `aria-hidden="true"` (block)**
The "Rejoindre" `<span>` inside the card link has `aria-hidden` explicitly set. This means screen readers hear the link's `aria-label` but the CTA state is invisible. Since the link already has a complete `aria-label`, the `aria-hidden` on the span is acceptable — but the `isGoing` "Tu y es" state (`<span>` at :368) also has no SR announcement. The `aria-label` on the link (:249) does not include RSVP state. Add `${isGoing ? ", tu y es" : ""}` to the `aria-label`.

**:315 — Clock emoji in aria flow (minor)**
`<span aria-hidden>🕓</span>` — emoji is hidden, good. But it's outside the `aria-hidden` attribute scope check: the parent `div` has no role, so it is read as a generic group. Non-blocking.

---

## browse/page.tsx

**:268 — `main` has `role="list"` (major)**
`<main role="list">` is invalid — `main` and `list` cannot be combined. `role="list"` overrides the landmark role, meaning VoiceOver will announce it as a list, not the main content landmark. Either use `<ul>` for the list or keep `<main>` and add a separate child `<ul role="list">`.

**:284–296 — Geo-denied state: no `role="alert"` (major)**
The geolocation error state is rendered conditionally but has no live region. A screen reader user who triggers the page will not hear the location error. Add `role="alert"` or `aria-live="assertive"` to the error container.

**:327 — Error button "Reessayer" missing accent (minor)**
"Reessayer" (line 328) vs "Réessayer" (line 285) — inconsistent French. Not a11y but affects screen reader pronunciation.

**:499–583 — ActionButtons: undo button is 28×28px (major)**
`w-7 h-7` = 28px. Below 44px minimum. The undo button is a real interactive control. Apply `tap-target` or set `min-w-[44px] min-h-[44px]`.

**:595 — EmptyState: "Recommencer" button has no focus ring (minor)**
Plain `<button>` with `gradient-bg` — no `focus-visible:ring` class. Add `focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none`.

---

## profile/page.tsx

**:271–290 — Status pill: online indicator `aria-label` on a `<span>` inside a `<div>` (minor)**
The online dot `<m.span aria-label="En ligne ce soir">` at :213 is correct. The availability pill at :272 uses a visual dot with no aria-hidden, but no text alternative — however the adjacent text "Disponible ce soir" provides the label. The dot at :272 should get `aria-hidden="true"` to avoid double-announcing.

**:276–290 — Active mode Link has `title` but no `aria-label` (minor)**
`title="Changer de mode"` provides a tooltip for pointer users, but it is not reliable for screen readers. Add `aria-label="Mode actif: [activeMode], changer de mode"` to the Link.

**:233–239 — h2 for user name (minor)**
The page has a `PageHeader` that presumably renders an `h1`. The name `<m.h2>` is correct. However there is no landmark structure; the avatar section uses `<m.section>` without an `aria-labelledby`. Add `aria-labelledby` pointing to the h2 name.

---

## FABMenu.tsx

**:109–115 — Escape key wired (pass)**
Escape closes the FAB correctly.

**:176 — `role="menu"` without `aria-label` on the container div's child (pass)**
`role="menu" aria-label="Actions rapides"` is correct.

**:199–208 — Action buttons: 40×40px (major)**
`h-10 w-10` = 40px. Below 44px minimum. The outer wrapper has `tap-target` but `tap-target` is applied to the wrapper `m.div`, not the `button`. If `tap-target` sets `min-h/min-w`, this is fine — verify the utility definition. If it only adds padding, the button itself remains 40px.

**:216 — Main FAB: `aria-haspopup="true"` should be `"menu"` (minor)**
`aria-haspopup="true"` is equivalent to `"menu"` per the ARIA spec but `"true"` is deprecated. Use `aria-haspopup="menu"` for clarity and future-proofing.

**:225–227 — Moon glyph ☾ as FAB icon (minor)**
The closed FAB shows `☾` (Unicode crescent) as text content. This is rendered as a text node visible to screen readers alongside the `aria-label="Ouvrir le menu"`. The glyph will be announced as "croissant de lune" by some screen readers in addition to the label. Wrap in `<span aria-hidden="true">`.

---

## SceneController.tsx

**:146–149 — Auto-play respects `prefers-reduced-motion` (pass)**
`usePausableInterval` is gated on `reducedMotion`. Correct WCAG 2.2.2 implementation.

**:172–189 — Global `keydown` captures arrow keys (major)**
Arrow keys globally hijacked for scene navigation will conflict with keyboard users operating focusable elements inside the page (e.g. the "Rejoindre" button link, the scrubber dots). When the user focuses a button and presses ArrowRight expecting nothing, the scene advances. Fix: only handle key events when no interactive element has focus, i.e., check `document.activeElement === document.body || document.activeElement === containerRef.current`.

**:194–208 — Wheel event `preventDefault` breaks scroll accessibility (major)**
`wheel` events are captured with `passive: false` and `preventDefault()` across the entire window. This breaks any assistive technology that uses scroll for navigation (e.g. screen magnifier pan, scroll-based AT). Scope the listener to the landing container element only, not `window`.

**:250 — No `role` on the scene wrapper (minor)**
The root div has no landmark. Add `role="region" aria-label="Presentation CeSoir"` or wrap scenes in a `<section>`. The scrubber dots need `role="tablist"` / `role="tab"` semantics if they are meant to be navigated as a tab panel.

**Scrubber dots — not visible in this excerpt but per pattern:**
If they are plain `<button>` elements with `aria-current` for the active scene — that is the correct pattern. Confirm they have visible focus rings and `aria-label="Scene X: [SCENE_NAMES[i]]"`.

---

## Systemic Recommendations

**1. Create a `useFocusTrap` hook**
Three components need focus traps (PhotoGallery fullscreen, ConversationRow context menu, and any future modal). A single hook using `focus-trap` or a custom implementation with `querySelectorAll(focusableSelectors)` + `keydown` Tab interceptor would eliminate this class of block-severity issues entirely.

Signature:
```ts
useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean): void
```
Auto-focuses first focusable child when `active` becomes true, restores focus to the trigger on `false`.

**2. Standardize live-region architecture**
Notifications, match events, typing indicators, error states, and badge counts all change dynamically but none have a centralized `aria-live` region. Create a `<LiveRegion>` singleton component (placed in the root layout) that accepts a queue of announcements:
```tsx
// layout usage
<LiveRegion />
// anywhere
announceToSR("Match avec Sophie !")
announceToSR("3 nouveaux messages")
```
This covers: match cinematics, toast-style errors, unread badge changes, typing indicator.

**3. Audit and enforce the `tap-target` utility**
The project uses a custom `tap-target` Tailwind utility but it is applied inconsistently (photo bar buttons, undo button, action buttons are all below 44px). Define `tap-target` as:
```css
.tap-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```
Then enforce it via an ESLint rule or a Playwright test that queries all `button` and `a` elements and asserts `offsetWidth >= 44 && offsetHeight >= 44`.

---

## Issue Count by Severity

| Severity | Count |
|---|---|
| Block | 5 |
| Major | 16 |
| Minor | 12 |
| Pass (already correct) | 5 |

**Priority fixes (shipping blockers):**
1. PhotoGallery fullscreen — no focus trap (block)
2. Photo bar buttons — 3px touch target (block)
3. ConversationRow swipe actions — keyboard inaccessible (block)
4. `<main role="list">` invalid combination in browse/page (block)
5. DotBadge aria-hidden hides role="status" (block — counted as major above, is effectively a block for SR users)

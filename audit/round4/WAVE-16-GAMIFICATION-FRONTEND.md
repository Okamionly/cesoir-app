# Wave 16 — Bet #5: Gamification Frontend Surfacing

> **Status:** Spec ready for engineer pickup.
> **Owner:** TBD.
> **Estimated effort:** ~10h end-to-end.
> **Goal:** surface XP / level / badge progression in 3 high-traffic locations to drive retention. Backend (`useGamification`, `useBadges`, achievements + karma_transactions tables, realtime updates) is already production-ready — this is **pure frontend visibility work**.

---

## 1. Current State Inventory

### What EXISTS (and works)

| File | Status | Notes |
|------|--------|-------|
| `src/lib/gamification.ts` | Production | 20-level table, 8 XP actions, `calculateLevel()`, `checkLevelUp()`, level rewards |
| `src/lib/useGamification.ts` | Production | Realtime XP updates via `karma_transactions` channel, `addXP()` helper, `showLevelUp` state, `xpPopups` queue |
| `src/lib/badges.ts` | Production | 30 badges, 6 categories, 4 rarity tiers with color config |
| `src/lib/useBadges.ts` | Production | Reads `achievements` table, computes progress per badge from `conversations`/`messages`/`invite_codes`/`profiles`, `checkAndAward()` writes new earnings + emits karma_transactions |
| `src/app/(app)/progress/page.tsx` | Production | 5 tabs (Badges / Defis / Classement / Confiance / Reviews) showing earned + in-progress badges with rarity glow |
| `src/components/moments/LevelUpCounter.tsx` | Exists (verify usage) | Counter primitive, may already be plugged into some page |
| `src/components/ui/Toast.tsx` | Production | Has `match` variant with gradient. Provider mounted in root layout. Use `useToast()` hook. |
| `src/components/app/MatchCinematic.tsx` | Production | Full-screen takeover, 16-particle confetti, overshoot avatar spring, 8s auto-dismiss with pause-on-hover, sound + haptics. **Use as the cinematic-template for badge unlock.** |

### What is MISSING in UI

| Surface | Visibility | Issue |
|---------|------------|-------|
| **XP bar** | Nowhere | The user's XP / level / progress to next level is invisible across the entire app. Only viewable inside `/progress > Confiance` tab — 3 taps deep. |
| **Level-up notification** | Nowhere | `useGamification.showLevelUp` state is set when XP crosses a threshold but NO COMPONENT renders it. The state is dead. Confetti exists in MatchCinematic but isn't reused. |
| **Badge unlock animation** | Nowhere | `useBadges.checkAndAward()` returns newly earned badge IDs but no caller fires a celebration. Users earn badges in silence — they only discover later by visiting `/progress > Badges`. |
| **XP popup on action** | Partially | `useGamification.xpPopups` queue exists (e.g. "+50 XP - Profil complet"). Need to render it. Likely a small floating "+50 XP" pill near the top-right. |

### Root cause
The progression backend was built first (the data is correct, realtime works, level math is solid). The visibility layer was scoped for "later" — now is later.

---

## 2. Three Surfacing Locations (in order of impact)

### A) XP Bar in PageHeader (always visible)

**Why first:** users see PageHeader on every authenticated screen. Adding the XP bar makes progression a constant ambient signal — the same trick Duolingo / Strava / fitness trackers use to keep engagement high.

**Visual spec:**
- Renders BELOW the title row, ABOVE the hairline (use `slotBelowTitle` slot — already supported)
- ~24px tall total: small "L7" pill on the left + thin progress bar + "1 240 / 1 700 XP" label on the right
- Bar fills with `gradient-bg` (existing `linear-gradient(violet → green-fluo)`)
- On hover/tap: tooltip "Encore 460 XP avant le niveau Influent" (uses next-level title from `LEVELS` table)
- On level-up: brief glow pulse animation on the bar (1.5s)
- **Reduced motion:** static bar, no glow

**A11y:** `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax={nextLevelXP}`, `aria-valuenow={currentXP}`, `aria-label="Progression niveau {level} {title}"`.

**Density toggle:** in compact mode (e.g. `/chat/[id]`, `/browse`), the bar is hidden by default. Caller can opt-in via a new `showXPBar` prop on `PageHeader` (defaults to `true`). Pages that need vertical real estate (chat view) opt out.

### B) Level-Up Toast (cinematic, when XP crosses threshold)

**Why second:** level-ups are the single biggest dopamine moment in the system — they MUST feel earned. Today they happen invisibly.

**Visual spec:**
- NOT the existing toast (too small). Use a centered-modal pattern, 4-5 second auto-dismiss
- Component: `src/components/gamification/LevelUpModal.tsx` (new)
- Animation:
  - Backdrop fades in (300ms)
  - Number `7` (the new level) zooms 0.4 → 1.1 → 1.0 with spring overshoot (700ms)
  - Confetti burst (reuse the 16-particle pattern from `MatchCinematic.tsx:194-226` exactly — colors `#8B5CF6, #00FF88, #EC4899, #FACC15, #06B6D4`)
  - Title "Niveau 7 - Populaire" rises with `y: 20 -> 0`, `opacity: 0 -> 1`
  - Reward chips appear staggered: "🔥 Badge Populaire", "⚡ Boost x2 24h"
  - "Continuer" button at bottom, single CTA
- Uses existing `LevelUpData.rewards` array from `useGamification.showLevelUp`
- Sound + haptic on open: reuse `playSound("match")` and `haptics.match()` (or add a new `playSound("levelup")` — sample search shows `src/lib/sounds.ts`)

**Trigger:**
- Mount once in root authenticated layout (`src/app/(app)/layout.tsx`)
- Subscribe to `useGamification().showLevelUp` — when truthy, render `<LevelUpModal />`
- On dismiss → call `dismissLevelUp()`
- Already-built `useGamification` realtime listener on `karma_transactions` triggers level-up detection

**A11y:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the level number, ESC closes.

### C) Badge Unlock Animation (mini-cinematic, 4s)

**Why third:** badges are smaller dopamine hits than levels but happen 30x more often (30 badges total). They deserve recognition without dominating the screen.

**Visual spec:**
- Component: `src/components/gamification/BadgeUnlockCinematic.tsx` (new)
- 60-70% scale of `MatchCinematic` — NOT full screen, more like a card overlay
- Rendered in a portal at the center of the viewport
- Animation (4-second total):
  - Backdrop fades in 300ms (lower opacity than match cinematic — 0.6 not 0.85)
  - Badge emoji scales 0.3 → 1.2 → 1.0 with overshoot (700ms)
  - Glow ring uses the badge's `RARITY_CONFIG.glowColor` (existing config)
  - 8 confetti particles (half of MatchCinematic's 16 — keep it punchier, less ceremonial)
  - Badge name appears below: "Badge debloque - {name}"
  - "+{xp} XP" pill fades in
  - "Voir tous les badges" link at bottom (small, secondary)
- Auto-dismiss after 4s; tap-anywhere or ESC dismisses early
- **Queueing:** if multiple badges are awarded in one tick, show them sequentially (1.5s gap between)

**Trigger:**
- Listen to `useBadges` for new awards. Two integration points:
  1. **After explicit `checkAndAward()` call** (e.g. on match accept, message send, profile completion) — the caller already knows what to do
  2. **Realtime achievements channel** — subscribe to `achievements` table INSERTs filtered to current user (similar pattern to `useGamification`'s xp channel)

**Implementation tip:** add a `BadgeUnlockProvider` (context) with a queue, push to it from `useBadges.checkAndAward` callback, render the modal at root layout level. Same pattern as `useToast`.

---

## 3. Implementation per Location

### A) XP Bar in PageHeader

**Files to edit/create:**
- NEW: `src/components/gamification/XPBar.tsx`
- EDIT: `src/components/ui/PageHeader.tsx` — add `showXPBar?: boolean` prop (default `true`), render `<XPBar />` inside `slotBelowTitle` if no slot is already provided
- EDIT: pages that opt-out (e.g. `src/app/(app)/chat/[id]/page.tsx`) — pass `showXPBar={false}`

**State management:**
```tsx
// XPBar.tsx
"use client";
import Link from "next/link";
import { m } from "motion/react";
import { useGamification } from "@/lib/useGamification";
import { LEVELS } from "@/lib/gamification";

export function XPBar() {
  const { level, title, currentXP, nextLevelXP, progress, loading } = useGamification();

  if (loading) return <div className="h-6" aria-hidden="true" />;
  if (level >= LEVELS.length) return <MaxLevelBadge />;  // separate cosmetic for max level

  const nextTitle = LEVELS[level]?.title ?? title;

  return (
    <Link
      href="/progress"
      className="block group"
      aria-label={`Niveau ${level} ${title}, ${currentXP} sur ${nextLevelXP} XP`}
    >
      <div className="flex items-center gap-2 px-4 py-1.5">
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full gradient-bg text-white shrink-0">
          L{level}
        </span>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={nextLevelXP}
          aria-valuenow={currentXP}
          className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden"
        >
          <m.div
            className="h-full gradient-bg"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] text-text-muted shrink-0 group-hover:text-text transition-colors">
          {currentXP}/{nextLevelXP}
        </span>
      </div>
    </Link>
  );
}
```

**Realtime:** automatic via `useGamification`'s existing `karma_transactions` channel — bar will animate as XP arrives.

**Cohesion link:** the entire bar is a `<Link href="/progress">` — direct entry to the progression hub.

### B) Level-Up Modal

**Files to create:**
- NEW: `src/components/gamification/LevelUpModal.tsx` (~150 lines, pattern adapted from `MatchCinematic.tsx`)
- EDIT: `src/app/(app)/layout.tsx` — mount `<LevelUpListener />` once at the top, near the existing providers

**Listener pattern:**
```tsx
// LevelUpListener.tsx — invisible component that wires the modal
"use client";
import { useGamification } from "@/lib/useGamification";
import { LevelUpModal } from "./LevelUpModal";

export function LevelUpListener() {
  const { showLevelUp, dismissLevelUp } = useGamification();
  return <LevelUpModal data={showLevelUp} onDismiss={dismissLevelUp} />;
}
```

**Animation patterns to reuse:**
- `springs.elastic`, `easings.overshoot` from `@/lib/motion-design`
- Confetti loop pattern from `MatchCinematic.tsx:195-226` (verbatim)
- `moodMatchVariants.matchCard` for the level number `<m.h2>` (rubber spring with rotateZ — already production)
- `playSound("match")` and `haptics.match()` (or add `levelup` variants if user prefers)

**A11y:**
- Focus trap on open (use existing pattern from MatchCinematic — listens for ESC)
- Live region announces "Niveau {n} - {title} debloque"
- All confetti / glow has `aria-hidden="true"`
- `prefers-reduced-motion`: skip confetti + scale animations, just fade in the static card

**Cohesion link:** rewards block has "Voir mes niveaux" → `/progress?tab=trust` (the Confiance tab shows level breakdown).

### C) Badge Unlock Cinematic

**Files to create/edit:**
- NEW: `src/components/gamification/BadgeUnlockCinematic.tsx` (~120 lines)
- NEW: `src/components/gamification/BadgeUnlockProvider.tsx` (queue context)
- EDIT: `src/app/(app)/layout.tsx` — wrap children in `<BadgeUnlockProvider>`
- EDIT: `src/lib/useBadges.ts` — after `checkAndAward()` writes new achievements (around line 490), call `pushBadgeUnlock(badge)` from the new context for each newly earned id

**Provider pattern:**
```tsx
// BadgeUnlockProvider.tsx
"use client";
import { createContext, useContext, useState, useCallback } from "react";
import type { Badge } from "@/lib/badges";
import { BadgeUnlockCinematic } from "./BadgeUnlockCinematic";

interface Ctx {
  pushBadgeUnlock: (b: Badge) => void;
}
const BadgeCtx = createContext<Ctx | null>(null);
export const useBadgeUnlock = () => {
  const c = useContext(BadgeCtx);
  if (!c) throw new Error("useBadgeUnlock outside provider");
  return c;
};

export function BadgeUnlockProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Badge[]>([]);
  const pushBadgeUnlock = useCallback((b: Badge) => {
    setQueue((q) => [...q, b]);
  }, []);
  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return (
    <BadgeCtx.Provider value={{ pushBadgeUnlock }}>
      {children}
      {queue[0] && <BadgeUnlockCinematic badge={queue[0]} onDismiss={dismiss} />}
    </BadgeCtx.Provider>
  );
}
```

**useBadges integration** (around line 490 of `src/lib/useBadges.ts`):
```ts
// After successful insert into achievements:
const newlyEarned: string[] = [];
for (const bp of all) {
  if (bp.earned && !earnedIds.has(bp.badge.id)) {
    const { error } = await supabase.from("achievements").insert({...});
    if (!error) {
      newlyEarned.push(bp.badge.id);
      pushBadgeUnlock(bp.badge);  // <-- NEW: trigger cinematic
      await supabase.from("karma_transactions").insert({...});
    }
  }
}
```

**Realtime fallback:** also subscribe to `achievements` INSERTs in `useBadges` so badges earned by SERVER-side triggers (e.g. invite-rewards-hybrid migration 025 might award `ambassadeur` server-side) also fire the cinematic. Same pattern as `useGamification`'s realtime channel.

**A11y:**
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby={badge-name-id}`
- Live region with badge name + XP gained
- ESC closes, tap backdrop closes, auto-dismiss after 4s
- `prefers-reduced-motion`: replace cinematic with a single subtle toast using existing `useToast` ("Badge debloque: {name} +{xp} XP")

**Cohesion link:** "Voir tous les badges" CTA at bottom of cinematic → `/progress` (defaults to Badges tab — already the first tab).

---

## 4. Cohesion with Existing /progress page

All three surfacings link back to `/progress`:
- **XP Bar** (always-visible) wraps the whole bar in `<Link href="/progress">` — single tap to dive in
- **Level-Up Modal** has secondary CTA "Voir mes niveaux" → `/progress?tab=trust` (the Confiance tab shows level/XP breakdown)
- **Badge Cinematic** has bottom link "Voir tous les badges" → `/progress` (Badges is the default tab)

This makes `/progress` the cathedral and the three surfacings the doorbells. Today the page has no inbound traffic from anywhere except the bottom-nav profile route. Post-Wave-16 it should be the most-visited page after `/browse` and `/chat`.

**One edit on `/progress`:** add a small banner on first visit AFTER level-up that congratulates the user and invites a share — e.g. "Tu viens de passer niveau 7 ! Partage avec un ami." — using the existing `referral.ts` link generator. Wire via `?levelup=7` query param set by the LevelUpModal CTA.

---

## 5. Estimated Effort + Sequencing

| Step | Description | Hours |
|------|-------------|-------|
| A1 | Create `XPBar.tsx` (component + a11y + animation) | 1.5 |
| A2 | Wire into `PageHeader.tsx` with opt-out prop, audit which pages opt-out | 1.0 |
| A3 | Test loading state, max level, reduced motion | 0.5 |
| B1 | Create `LevelUpModal.tsx` (adapt from MatchCinematic, ~150 lines) | 2.0 |
| B2 | Create `LevelUpListener.tsx`, mount in `(app)/layout.tsx` | 0.3 |
| B3 | Add `playSound("levelup")` if not present, copy haptic call | 0.3 |
| B4 | Test with manual XP injection (devtools), reduced-motion variant | 0.5 |
| C1 | Create `BadgeUnlockProvider.tsx` queue + context | 0.5 |
| C2 | Create `BadgeUnlockCinematic.tsx` (~120 lines) | 2.0 |
| C3 | Wire `useBadges.checkAndAward` to `pushBadgeUnlock` | 0.3 |
| C4 | Add `achievements` realtime channel to `useBadges` | 0.5 |
| C5 | Test queueing of multiple simultaneous badges, a11y, reduced-motion fallback toast | 0.5 |
| - | `/progress` post-levelup banner via query param | 0.5 |
| - | PostHog events: `xpbar_clicked`, `levelup_shown`, `levelup_dismissed`, `badge_unlock_shown` | 0.3 |
| - | Buffer | 0.3 |
| **Total** | | **~10 hours** |

### Recommended sequencing
1. **Ship A first (XP Bar)** — fastest visible win, low risk, 3 hours. Get it in front of users on day 1, gather telemetry on `xpbar_clicked` to validate /progress traffic uplift.
2. **Then C (Badge Cinematic)** — frequent trigger (30 badges, more surfaces firing), tests the cinematic pattern at scale before B's bigger moment. ~3.5h.
3. **Finally B (Level-Up Modal)** — rare event (level changes maybe weekly per user), but highest emotional weight. Polish hardest. ~3h.

Total wall-clock: 1.5 days for one engineer. Can be split — A is independent, B and C can be parallelized if two engineers.

---

## 6. Out of Scope (followups)

- **Streak counter** in PageHeader (next to L7 pill) — useChallenges already has streak data, but the visual + reward loop needs design work
- **Animated XP pop on action** ("+50 XP" pill that floats from interaction point) — use `useGamification.xpPopups` queue, similar to badge cinematic but smaller. P1.
- **Compare with friends** widget — show how many badges your matches have earned. Needs friends graph (currently not really modeled — only `invite_codes`).
- **Share level-up to social** — "I just hit level 7 on CeSoir!" share card with og:image. Needs OG image generator route.
- **Sound design pass** — currently reuses `match` sound. A dedicated `levelup.mp3` (longer, more triumphant) and `badge.mp3` (shorter, lighter) would distinguish the moments.
- **Progress prediction** — "5 days at this pace = level 8". Needs trailing-7d XP velocity calc.

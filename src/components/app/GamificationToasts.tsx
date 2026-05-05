"use client";

/**
 * GamificationToasts — global listener that turns useGamification
 * level-ups and useBadges unlocks into transient top-of-viewport toasts.
 *
 * Mounted ONCE in `src/app/(app)/layout.tsx`.
 *
 * Why a dedicated component (not the existing ToastProvider)?
 *   - These toasts have a richer payload (perks list, XP delta) than the
 *     plain text/type contract of `Toast.tsx`.
 *   - Level-ups deserve a full-width banner with confetti; badge unlocks
 *     are a smaller second-tier slide-in. Two visual languages, one queue.
 *   - We don't want to leak gamification state into every consumer of
 *     useToast() — keep concerns separated.
 *
 * Accessibility:
 *   - prefers-reduced-motion respected via AccessibilityProvider context
 *     (clamps motion durations & disables confetti burst).
 *   - aria-live="polite" so screen readers announce the toast without
 *     interrupting current narration.
 */

import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/lib/useGamification";
import { useBadges } from "@/lib/useBadges";
import { useToastQueue, type QueuedToast } from "@/lib/useToastQueue";
import { useAccessibility } from "@/components/ui/ReducedMotion";
import { app as appTokens, zIndex } from "@/lib/design-tokens";
import { PartyPopper, Trophy, X } from "@/components/ui/lucide";
import type { LevelReward } from "@/lib/gamification";

// ─────────────────────────────────────────
// Confetti burst — pure CSS / SVG, no extra dep
// ─────────────────────────────────────────

const CONFETTI_COLORS = [
  appTokens.violet,
  appTokens.vert,
  appTokens.rose,
  appTokens.gold,
  appTokens.purple,
];

const CONFETTI_PIECES = 18;

function ConfettiBurst({ disabled }: { disabled: boolean }) {
  // Pre-computed once per mount so the layout is stable.
  const pieces = useMemo(() => {
    return Array.from({ length: CONFETTI_PIECES }).map((_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      // spread across full width
      left: `${(i / CONFETTI_PIECES) * 100 + Math.random() * 6 - 3}%`,
      delay: Math.random() * 0.25,
      // mix of vertical drop + small lateral drift
      drift: (Math.random() - 0.5) * 80,
      rotation: Math.random() * 540,
      duration: 1.6 + Math.random() * 0.8,
      size: 6 + Math.random() * 6,
    }));
  }, []);

  if (disabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-32 overflow-visible"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -10, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: 140,
            x: p.drift,
            opacity: [0, 1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            left: p.left,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Single toast renderer — branches on type
// ─────────────────────────────────────────

interface ToastCardProps {
  toast: QueuedToast;
  onDismiss: () => void;
  reducedMotion: boolean;
}

function LevelUpCard({ toast, onDismiss, reducedMotion }: ToastCardProps) {
  const perks = (toast.meta as { perks?: LevelReward[] } | undefined)?.perks ?? [];

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reducedMotion ? { opacity: 0 } : { y: -120, opacity: 0, scale: 0.96 }}
      animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { y: -120, opacity: 0, scale: 0.96 }}
      transition={
        reducedMotion
          ? { duration: 0.01 }
          : { type: "spring", stiffness: 320, damping: 28 }
      }
      onClick={onDismiss}
      className="relative w-full max-w-md cursor-pointer overflow-hidden rounded-3xl border shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${appTokens.violet} 0%, ${appTokens.purple} 50%, ${appTokens.rose} 100%)`,
        borderColor: "rgba(255,255,255,0.2)",
        boxShadow: `0 12px 48px ${appTokens.violet}55`,
      }}
    >
      <ConfettiBurst disabled={reducedMotion} />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute right-3 top-3 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
        aria-label="Fermer"
      >
        <X size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>

      <div className="relative z-10 flex items-start gap-4 px-5 py-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <PartyPopper size={26} strokeWidth={2} className="text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 text-white">
          <p className="text-base font-bold leading-tight">{toast.title}</p>
          {toast.body ? (
            <p className="mt-0.5 text-sm opacity-90">{toast.body}</p>
          ) : null}
          {perks.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {perks.slice(0, 3).map((perk) => (
                <li
                  key={`${perk.type}-${perk.label}`}
                  className="flex items-center gap-1.5 text-xs opacity-95"
                >
                  <span aria-hidden="true">{perk.icon}</span>
                  <span className="truncate">{perk.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function BadgeUnlockCard({ toast, onDismiss, reducedMotion }: ToastCardProps) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reducedMotion ? { opacity: 0 } : { y: -60, opacity: 0, scale: 0.96 }}
      animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { y: -40, opacity: 0, scale: 0.96 }}
      transition={
        reducedMotion
          ? { duration: 0.01 }
          : { type: "spring", stiffness: 380, damping: 30 }
      }
      onClick={onDismiss}
      className="relative w-full max-w-sm cursor-pointer rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md"
      style={{
        background: appTokens.bgCard,
        borderColor: appTokens.border,
        boxShadow: `0 8px 24px ${appTokens.violet}22`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{
            background: `linear-gradient(135deg, ${appTokens.violet}1a, ${appTokens.gold}1a)`,
          }}
        >
          {toast.icon ? (
            <span aria-hidden="true">{toast.icon}</span>
          ) : (
            <Trophy size={18} strokeWidth={2} className="text-text" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text leading-tight">
            {toast.title}
          </p>
          {toast.body ? (
            <p className="mt-0.5 text-xs text-text-muted">{toast.body}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="shrink-0 rounded-full p-1 text-text-muted hover:bg-black/5"
          aria-label="Fermer"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Root component
// ─────────────────────────────────────────

export default function GamificationToasts() {
  const { user, loading } = useAuth();

  // Gate on auth — same pattern as AppChrome. Anonymous visitors land on
  // (app)-group public pages (/about, /cgu, /privacy) and we MUST NOT spin
  // up Supabase queries / realtime channels for them.
  if (loading || !user) return null;

  return <GamificationToastsInner />;
}

function GamificationToastsInner() {
  const { showLevelUp, dismissLevelUp } = useGamification();
  const { all: allBadges } = useBadges();
  const { reducedMotion } = useAccessibility();
  const { current, enqueueToast, dismiss } = useToastQueue();

  // Track which level-ups + badge unlocks we've already enqueued so the
  // effects don't fire repeatedly on each render of the underlying state.
  const enqueuedLevelRef = useRef<Set<number>>(new Set());
  const enqueuedBadgeRef = useRef<Set<string>>(new Set());
  // 2026-04-28 fix: snapshot of badges the user has ALREADY been notified
  // about — persisted to localStorage so a remount (route change, HMR,
  // StrictMode) doesn't replay every historic badge as "newly earned".
  // Previous logic seeded an in-memory ref on first render, but if useBadges
  // returned earned=false initially then flipped to earned=true after the
  // achievements query resolved, the seed was already locked in as empty
  // → every existing badge fired a toast on every navigation.
  const SEEN_KEY = "cesoir-toast-seen-badges-v1";
  const seenBadgeIdsRef = useRef<Set<string>>(
    typeof window === "undefined"
      ? new Set()
      : new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]),
  );
  // Whether we've at least once seen a non-empty earned set from the server,
  // used as a "data has loaded" gate so we don't toast on first paint.
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (hasSyncedRef.current) return;
    if (allBadges.length === 0) return;
    // Wait for at least one server tick that actually returned earned data.
    // Most users have at least the Fondateur badge — if NO badge is earned
    // after the first sync, we still flip the gate (legit zero-badge user).
    hasSyncedRef.current = true;
    // Pre-fill seenBadgeIdsRef with everything currently earned so the FIRST
    // paint after sync doesn't toast historic badges. Persist to localStorage.
    const earnedNow = allBadges.filter((bp) => bp.earned).map((bp) => bp.badge.id);
    earnedNow.forEach((id) => seenBadgeIdsRef.current.add(id));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seenBadgeIdsRef.current)));
      } catch {
        // localStorage full / disabled — silent fail, worst case we re-toast.
      }
    }
  }, [allBadges]);

  // ── Level-up listener ───────────────────────────────────────
  useEffect(() => {
    if (!showLevelUp) return;
    const key = showLevelUp.newLevel;
    if (enqueuedLevelRef.current.has(key)) return;
    enqueuedLevelRef.current.add(key);

    enqueueToast({
      type: "level-up",
      title: `Niveau ${showLevelUp.newLevel} atteint !`,
      body: showLevelUp.newTitle,
      icon: "\u{1F389}",
      duration: 4000,
      meta: { perks: showLevelUp.rewards },
    });

    // The hook's own state lives until the consumer dismisses it; clear it
    // immediately because the toast now owns the visibility lifecycle.
    dismissLevelUp();
  }, [showLevelUp, enqueueToast, dismissLevelUp]);

  // ── Badge unlock listener ───────────────────────────────────
  useEffect(() => {
    if (!hasSyncedRef.current) return;
    const seen = seenBadgeIdsRef.current;
    let mutated = false;

    for (const bp of allBadges) {
      if (!bp.earned) continue;
      if (seen.has(bp.badge.id)) continue;
      if (enqueuedBadgeRef.current.has(bp.badge.id)) continue;

      enqueuedBadgeRef.current.add(bp.badge.id);
      seen.add(bp.badge.id);
      mutated = true;

      enqueueToast({
        type: "badge-unlock",
        title: `Badge débloqué : ${bp.badge.name}`,
        body: `+${bp.badge.xp} XP`,
        icon: bp.badge.emoji,
        duration: 3000,
      });
    }

    // Persist any newly-toasted badges so future sessions skip them too.
    if (mutated && typeof window !== "undefined") {
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
      } catch {
        // ignore quota errors
      }
    }
  }, [allBadges, enqueueToast]);

  // ── Auto-dismiss timer for the current toast ────────────────
  useEffect(() => {
    if (!current) return;
    const ms = current.duration ?? (current.type === "level-up" ? 4000 : 3000);
    const timer = setTimeout(dismiss, ms);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  return (
    <div
      // Sit above modal/SOS/toast tiers but below cinematic (debug=9999).
      // toast token is 950, cinematic-tier modals (MatchCinematic) own 9999.
      // We use 951 so we sit just above the standard ToastProvider but stay
      // beneath the SOS-confirmation toast emitted from there.
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 flex flex-col items-center gap-2 px-4"
      style={{ zIndex: zIndex.toast + 1 }}
    >
      <AnimatePresence mode="popLayout">
        {current ? (
          <div key={current.id} className="pointer-events-auto w-full flex justify-center">
            {current.type === "level-up" ? (
              <LevelUpCard
                toast={current}
                onDismiss={dismiss}
                reducedMotion={reducedMotion}
              />
            ) : (
              <BadgeUnlockCard
                toast={current}
                onDismiss={dismiss}
                reducedMotion={reducedMotion}
              />
            )}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

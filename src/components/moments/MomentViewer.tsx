"use client";

/**
 * MomentViewer — full-screen story-style viewer for 24h moments.
 *
 * Behaviour
 * ─────────
 * - Renders one photo at a time. Tap right edge → next, tap left edge
 *   → previous. Auto-advances after `AUTO_ADVANCE_MS` (6s).
 * - When the last moment of a group finishes, the viewer either
 *   advances to the next group (if `groups` has more) or closes.
 * - A countdown bar at the top shows the remaining 24h window for
 *   the active moment. (Distinct from the auto-advance progress bar
 *   above the photo — that one is per-moment, the 24h bar is for
 *   "how much time before this moment disappears".)
 * - Pressing Escape closes. Tapping the X icon closes.
 *
 * Implementation notes
 * ────────────────────
 * - Auto-advance uses a single `setInterval` timer that is reset on
 *   every navigation. We do NOT use one timer per moment — that would
 *   leak on rapid taps.
 * - The 24h countdown bar reads `expiresAt - postedAt = 24h` so we
 *   compute remaining as `expiresAt - now`. The width animates with
 *   CSS transition only (no per-frame motion update — that would burn
 *   battery for what is essentially a once-a-second visual).
 * - The overlay is a portal-free fixed div on top of the chat page;
 *   we don't need a portal because the parent is already a top-level
 *   client component and z-index 50 is above bottom nav (40).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "motion/react";
import { X } from "@/components/ui/lucide";
import type { MomentGroup, MomentItem } from "@/lib/useMoments";
import { markMomentSeen } from "./MomentRing";

const AUTO_ADVANCE_MS = 6_000;
/** 24h in ms — used to scale the expiry bar width */
const MOMENT_TTL_MS = 24 * 60 * 60 * 1000;

interface MomentViewerProps {
  /** All groups available — viewer can advance across groups */
  groups: MomentGroup[];
  /** Index of the group to start from */
  startGroupIndex: number;
  /** Close handler */
  onClose: () => void;
  /** Optional: ability to delete the active moment (own moments only) */
  onDelete?: (moment: MomentItem) => Promise<boolean> | boolean;
}

function formatRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expiré";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 1) {
    return `${hours}h${String(minutes).padStart(2, "0")}`;
  }
  return `${minutes} min`;
}

export function MomentViewer({
  groups,
  startGroupIndex,
  onClose,
  onDelete,
}: MomentViewerProps) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [momentIdx, setMomentIdx] = useState(0);
  const [tickNow, setTickNow] = useState(Date.now());

  const group = groups[groupIdx];
  const moment: MomentItem | undefined = group?.moments[momentIdx];

  // ─── Mark as seen when the group finishes mounting ────────────────
  // We mark on every navigation to a fresh group so the ring updates
  // even if the viewer is closed mid-group.
  useEffect(() => {
    if (group) markMomentSeen(group);
  }, [group?.userId, group]);

  // ─── Auto-advance timer ────────────────────────────────────────────
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─── Navigation helpers ────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!group) {
      onClose();
      return;
    }
    if (momentIdx + 1 < group.moments.length) {
      setMomentIdx((i) => i + 1);
      return;
    }
    if (groupIdx + 1 < groups.length) {
      setGroupIdx((i) => i + 1);
      setMomentIdx(0);
      return;
    }
    onClose();
  }, [group, groupIdx, groups.length, momentIdx, onClose]);

  const goPrev = useCallback(() => {
    if (momentIdx > 0) {
      setMomentIdx((i) => i - 1);
      return;
    }
    if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx((i) => i - 1);
      setMomentIdx(prevGroup.moments.length - 1);
      return;
    }
    // Already at the very start — keep showing the first moment.
  }, [groupIdx, groups, momentIdx]);

  // Restart auto-advance when the active moment changes.
  useEffect(() => {
    clearTimer();
    if (!moment) return;
    timerRef.current = window.setTimeout(() => {
      goNext();
    }, AUTO_ADVANCE_MS);
    return clearTimer;
  }, [moment?.id, goNext, clearTimer, moment]);

  // ─── 1s tick to refresh the countdown bar ──────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => setTickNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  // ─── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  // ─── Lock body scroll while the viewer is open ─────────────────────
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // ─── 24h expiry bar width ──────────────────────────────────────────
  const expiryPct = useMemo(() => {
    if (!moment) return 0;
    const expiresMs = new Date(moment.expiresAt).getTime();
    const remaining = Math.max(0, expiresMs - tickNow);
    return Math.min(100, (remaining / MOMENT_TTL_MS) * 100);
  }, [moment, tickNow]);

  if (!moment) return null;

  const remainingLabel = formatRemaining(moment.expiresAt);
  const ownerName = moment.user.name ?? "Match";

  return (
    <AnimatePresence>
      <m.div
        key="moment-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={`Moment de ${ownerName}`}
      >
        {/* Top: per-moment progress bars (one per moment in the group) */}
        <div className="absolute top-2 left-3 right-3 flex gap-1 z-10">
          {group.moments.map((_, i) => {
            const isActive = i === momentIdx;
            const isPast = i < momentIdx;
            return (
              <div
                key={i}
                className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
              >
                <m.div
                  className="h-full bg-white"
                  initial={{ width: isPast ? "100%" : "0%" }}
                  animate={{
                    width: isActive ? "100%" : isPast ? "100%" : "0%",
                  }}
                  transition={{
                    duration: isActive ? AUTO_ADVANCE_MS / 1000 : 0,
                    ease: "linear",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Top header: avatar + name + countdown + close */}
        <div className="absolute top-6 left-3 right-3 flex items-center gap-3 z-10 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {moment.user.avatarUrl ? (
              <Image
                src={moment.user.avatarUrl}
                alt={ownerName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center text-[12px] font-bold text-white">
                {ownerName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[13px] font-semibold text-white">
              {ownerName}
            </span>
            <span className="text-[11px] text-white/70">{remainingLabel}</span>
          </div>

          <div className="flex-1" />

          {onDelete && (
            <button
              type="button"
              onClick={async () => {
                const ok = await onDelete(moment);
                if (ok) onClose();
              }}
              className="pointer-events-auto text-[11px] text-white/80 hover:text-white px-2 py-1"
            >
              Supprimer
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="pointer-events-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* 24h expiry bar — thin sliver beneath the per-moment bars */}
        <div className="absolute top-[18px] left-3 right-3 h-[2px] bg-white/15 rounded-full overflow-hidden z-10">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${expiryPct}%` }}
          />
        </div>

        {/* Photo — clamps to viewport with object-contain so portrait
            phone shots display fully without cropping. */}
        <div className="relative w-full h-full flex items-center justify-center">
          {moment.mediaUrl ? (
            <Image
              src={moment.mediaUrl}
              alt={moment.caption ?? `Moment de ${ownerName}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              unoptimized
            />
          ) : (
            <div className="text-white/60 text-sm">Photo indisponible</div>
          )}
        </div>

        {/* Caption pill — anchored above the safe-area inset */}
        {moment.caption && (
          <div className="absolute bottom-12 left-3 right-3 flex justify-center pointer-events-none">
            <div className="max-w-md w-full bg-black/40 backdrop-blur-md text-white text-[14px] font-medium px-4 py-3 rounded-2xl text-center">
              {moment.caption}
            </div>
          </div>
        )}

        {/* Tap zones — left third = prev, right two-thirds = next */}
        <button
          type="button"
          aria-label="Moment précédent"
          onClick={goPrev}
          className="absolute inset-y-0 left-0 w-1/3 z-0 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Moment suivant"
          onClick={goNext}
          className="absolute inset-y-0 right-0 w-2/3 z-0 focus:outline-none"
        />
      </m.div>
    </AnimatePresence>
  );
}

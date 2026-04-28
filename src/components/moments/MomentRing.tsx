"use client";

/**
 * MomentRing — circular avatar with a purple→pink gradient ring used
 * to indicate a matched user has an active 24h moment to view.
 *
 * Design
 * ──────
 * - 64×64 avatar (matches the existing MatchBubble in /chat). The
 *   gradient ring is drawn by stacking a `padding-box`/`border-box`
 *   layered background — that gives a crisp gradient on the rim
 *   without paying for an SVG conic gradient on every row.
 * - Two visual states:
 *     * `seen`  → ring is the standard accent color (already viewed)
 *     * unseen  → animated rotating gradient ring
 *   The "seen" tracking is local-storage based for now (no DB column);
 *   tapping the ring marks it as seen.
 * - Avatar fallback: gradient + first letter, mirroring MatchBubble.
 *
 * Accessibility
 * ─────────────
 * - Tappable role="button" with a French aria-label that reflects the
 *   moment count ("Voir 2 moments de Léa").
 * - Reduces motion when prefers-reduced-motion is set (the ring stops
 *   animating; presence is conveyed by a slightly thicker stroke).
 */

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { m } from "motion/react";
import type { MomentGroup } from "@/lib/useMoments";

const SEEN_KEY_PREFIX = "cesoir.momentSeen.";

interface MomentRingProps {
  group: MomentGroup;
  /** Tap handler — open the viewer */
  onOpen: (group: MomentGroup) => void;
  /** Optional override for "is the current user the owner" */
  isOwn?: boolean;
}

function isMomentSeen(group: MomentGroup): boolean {
  if (typeof window === "undefined") return false;
  try {
    const seenIso = window.localStorage.getItem(
      `${SEEN_KEY_PREFIX}${group.userId}`,
    );
    if (!seenIso) return false;
    return seenIso >= group.latestPostedAt;
  } catch {
    return false;
  }
}

export function markMomentSeen(group: MomentGroup): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${SEEN_KEY_PREFIX}${group.userId}`,
      group.latestPostedAt,
    );
  } catch {
    // Storage quota / private mode — no-op.
  }
}

export function MomentRing({ group, onOpen, isOwn = false }: MomentRingProps) {
  const seen = useMemo(() => (isOwn ? true : isMomentSeen(group)), [group, isOwn]);

  const handleClick = useCallback(() => {
    onOpen(group);
  }, [group, onOpen]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen(group);
      }
    },
    [group, onOpen],
  );

  const name = group.user.name ?? "Match";
  const initial = name.charAt(0).toUpperCase();
  const avatar = group.user.avatarUrl;
  const count = group.moments.length;

  const aria = isOwn
    ? "Voir ton moment"
    : count > 1
      ? `Voir ${count} moments de ${name}`
      : `Voir le moment de ${name}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-label={aria}
      className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
    >
      <div className="relative">
        {/* Animated gradient ring (unseen) — rotates slowly. The motion
            transition is gated by the `seen` flag so already-watched
            rings stop spinning + go monochrome accent. */}
        {!seen ? (
          <m.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full p-[3px]"
            style={{
              background:
                "conic-gradient(from 0deg, #8B5CF6, #EC4899, #F472B6, #8B5CF6)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full p-[2px] bg-accent/70"
          />
        )}

        {/* White ring — provides the gap between gradient and photo.
            Without this the gradient bleeds straight into the avatar
            and looks like a one-pixel halo. */}
        <div className="absolute inset-[2px] rounded-full bg-bg" />

        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-border/30">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: "var(--color-accent)" }}
            >
              {initial}
            </div>
          )}
        </div>

        {/* Multi-moment counter pill — only shows when >1 moment */}
        {count > 1 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
            {count}
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-text max-w-[64px] truncate">
        {isOwn ? "Toi" : name}
      </span>
    </button>
  );
}

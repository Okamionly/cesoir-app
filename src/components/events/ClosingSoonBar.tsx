"use client";

/**
 * ClosingSoonBar — urgency notification strip for the /events page.
 *
 * Renders a single-line, pulsing notification just below the page header.
 * Examples:
 *   "🔥 3 places restantes au Sancho ce soir 21h"
 *   "⚡ La Grosse Radio — derniers tickets"
 *   "✨ Soirée jazz commence dans 1h"
 *
 * Behaviour:
 * - Reads urgent events from `useClosingSoonEvents()` (3h window + spots
 *   + trending). If the hook returns 0 items, the bar renders nothing.
 * - Multiple items: rotates every 5s with a fade + slight slide transition
 *   driven by motion/react. Single item: stays put.
 * - prefers-reduced-motion: rotation is disabled, only the first item is
 *   shown, and the slide/fade is replaced by an instant swap.
 * - Dismissable: the X button stores a marker in sessionStorage so the bar
 *   stays hidden for the rest of the tab session. Page refresh in the same
 *   tab → still hidden. New tab → reappears.
 * - Tap target: anywhere on the message (not the X) navigates to the event
 *   detail page via `next/link`.
 * - A11y: `role="status" aria-live="polite"` so screen readers announce
 *   each rotation; the dismiss button has an explicit aria-label.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Flame, Sparkles, X, Zap } from "@/components/ui/lucide";
import { springs } from "@/lib/motion-design";
import {
  useClosingSoonEvents,
  type ClosingSoonItem,
  type ClosingSoonReason,
} from "@/lib/useClosingSoonEvents";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ROTATION_INTERVAL_MS = 5_000;
const SESSION_DISMISS_KEY = "cesoir:events-closing-soon-dismissed";

// ─────────────────────────────────────────────────────────────
// SessionStorage helpers — defensive against SSR + private mode.
// ─────────────────────────────────────────────────────────────

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
  } catch {
    /* private-mode quota errors — silently swallowed; bar just reappears */
  }
}

// ─────────────────────────────────────────────────────────────
// Reason → glyph + accent. The icon doubles as a visual cue for
// the reason without requiring users to read the message.
// ─────────────────────────────────────────────────────────────

function ReasonIcon({ reason }: { reason: ClosingSoonReason }) {
  if (reason === "starting_soon") {
    return <Sparkles size={14} strokeWidth={2.2} aria-hidden />;
  }
  if (reason === "almost_full") {
    return <Flame size={14} strokeWidth={2.2} aria-hidden />;
  }
  return <Zap size={14} strokeWidth={2.2} aria-hidden />;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface ClosingSoonBarProps {
  /**
   * Optional override for the rotation cadence (ms). Defaults to 5000.
   * Pass `0` (or any non-positive) to lock the bar to the first item.
   */
  rotationMs?: number;
  /** Optional className to merge with the wrapper. */
  className?: string;
}

export default function ClosingSoonBar({
  rotationMs = ROTATION_INTERVAL_MS,
  className,
}: ClosingSoonBarProps) {
  const reducedMotion = useReducedMotion();
  const { items, loading } = useClosingSoonEvents();

  // Dismissal state — initialized lazily from sessionStorage (client-only).
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const onDismiss = useCallback(() => {
    writeDismissed();
    setDismissed(true);
  }, []);

  // Rotation cursor.
  const [index, setIndex] = useState(0);

  // Reset cursor when item set changes (e.g. urgent events expire).
  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  // Auto-rotate when there are multiple items + motion is allowed.
  useEffect(() => {
    if (reducedMotion) return;
    if (items.length <= 1) return;
    if (rotationMs <= 0) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, rotationMs);
    return () => window.clearInterval(t);
  }, [items.length, rotationMs, reducedMotion]);

  // Pick the item to render. Guarded against out-of-bounds in case of races.
  const current: ClosingSoonItem | undefined = useMemo(() => {
    if (items.length === 0) return undefined;
    const safe = Math.min(index, items.length - 1);
    return items[safe];
  }, [items, index]);

  // Skip rendering entirely when there's nothing to surface or the user
  // dismissed the bar this session. Also skip while the underlying events
  // hook is loading and we have nothing yet — avoids a layout-shift flash.
  if (dismissed) return null;
  if (loading && items.length === 0) return null;
  if (!current) return null;

  const wrapperClass =
    "border-b border-accent/20 bg-accent/10 backdrop-blur-md " +
    "px-4 py-2 text-[13px] " +
    (className ?? "");

  const accentColor = "color-mix(in srgb, var(--color-accent) 92%, transparent)";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={wrapperClass}
    >
      <div className="mx-auto flex max-w-screen-md items-center gap-2">
        {/* Rotating message — the entire row (minus the X) is a tap target. */}
        <Link
          href={{ pathname: `/events/${current.event.id}` }}
          className="flex min-w-0 flex-1 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md transition-opacity active:opacity-70"
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            style={{
              color: accentColor,
              backgroundColor:
                "color-mix(in srgb, var(--color-accent) 18%, transparent)",
            }}
          >
            <ReasonIcon reason={current.reason} />
          </span>

          {/* AnimatePresence handles the in/out fade-slide between items. */}
          <span className="relative min-w-0 flex-1 overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <m.span
                key={current.event.id + ":" + current.reason}
                initial={
                  reducedMotion
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: 8 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  reducedMotion
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -8 }
                }
                transition={reducedMotion ? { duration: 0 } : springs.snap}
                className="block truncate font-medium text-text"
              >
                {current.message}
              </m.span>
            </AnimatePresence>
          </span>
        </Link>

        {/* Dismiss button — separate tap target so it doesn't compete with
            the row link. Hit area expanded with -m-1 padding trick. */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Masquer les notifications urgentes"
          className="-m-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-accent/15 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X size={14} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    </div>
  );
}

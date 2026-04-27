/**
 * Unified skeleton system — canonical source for all loading placeholders.
 *
 * Built on the global `@keyframes shimmer` in globals.css
 * (`.animate-shimmer` class). All variants share tokens and radius.
 *
 * Prefer these over ad-hoc inline skeletons. Replaces the older
 * `Skeleton.tsx` + `LoadingSkeleton.tsx` pair.
 */

import type { CSSProperties, ReactNode } from "react";

// --- Primitive building blocks ---------------------------------------------

interface SkeletonBaseProps {
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/**
 * Raw shimmer block — use only when no specialized variant fits.
 */
export function SkeletonBlock({
  className = "",
  style,
}: SkeletonBaseProps) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * 1..N shimmer lines sized for body copy.
 * The last line is shortened to feel like natural text.
 */
export function SkeletonText({
  lines = 1,
  width = "100%",
  className = "",
}: {
  lines?: number;
  width?: string | number;
  className?: string;
}) {
  if (lines === 1) {
    return (
      <div
        className={`animate-shimmer rounded h-3 ${className}`.trim()}
        style={{ width }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer rounded h-3"
          style={{ width: i === lines - 1 ? "60%" : width }}
        />
      ))}
    </div>
  );
}

/**
 * Circular avatar placeholder. `size` is a pixel value.
 */
export function SkeletonAvatar({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-shimmer rounded-full shrink-0 ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/**
 * Card container with standard border + radius. Fill with children
 * (text, avatar, etc.) or leave empty for a flat card placeholder.
 */
export function SkeletonCard({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-bg-card border border-border ${className}`.trim()}
      role="status"
      aria-label="Chargement…"
    >
      {children ?? (
        <>
          <div className="animate-shimmer aspect-[3/4] w-full" />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonAvatar size={40} />
              <div className="flex-1 space-y-2">
                <div className="animate-shimmer rounded h-4 w-3/4" />
                <div className="animate-shimmer rounded h-3 w-1/2" />
              </div>
            </div>
            <SkeletonText lines={2} />
          </div>
        </>
      )}
    </div>
  );
}

// --- Composite variants ----------------------------------------------------

/**
 * Vertical list of row-shaped shimmer blocks (e.g. chat rows,
 * notification rows, settings rows).
 */
export function SkeletonList({
  count = 3,
  itemHeight = 80,
  className = "",
}: {
  count?: number;
  itemHeight?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 ${className}`.trim()}
      role="status"
      aria-label="Chargement…"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer w-full rounded-xl"
          style={{ height: itemHeight }}
        />
      ))}
    </div>
  );
}

/**
 * Full profile-card shape (avatar + name + stats + bio + photo grid).
 */
export function SkeletonProfileCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`space-y-6 ${className}`.trim()}
      role="status"
      aria-label="Chargement du profil…"
    >
      <div className="flex flex-col items-center gap-3">
        <SkeletonAvatar size={96} />
        <div className="animate-shimmer rounded h-5 w-40" />
        <div className="animate-shimmer rounded h-3 w-24" />
      </div>
      <div className="flex justify-center gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="animate-shimmer rounded h-6 w-10" />
            <div className="animate-shimmer rounded h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="px-6">
        <SkeletonText lines={4} />
      </div>
      <div className="grid grid-cols-3 gap-1 px-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-shimmer aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * Chat conversation row — avatar + two stacked text blocks + timestamp.
 */
export function SkeletonChatRow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 ${className}`.trim()}
      role="status"
      aria-label="Chargement…"
    >
      <SkeletonAvatar size={48} />
      <div className="flex-1 space-y-2">
        <div className="animate-shimmer rounded h-4 w-1/3" />
        <div className="animate-shimmer rounded h-3 w-2/3" />
      </div>
      <div className="animate-shimmer rounded h-3 w-10" />
    </div>
  );
}

/**
 * Modes grid skeleton — matches the stacked mode-card layout in /modes.
 * Each card is a tall pill with a circular icon slot + 2 text rows.
 */
export function SkeletonModesGrid({
  count = 5,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2.5 ${className}`.trim()}
      role="status"
      aria-label="Chargement des modes…"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-border bg-bg-card p-4"
        >
          <SkeletonAvatar size={48} />
          <div className="flex-1 space-y-2">
            <div className="animate-shimmer rounded h-4 w-1/3" />
            <div className="animate-shimmer rounded h-3 w-2/3" />
          </div>
          <div className="animate-shimmer rounded h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Mode-detail skeleton — hero gradient block + count card + steps stack.
 */
export function SkeletonModeDetail({ className = "" }: { className?: string }) {
  return (
    <div
      className={`min-h-screen bg-bg ${className}`.trim()}
      role="status"
      aria-label="Chargement du mode…"
    >
      {/* Hero */}
      <div className="px-6 pt-6 pb-10 flex flex-col items-center text-center gap-3">
        <div className="animate-shimmer rounded-full h-16 w-16" />
        <div className="animate-shimmer rounded h-6 w-40" />
        <div className="animate-shimmer rounded h-3 w-64" />
      </div>
      {/* Active card */}
      <div className="px-5 pb-6">
        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <div className="animate-shimmer rounded h-4 w-1/3 mb-3" />
          <div className="flex items-center gap-3">
            <SkeletonAvatar size={44} />
            <SkeletonAvatar size={44} />
            <SkeletonAvatar size={44} />
            <div className="flex-1" />
            <div className="animate-shimmer rounded h-3 w-12" />
          </div>
        </div>
      </div>
      {/* Steps */}
      <div className="px-5 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-bg-card p-4 flex gap-4">
            <div className="animate-shimmer rounded-xl h-10 w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="animate-shimmer rounded h-4 w-1/2" />
              <div className="animate-shimmer rounded h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Event-detail skeleton — flyer banner + meta strip + tabs + body.
 */
export function SkeletonEventDetail({ className = "" }: { className?: string }) {
  return (
    <div
      className={`${className}`.trim()}
      role="status"
      aria-label="Chargement de la soirée…"
    >
      {/* Flyer */}
      <div className="animate-shimmer w-full aspect-[16/10]" />
      {/* Meta */}
      <div className="px-5 pt-4 space-y-3">
        <div className="animate-shimmer rounded h-6 w-3/4" />
        <div className="flex items-center gap-3">
          <div className="animate-shimmer rounded h-4 w-20" />
          <div className="animate-shimmer rounded h-4 w-24" />
          <div className="animate-shimmer rounded h-4 w-16" />
        </div>
        {/* RSVP row */}
        <div className="flex items-center gap-2 pt-2">
          <div className="animate-shimmer rounded-full h-9 w-24" />
          <div className="animate-shimmer rounded-full h-9 w-24" />
          <div className="animate-shimmer rounded-full h-9 w-9" />
        </div>
      </div>
      {/* Body cards */}
      <div className="px-5 mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-bg-card p-4 space-y-2">
            <div className="animate-shimmer rounded h-3 w-1/4" />
            <div className="animate-shimmer rounded h-4 w-full" />
            <div className="animate-shimmer rounded h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chat message-list skeleton — alternating left/right bubbles.
 */
export function SkeletonChatMessages({
  count = 5,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 px-4 py-4 ${className}`.trim()}
      role="status"
      aria-label="Chargement des messages…"
    >
      {Array.from({ length: count }).map((_, i) => {
        const mine = i % 2 === 1;
        const widthPct = 40 + ((i * 13) % 35); // pseudo-random 40..75%
        return (
          <div
            key={i}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className="animate-shimmer rounded-2xl"
              style={{ width: `${widthPct}%`, height: 36 + ((i * 7) % 24) }}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Full-page skeleton matching common layouts.
 *  - "list"   → stacked rows (chat, feed, notifications)
 *  - "detail" → hero avatar + stats + text block (profile, settings)
 *  - "grid"   → 2-col grid of cards (browse, discover, plans)
 */
export function SkeletonPage({
  kind,
  className = "",
}: {
  kind: "list" | "detail" | "grid";
  className?: string;
}) {
  if (kind === "list") {
    return (
      <div className={`p-4 ${className}`.trim()} role="status" aria-label="Chargement…">
        <div className="animate-shimmer rounded h-7 w-40 mb-4" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonChatRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === "grid") {
    return (
      <div className={`p-4 ${className}`.trim()} role="status" aria-label="Chargement…">
        <div className="animate-shimmer rounded h-7 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // "detail"
  return (
    <div className={`p-4 ${className}`.trim()} role="status" aria-label="Chargement…">
      <SkeletonProfileCard />
    </div>
  );
}

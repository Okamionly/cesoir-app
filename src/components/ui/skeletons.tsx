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

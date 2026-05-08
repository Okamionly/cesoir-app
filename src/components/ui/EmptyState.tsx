"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { m, useReducedMotion } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

interface EmptyStateProps {
  /** Emoji glyph (legacy). Either `emoji` or `icon` must be set. */
  emoji?: string;
  /** Custom ReactNode (icon component, SVG, etc.). Wins over `emoji` when both set. */
  icon?: ReactNode;
  /** Warm, human heading (1 line). */
  title: string;
  /** Helpful body copy explaining what to do next. */
  subtitle?: string;
  /** Optional CTA label — pair with `actionHref`. */
  actionLabel?: string;
  /** Optional CTA destination — pair with `actionLabel`. */
  actionHref?: string;
  /**
   * If true, the status region is announced politely on update.
   * Useful for empty states that appear after a fetch settles.
   */
  ariaLive?: "polite" | "off";
  /** Visual size variant — default `md`, use `sm` inside cards/sections. */
  size?: "sm" | "md";
}

/**
 * Standardised empty-state cell used across the app.
 *
 * Centred vertical layout with a gently floating glyph, warm heading and
 * an optional CTA. Float animation is automatically suppressed when the
 * user has `prefers-reduced-motion: reduce`.
 *
 * Backward compatible with the legacy `emoji` prop — pages that pass
 * `icon` get the new ReactNode rendering path (lucide / svg / etc.).
 */
export default function EmptyState({
  emoji,
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  ariaLive = "off",
  size = "md",
}: EmptyStateProps) {
  const reducedMotion = useReducedMotion();
  const padding = size === "sm" ? "py-12 px-6" : "py-20 px-6";
  const glyphSize = size === "sm" ? "text-4xl" : "text-5xl";

  // The icon prop wins over emoji so call sites can opt into ReactNode
  // glyphs without passing both.
  const glyph: ReactNode = icon ?? (emoji ? <span aria-hidden="true">{emoji}</span> : null);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${padding}`}
      role="status"
      aria-live={ariaLive}
    >
      {/* Floating glyph — float disabled under prefers-reduced-motion */}
      {glyph !== null && (
        <m.div
          className={`${glyphSize} mb-5 inline-flex items-center justify-center`}
          animate={reducedMotion ? undefined : ambient.float(5)}
        >
          {glyph}
        </m.div>
      )}

      {/* Title — text-base minimum for mobile legibility (audit D-6: text-sm
          paired with text-5xl glyph created a 3:1 ratio hurting 320px readability) */}
      <m.p
        className="text-base sm:text-lg font-bold text-text max-w-[260px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
      >
        {title}
      </m.p>

      {/* Subtitle */}
      {subtitle && (
        <m.p
          className="text-xs text-text-muted mt-1.5 max-w-[280px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          {subtitle}
        </m.p>
      )}

      {/* Optional CTA */}
      {actionLabel && actionHref && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
          className="mt-5"
        >
          <Link
            href={actionHref as Route}
            className="inline-flex items-center px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all active:scale-95"
            style={{
              background: app.gradient,
              boxShadow: "0 0 24px rgba(139,92,246,0.2)",
            }}
          >
            {actionLabel}
          </Link>
        </m.div>
      )}
    </div>
  );
}

"use client";

import { m } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";

interface ErrorStateProps {
  /**
   * Emoji or short symbol shown above the title. Defaults to a universal
   * warning glyph.
   */
  emoji?: string;
  title: string;
  description?: string;
  /**
   * When provided, renders a primary retry button wired to this handler.
   */
  onRetry?: () => void;
  /**
   * Label for the retry button. Defaults to "Réessaye".
   */
  retryLabel?: string;
  className?: string;
}

/**
 * Companion to <EmptyState> for failed data loads. Provides a consistent
 * look across the app so we no longer alternate between inline red banners,
 * silent fails and `alert()` calls (flagged in the UI audit).
 */
export default function ErrorState({
  emoji = "⚠️",
  title,
  description,
  onRetry,
  retryLabel = "Réessaye",
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`.trim()}
    >
      <m.div
        className="text-5xl mb-5"
        animate={ambient.float(4)}
        aria-hidden="true"
      >
        {emoji}
      </m.div>

      <m.p
        className="text-sm font-bold text-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
      >
        {title}
      </m.p>

      {description && (
        <m.p
          className="text-xs text-text-muted mt-2 max-w-[280px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          {description}
        </m.p>
      )}

      {onRetry && (
        <m.button
          type="button"
          onClick={onRetry}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
          whileTap={{ scale: 0.96 }}
          className="mt-5 inline-flex items-center px-5 py-2 rounded-full text-[13px] font-semibold text-bg bg-text active:opacity-90 transition-opacity"
        >
          {retryLabel}
        </m.button>
      )}
    </div>
  );
}

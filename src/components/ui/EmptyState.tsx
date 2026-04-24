"use client";

import Link from "next/link";
import type { Route } from "next";
import { m } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      role="status"
    >
      {/* Floating emoji */}
      <m.div
        className="text-5xl mb-5"
        animate={ambient.float(5)}
      >
        {emoji}
      </m.div>

      {/* Title */}
      <m.p
        className="text-sm font-bold text-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
      >
        {title}
      </m.p>

      {/* Subtitle */}
      {subtitle && (
        <m.p
          className="text-xs text-text-muted mt-1.5 max-w-[260px]"
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

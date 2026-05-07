"use client";

/**
 * Authenticated segment error boundary.
 *
 * Scope: catches errors inside `/app/(app)/*` (feed, browse, chat, profile,
 * matches, etc.). Inherits the (app) layout, so AppShell + BottomNav remain
 * reachable around this fallback — the user can still tap to feed/matches
 * without a hard reload.
 *
 * Visual: White Fluo Minimal palette to match post-login surfaces.
 */

import Link from "next/link";
import { useEffect } from "react";
import { m } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";
import { logger } from "@/lib/logger";

export default function AppSegmentError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error("error_boundary_app_segment", {
      message: error.message,
      name: error.name,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div
      className="min-h-[calc(100dvh-120px)] bg-bg text-text flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      role="alert"
      aria-live="polite"
    >
      {/* Soft halos — subtle in white-fluo aesthetic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <m.div
          className="absolute w-[280px] h-[280px] rounded-full opacity-[0.10] blur-[100px] top-12 -right-12"
          style={{ backgroundColor: app.violet }}
          animate={ambient.float(9)}
        />
        <m.div
          className="absolute w-[220px] h-[220px] rounded-full opacity-[0.08] blur-[90px] -bottom-8 -left-12"
          style={{ backgroundColor: app.vert }}
          animate={ambient.float(11)}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm">
        <m.span
          className="text-6xl mb-5"
          aria-hidden="true"
          initial={{ rotate: -6, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={springs.elastic}
          style={{
            color: app.violet,
            filter: "drop-shadow(0 0 24px rgba(139,92,246,0.35))",
          }}
        >
          ☾
        </m.span>

        <m.h1
          className="text-2xl sm:text-3xl font-black tracking-tight mb-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.1 }}
        >
          Quelque chose a coince
        </m.h1>

        <m.p
          className="text-[14px] text-text-muted font-light mb-7 leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          Pas de panique. Reessaie cette page ou continue ta soiree ailleurs
          dans l&apos;app.
        </m.p>

        <m.div
          className="flex flex-col items-center gap-3 w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
        >
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="w-full px-8 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all active:scale-95"
            style={{
              background: app.gradient,
              boxShadow: "0 0 32px rgba(139,92,246,0.25)",
            }}
          >
            Reessayer
          </button>

          <Link
            href="/feed"
            className="w-full px-8 py-3.5 rounded-full text-[14px] font-medium text-text border border-border hover:bg-bg-card transition-colors"
            style={{ borderColor: app.border }}
          >
            Retour au feed
          </Link>

          <Link
            href="/help"
            className="text-xs text-text-muted hover:text-text transition-colors underline underline-offset-4 mt-1"
          >
            Signaler le probleme
          </Link>
        </m.div>

        {error.digest ? (
          <p className="mt-6 text-[10px] text-text-muted/60 font-mono select-all">
            ref: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}

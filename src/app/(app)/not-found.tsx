"use client";

/**
 * 404 inside the authenticated segment.
 *
 * Renders BELOW the (app) layout so AppShell + BottomNav are still reachable.
 * Visual: White Fluo Minimal — distinct from the dark root not-found.tsx
 * (which serves landing/auth/venues 404s).
 */

import Link from "next/link";
import { m } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

export default function AppNotFound() {
  return (
    <div
      className="min-h-[calc(100dvh-120px)] bg-bg text-text flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <m.div
          className="absolute w-[280px] h-[280px] rounded-full opacity-[0.10] blur-[100px] top-10 -right-12"
          style={{ backgroundColor: app.violet }}
          animate={ambient.float(8)}
        />
        <m.div
          className="absolute w-[220px] h-[220px] rounded-full opacity-[0.08] blur-[90px] -bottom-8 -left-10"
          style={{ backgroundColor: app.vert }}
          animate={ambient.float(11)}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm">
        <m.span
          className="text-6xl mb-4"
          aria-hidden="true"
          animate={ambient.float(7)}
          style={{
            color: app.violet,
            filter: "drop-shadow(0 0 28px rgba(139,92,246,0.4))",
          }}
        >
          ☾
        </m.span>

        <m.h1
          className="text-[88px] sm:text-[104px] font-black tracking-tighter leading-none mb-2"
          style={{
            background: app.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          initial={{ scale: 2.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.rubber}
        >
          404
        </m.h1>

        <m.p
          className="text-[15px] text-text-muted font-light mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          Cette soiree n&apos;existe pas. Mais d&apos;autres se preparent ailleurs.
        </m.p>

        <m.div
          className="flex flex-col items-center gap-3 w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
        >
          <Link
            href="/feed"
            className="w-full px-8 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all active:scale-95 text-center"
            style={{
              background: app.gradient,
              boxShadow: "0 0 32px rgba(139,92,246,0.25)",
            }}
          >
            Retour au feed
          </Link>

          <Link
            href="/browse"
            className="text-sm text-text-muted hover:text-text transition-colors underline underline-offset-4"
          >
            Explorer les profils
          </Link>
        </m.div>
      </div>
    </div>
  );
}

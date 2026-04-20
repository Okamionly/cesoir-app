"use client";

import { m } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

/**
 * Dedicated offline fallback page.
 *
 * Before Wave 12 the SW's offline fallback returned "/" (landing), which
 * leaked logged-in UI to offline users and broke auth redirects. The SW
 * now precaches and serves this page instead.
 *
 * Kept intentionally self-contained (no external data deps) so it can be
 * served purely from CacheStorage.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <m.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[120px] -top-20 -right-20"
          style={{ backgroundColor: app.violet }}
          animate={ambient.float(8)}
        />
        <m.div
          className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-[100px] -bottom-16 -left-20"
          style={{ backgroundColor: app.vert }}
          animate={ambient.float(10)}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Moon floating */}
        <m.span
          className="text-7xl mb-6 drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]"
          animate={ambient.float(6)}
          aria-hidden="true"
        >
          ☾
        </m.span>

        <m.h1
          className="font-display text-[32px] sm:text-[40px] font-bold tracking-tight mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
        >
          Pas de reseau
        </m.h1>

        <m.p
          className="text-[16px] sm:text-[18px] text-white/60 font-light mb-10 max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.15 }}
        >
          Reviens des que tu as une connexion&nbsp;&mdash; tes matchs t&apos;attendent.
        </m.p>

        <m.button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          className="px-8 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all active:scale-95"
          style={{
            background: app.gradient,
            boxShadow: "0 0 40px rgba(139,92,246,0.3)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
        >
          Reessayer
        </m.button>
      </div>
    </div>
  );
}

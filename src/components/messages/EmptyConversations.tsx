"use client";

import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

/**
 * Cinematic empty-state for the conversation list.
 * Ambient floating moon + headline + CTA to /browse.
 * Gated on reduced-motion for the loop animations.
 */
export function EmptyConversations() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      role="status"
    >
      {/* Glow aura */}
      <div className="relative mb-6">
        <m.div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.35), transparent 70%)",
            filter: "blur(28px)",
          }}
          animate={
            reducedMotion
              ? undefined
              : {
                  opacity: [0.4, 0.8, 0.4],
                  scale: [0.9, 1.1, 0.9],
                }
          }
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating moon emoji */}
        <m.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,255,136,0.08))",
            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 24%, transparent)",
          }}
          animate={reducedMotion ? undefined : ambient.float(6)}
        >
          {"\u263E"}
        </m.div>
      </div>

      <m.h2
        className="text-[17px] font-bold text-text mb-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.1 }}
      >
        Pas encore de conversation
      </m.h2>

      <m.p
        className="text-[13px] text-text-muted max-w-[280px] leading-relaxed mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.2 }}
      >
        Le silence avant la magie. Decouvre des profils et commence
        ta premiere conversation CeSoir.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.3 }}
      >
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-white transition-all active:scale-95 tap-target"
          style={{
            background: app.gradient,
            boxShadow:
              "0 10px 30px color-mix(in srgb, var(--color-accent) 28%, transparent)",
          }}
        >
          Decouvrir des profils
          <span aria-hidden="true">{"\u2192"}</span>
        </Link>
      </m.div>

      <m.p
        className="text-[11px] text-text-muted mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        Astuce : active la localisation pour matcher en 2 min
      </m.p>
    </div>
  );
}

export default EmptyConversations;

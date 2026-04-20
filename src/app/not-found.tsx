"use client";

import Link from "next/link";
import { m } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

export default function NotFound() {
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
        <m.div
          className="absolute w-[200px] h-[200px] rounded-full opacity-10 blur-[80px] top-1/2 left-1/4"
          style={{ backgroundColor: app.violet }}
          animate={ambient.float(12)}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Moon floating */}
        <m.span
          className="text-7xl mb-6 drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]"
          animate={ambient.float(6)}
        >
          ☾
        </m.span>

        {/* 404 — scales from 3 with rubber spring */}
        <m.h1
          className="text-[120px] font-black tracking-tighter leading-none mb-4"
          style={{
            background: app.gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.rubber}
        >
          404
        </m.h1>

        {/* Subtitle */}
        <m.p
          className="text-[16px] sm:text-[18px] text-white/50 font-light mb-10 max-w-xs leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          Cette page n&apos;existe pas
        </m.p>

        {/* CTA buttons — staggered entrance */}
        <m.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.35 }}
        >
          <Link
            href="/"
            className="px-8 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all active:scale-95"
            style={{
              background: app.gradient,
              boxShadow: "0 0 40px rgba(139,92,246,0.3)",
            }}
          >
            Retourner a l&apos;accueil
          </Link>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...springs.gentle, delay: 0.5 }}
          >
            <Link
              href="/browse"
              className="text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
            >
              Explorer les profils
            </Link>
          </m.div>
        </m.div>
      </div>
    </div>
  );
}

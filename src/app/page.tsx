"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springs, ambient, easings } from "@/lib/motion-design";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden" style={{ backgroundColor: "#000000" }}>

      {/* ═══════════════════════════════════════════
          SECTION 1 — Phone mockup + CeSoir logo
          First thing the user sees
      ═══════════════════════════════════════════ */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6">
        {/* Background glow behind phone */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[120px]"
            style={{
              background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            animate={ambient.float(12)}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[120px]"
            style={{
              background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
              bottom: "10%",
              left: "30%",
            }}
            animate={ambient.float(10)}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Moon */}
          <motion.span
            className="text-[60px] mb-6 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, ...ambient.float(6) }}
            transition={springs.elastic}
            aria-hidden="true"
          >
            &#9790;
          </motion.span>

          {/* Logo */}
          <motion.h1
            className="text-[60px] sm:text-[80px] font-black tracking-tighter leading-none mb-4"
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={springs.cinematic}
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CeSoir
          </motion.h1>

          <motion.p
            className="text-[16px] text-white/50 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Trouve quelqu&apos;un. <span className="text-white font-medium">Ce soir.</span>
          </motion.p>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.heavy, delay: 0.3 }}
          >
            <motion.div
              animate={ambient.float(7)}
              className="relative mx-auto"
              style={{ width: 240, height: 480, perspective: 800 }}
            >
              {/* iPhone frame */}
              <div className="absolute inset-0 rounded-[40px] border-[3px] border-white/15 bg-black/90 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-b-2xl z-10" />
                {/* Screen */}
                <div className="absolute inset-[3px] rounded-[37px] overflow-hidden bg-[#0A0A0A]">
                  {/* Mini header */}
                  <div className="px-4 pt-8 pb-2 flex items-center gap-2">
                    <span className="text-[11px] text-[#8B5CF6]">&#9790;</span>
                    <span className="text-[10px] font-bold text-white/90">CeSoir</span>
                  </div>
                  {/* Mode pills */}
                  <div className="px-3 flex gap-1 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[7px] font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">Solo Diner</span>
                    <span className="px-2 py-0.5 rounded-full text-[7px] font-semibold bg-white/5 text-white/40 border border-white/10">Night Owl</span>
                    <span className="px-2 py-0.5 rounded-full text-[7px] font-semibold bg-white/5 text-white/40 border border-white/10">Langues</span>
                  </div>
                  {/* Profile cards */}
                  <div className="px-3 space-y-2">
                    {[
                      { name: "Marie, 26", mode: "Solo Diner", dist: "0.8 km", color: "#8B5CF6" },
                      { name: "Lucas, 31", mode: "Night Owl", dist: "1.2 km", color: "#6366F1" },
                      { name: "Amina, 24", mode: "Langues", dist: "2.1 km", color: "#06B6D4" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02]">
                        <div className="w-8 h-8 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-bold text-white/90 truncate">{p.name}</p>
                          <p className="text-[6px] text-white/40">{p.mode} · {p.dist}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}>
                          ♥
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom nav */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t border-white/5 bg-black/80 flex justify-around">
                    {["☾", "📍", "💬", "👤"].map((icon, i) => (
                      <span key={i} className={`text-[10px] ${i === 0 ? "text-[#8B5CF6]" : "text-white/30"}`}>{icon}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA under phone */}
          <motion.div
            className="flex flex-col items-center mt-10 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: easings.out }}
          >
            <Link href="/register">
              <motion.span
                className="inline-block px-10 py-4 rounded-full text-[16px] font-semibold text-white cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  boxShadow: "0 0 40px rgba(0,255,136,0.2)",
                }}
                whileHover={{ y: -3, boxShadow: "0 8px 40px rgba(0,255,136,0.35)" }}
                whileTap={{ scale: 0.95 }}
                transition={springs.snap}
              >
                Commencer
              </motion.span>
            </Link>

            <Link href="/browse">
              <motion.span
                className="text-[14px] text-white/40 hover:text-white/60 transition-colors py-2 cursor-pointer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Explorer les profils →
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.span
            className="text-white/40 text-sm"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.span>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — LE CONCEPT
          "Pas demain. Maintenant."
      ═══════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={springs.cinematic}
        >
          <p className="text-[13px] text-[#8B5CF6] uppercase tracking-[0.3em] font-bold mb-8">
            Le concept
          </p>
          <h2 className="text-[36px] sm:text-[48px] md:text-[56px] font-black leading-[1.15] mb-8 max-w-xl">
            Pas demain.
            <br />
            Pas la semaine
            <br />
            prochaine.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Maintenant.
            </span>
          </h2>
          <motion.p
            className="text-[15px] sm:text-[16px] text-white/40 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease: easings.out }}
          >
            CeSoir te connecte avec des gens pres de toi, disponibles ce
            soir. 14 modes de rencontre. 100% gratuit.
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — "Ce soir, c'est ton soir."
          Final CTA
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[150px]"
            style={{
              background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={ambient.float(10)}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[120px]"
            style={{
              background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
              top: "20%",
              right: "-10%",
            }}
            animate={ambient.float(12)}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
          <motion.h2
            className="text-[42px] sm:text-[56px] md:text-[64px] font-black leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={springs.cinematic}
          >
            Ce soir, c&apos;est{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ton
            </span>{" "}
            soir.
          </motion.h2>

          <motion.p
            className="text-[16px] sm:text-[18px] text-white/50 font-light tracking-wide mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: easings.out }}
          >
            Gratuit. Sans pub. Sans paywall.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease: easings.out }}
          >
            <Link href="/register">
              <motion.span
                className="inline-block px-12 py-4 rounded-full text-[17px] font-semibold text-white cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  boxShadow: "0 0 50px rgba(0,255,136,0.2)",
                }}
                whileHover={{
                  y: -3,
                  boxShadow: "0 8px 50px rgba(0,255,136,0.35)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={springs.snap}
              >
                Commencer maintenant
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Footer logo */}
        <motion.div
          className="absolute bottom-8 flex items-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <span className="text-lg text-[#8B5CF6]">&#9790;</span>
          <span className="text-[15px] font-bold text-white/80">CeSoir</span>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER — minimal
      ═══════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/about" className="text-[12px] text-white/40 hover:text-white/60 transition-colors py-1">A propos</Link>
          <Link href="/safety" className="text-[12px] text-white/40 hover:text-white/60 transition-colors py-1">Securite</Link>
          <Link href="/cgu" className="text-[12px] text-white/40 hover:text-white/60 transition-colors py-1">CGU</Link>
          <Link href="/privacy" className="text-[12px] text-white/40 hover:text-white/60 transition-colors py-1">Confidentialite</Link>
        </div>
        <p className="text-[11px] text-white/30">&copy; 2026 CeSoir. Tous droits reserves.</p>
      </footer>
    </div>
  );
}

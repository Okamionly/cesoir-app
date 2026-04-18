"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springs, easings } from "@/lib/motion-design";
import PlasmaOcean from "@/components/landing/PlasmaOcean";
import MoonHero from "@/components/landing/MoonHero";
import PhoneVideo from "@/components/landing/PhoneVideo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0D] text-white overflow-x-hidden">
      {/* ═══════════════════════════════════════════
          HERO — Plasma + Moon + Title only. Sobre.
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col">
        {/* Plasma Ocean background */}
        <div className="absolute inset-0 overflow-hidden">
          <PlasmaOcean palette="cesoir" speed={0.5} opacity={0.45} />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10,10,13,0.1) 0%, rgba(10,10,13,0.6) 100%)",
            }}
          />
        </div>

        {/* Top nav — minimal */}
        <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 pt-6">
          <div className="flex items-center gap-2">
            <span className="text-[22px] text-[#8B5CF6] drop-shadow-[0_0_16px_rgba(139,92,246,0.7)]">
              &#9790;
            </span>
            <span className="font-display text-[17px] font-black tracking-tight">
              CeSoir
            </span>
          </div>
          <Link href="/login">
            <span className="text-[13px] text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/15 hover:border-white/40 cursor-pointer inline-block">
              Se connecter
            </span>
          </Link>
        </nav>

        {/* Hero content — centered, moon + title */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springs.cinematic }}
            className="mb-10 sm:mb-14"
          >
            <MoonHero size={200} />
          </motion.div>

          <motion.h1
            className="font-display text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] font-black leading-[0.95] tracking-tight text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: easings.out }}
          >
            Ce soir,
            <br />
            c&apos;est{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              ton
            </span>{" "}
            soir.
          </motion.h1>

          {/* Subtle scroll hint */}
          <motion.div
            className="absolute bottom-8 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <span className="text-[10px] text-white/40 uppercase tracking-[0.3em]">
              Le concept
            </span>
            <motion.span
              className="text-white/40"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              ↓
            </motion.span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          LE CONCEPT — Pas demain. Maintenant.
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* Subtle background accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, rgba(139,92,246,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(0,255,136,0.05) 0%, transparent 60%)",
          }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-2xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={springs.cinematic}
        >
          <p className="text-[11px] sm:text-[12px] text-[#8B5CF6] uppercase tracking-[0.4em] font-bold mb-10">
            Le concept
          </p>

          <h2 className="font-display text-[40px] sm:text-[56px] md:text-[72px] font-black leading-[1.05] tracking-tight mb-10">
            Pas demain.
            <br />
            Pas la semaine
            <br />
            prochaine.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontStyle: "italic",
              }}
            >
              Maintenant.
            </span>
          </h2>

          <motion.p
            className="text-[15px] sm:text-[17px] text-white/55 leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8, ease: easings.out }}
          >
            CeSoir te connecte avec des gens près de toi, disponibles
            ce soir.{" "}
            <span className="text-white font-semibold">
              14 modes de rencontre.
            </span>
          </motion.p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          PHONE VIDEO — animated app showcase
      ═══════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...springs.heavy }}
        >
          <PhoneVideo />

          <div className="mt-16 flex flex-col items-center gap-4">
            <Link href="/register">
              <motion.span
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-[16px] sm:text-[17px] font-semibold text-white cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
                  boxShadow: "0 0 60px rgba(139,92,246,0.4)",
                }}
                whileHover={{
                  y: -3,
                  boxShadow: "0 12px 80px rgba(0,255,136,0.5)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={springs.snap}
              >
                Rejoindre
                <span>→</span>
              </motion.span>
            </Link>
            <p className="text-[12px] text-white/40">
              Gratuit. 30 secondes pour créer ton compte.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER — ultra minimal
      ═══════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-lg text-[#8B5CF6]">&#9790;</span>
          <span className="text-[14px] font-bold">CeSoir</span>
        </div>
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          <Link
            href="/about"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            À propos
          </Link>
          <Link
            href="/safety"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            Sécurité
          </Link>
          <Link
            href="/cgu"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            CGU
          </Link>
          <Link
            href="/privacy"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            Confidentialité
          </Link>
        </div>
        <p className="text-[10px] text-white/25">
          &copy; 2026 CeSoir. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}

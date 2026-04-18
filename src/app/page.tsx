"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { springs, ambient, easings } from "@/lib/motion-design";
import { usePausableInterval } from "@/lib/usePausableInterval";

// ─────────────────────────────────────────
// Hero-local helpers (countdown + social)
// ─────────────────────────────────────────
function getTimeUntil20h() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0);
  if (now.getHours() >= 20 || now.getHours() < 5) return null;
  const diff = target.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function useSlowlyIncrementingCount(seed: number, intervalMs = 7000) {
  const [count, setCount] = useState(seed);
  usePausableInterval(() => setCount((c) => c + 1), intervalMs);
  return count;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* ═══════════════════════════════════════════
          HERO — dark fluo, 3 ambient blobs, countdown
      ═══════════════════════════════════════════ */}
      <Hero />

      {/* ═══════════════════════════════════════════
          LE CONCEPT — "Pas demain. Maintenant."
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
          <h2 className="font-display text-[36px] sm:text-[48px] md:text-[56px] font-black leading-[1.15] mb-8 max-w-xl">
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
          PHONE MOCKUP — app preview
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 flex flex-col items-center px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-[120px]"
            style={{
              background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </div>

        <motion.span
          className="text-[60px] mb-6 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
          animate={ambient.float(6)}
          aria-hidden="true"
        >
          &#9790;
        </motion.span>

        <motion.h2
          className="font-display text-[60px] sm:text-[80px] font-black tracking-tighter leading-none mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springs.cinematic}
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CeSoir
        </motion.h2>

        <motion.p
          className="text-[16px] text-white/50 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Trouve quelqu&apos;un. <span className="text-white font-medium">Ce soir.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          <motion.div
            animate={ambient.float(7)}
            className="relative mx-auto"
            style={{ width: 240, height: 480, perspective: 800 }}
          >
            <div className="absolute inset-0 rounded-[40px] border-[3px] border-white/15 bg-black/90 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-b-2xl z-10" />
              <div className="absolute inset-[3px] rounded-[37px] overflow-hidden bg-[#0A0A0A]">
                <div className="px-4 pt-8 pb-2 flex items-center gap-2">
                  <span className="text-[11px] text-[#8B5CF6]">&#9790;</span>
                  <span className="text-[10px] font-bold text-white/90">CeSoir</span>
                </div>
                <div className="px-3 flex gap-1 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[7px] font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">Solo Diner</span>
                  <span className="px-2 py-0.5 rounded-full text-[7px] font-semibold bg-white/5 text-white/40 border border-white/10">Night Owl</span>
                  <span className="px-2 py-0.5 rounded-full text-[7px] font-semibold bg-white/5 text-white/40 border border-white/10">Langues</span>
                </div>
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
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t border-white/5 bg-black/80 flex justify-around">
                  {["☾", "📍", "💬", "👤"].map((icon, i) => (
                    <span key={i} className={`text-[10px] ${i === 0 ? "text-[#8B5CF6]" : "text-white/30"}`}>{icon}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center mt-10 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6, ease: easings.out }}
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
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER — minimal
      ═══════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-lg text-[#8B5CF6]">&#9790;</span>
          <span className="text-[15px] font-bold">CeSoir</span>
        </div>
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

// ═══════════════════════════════════════════
// HERO COMPONENT — extracted for clarity
// ═══════════════════════════════════════════
function Hero() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<ReturnType<typeof getTimeUntil20h>>(null);
  const [liveCount, setLiveCount] = useState(23);
  const mentionsThisMonth = useSlowlyIncrementingCount(2847, 9000);

  // Compute time only on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setTime(getTimeUntil20h());
  }, []);

  usePausableInterval(() => setTime(getTimeUntil20h()), 1000);
  usePausableInterval(
    () => setLiveCount((c) => Math.max(12, Math.min(38, c + (Math.random() > 0.5 ? 1 : -1)))),
    6000
  );

  return (
    <section className="relative min-h-screen flex flex-col px-6 sm:px-10">
      {/* ═══ 3 AMBIENT BLOBS — mix-blend-mode: screen for dark mode ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: "-10%",
            right: "-10%",
            background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
            opacity: 0.5,
            mixBlendMode: "screen",
            filter: "blur(80px)",
          }}
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -15, 10, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
            opacity: 0.45,
            mixBlendMode: "screen",
            filter: "blur(90px)",
          }}
          animate={{
            x: [0, -15, 20, 0],
            y: [0, 10, -15, 0],
            scale: [1, 0.95, 1.08, 1],
          }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 350,
            height: 350,
            top: "40%",
            right: "20%",
            background: "radial-gradient(circle, #EC4899 0%, transparent 70%)",
            opacity: 0.3,
            mixBlendMode: "screen",
            filter: "blur(70px)",
          }}
          animate={{
            x: [0, 15, -20, 0],
            y: [0, -10, 15, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ═══ TOP NAV ═══ */}
      <nav className="relative z-10 flex items-center justify-between pt-6">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: easings.out }}
        >
          <span className="text-[28px] text-[#8B5CF6] drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]">&#9790;</span>
          <span className="font-display text-[18px] font-black tracking-tight">CeSoir</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: easings.out }}
        >
          <Link href="/login">
            <span className="text-[13px] text-white/70 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/10 hover:border-white/30 cursor-pointer inline-block">
              Se connecter
            </span>
          </Link>
        </motion.div>
      </nav>

      {/* ═══ HERO CONTENT ═══ */}
      <div className="relative z-10 flex-1 flex flex-col items-start justify-center max-w-5xl mx-auto w-full py-16">
        {/* Live badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: easings.out }}
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-[#00FF88] animate-ping opacity-60" />
            <span className="relative rounded-full w-2 h-2 bg-[#00FF88]" />
          </span>
          <span className="text-[12px] text-[#00FF88] font-semibold tracking-wide">
            <strong className="font-bold">{liveCount} personnes</strong> <span className="text-white/70 font-normal">actives dans 2 km</span>
          </span>
        </motion.div>

        {/* Giant title */}
        <motion.h1
          className="font-display text-[56px] sm:text-[80px] md:text-[96px] lg:text-[112px] font-black leading-[0.95] tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.cinematic, delay: 0.1 }}
        >
          Ce soir,
          <br />
          c&apos;est{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
            }}
          >
            ton
          </span>{" "}
          soir.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-[16px] sm:text-[18px] md:text-[20px] text-white/60 font-light max-w-xl leading-relaxed mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: easings.out }}
        >
          14 modes pour trouver quelqu&apos;un. Sans profil, sans swipe, sans paywall.
        </motion.p>

        {/* Countdown or "C'est maintenant" — placeholder until mounted to avoid hydration mismatch */}
        {!mounted ? (
          <div className="h-[130px] sm:h-[155px] mb-10" aria-hidden="true" />
        ) : time ? (
          <motion.div
            className="flex flex-col gap-2 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easings.out }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <CountdownBlock value={time.hours} label="HEURES" />
              <GradientColon />
              <CountdownBlock value={time.minutes} label="MINUTES" />
              <GradientColon />
              <CountdownBlock value={time.seconds} label="SECONDES" />
            </div>
            <p className="text-[11px] text-white/40 tracking-[0.3em] font-semibold mt-2 ml-1">
              — JUSQU&apos;À 20H, L&apos;HEURE BLEUE
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.elastic}
          >
            <span className="w-3 h-3 rounded-full bg-[#00FF88] animate-pulse" />
            <span className="font-display text-[32px] sm:text-[40px] font-black text-[#00FF88]">
              C&apos;EST MAINTENANT
            </span>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: easings.out }}
        >
          <Link href="/register">
            <motion.span
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-[16px] sm:text-[17px] font-semibold text-white cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                boxShadow: "0 0 60px rgba(139,92,246,0.35)",
              }}
              whileHover={{
                y: -4,
                boxShadow: "0 12px 80px rgba(0,255,136,0.45)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={springs.snap}
            >
              <span>Commencer maintenant</span>
              <motion.span
                className="inline-block"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
              >
                →
              </motion.span>
            </motion.span>
          </Link>
          <p className="text-[12px] text-white/40 ml-2">
            <span className="font-semibold text-white/60">Gratuit.</span>{" "}
            <span className="inline-block w-1 h-1 rounded-full bg-white/20 align-middle mx-1" />{" "}
            30 secondes pour créer un compte.
          </p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          className="flex items-center gap-2 mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <span className="text-[14px] text-[#8B5CF6] drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]">✦</span>
          <p className="text-[13px] text-white/50 font-light">
            <span
              className="font-bold tabular-nums"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {mentionsThisMonth.toLocaleString("fr-FR")}
            </span>{" "}
            rencontres ce mois-ci à Paris
          </p>
        </motion.div>
      </div>

      {/* ═══ BOTTOM-RIGHT COORDS ═══ */}
      <motion.div
        className="absolute bottom-6 right-6 sm:right-10 text-[10px] text-white/30 tracking-[0.3em] font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        PARIS · 48.8566° N
      </motion.div>
    </section>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center w-[72px] h-[80px] sm:w-[96px] sm:h-[110px] rounded-2xl backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          className="font-display text-[40px] sm:text-[56px] font-black tabular-nums leading-none"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] sm:text-[10px] text-white/40 mt-2 tracking-[0.25em] font-semibold">
        {label}
      </span>
    </div>
  );
}

function GradientColon() {
  return (
    <span
      className="font-display text-[32px] sm:text-[40px] font-light opacity-40"
      style={{
        background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      :
    </span>
  );
}

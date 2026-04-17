"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "motion/react";

/* ════════════════════════════════════════════════════════════════
   CeSoir Landing — Single-page scroll-driven cinematic experience
   Inspired by: Apple, Stripe, Linear, Framer
   ═══════════════════════════════════════════════════════════════ */

const ease = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  dramatic: [0.76, 0, 0.24, 1] as [number, number, number, number],
};

// ────────────────────────────────────────────────
// Phone Mockup component — reused at different scales
// ────────────────────────────────────────────────
function PhoneMockup({ className = "", scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{
        width: 260 * scale,
        height: 520 * scale,
        perspective: 1200,
      }}
    >
      <div
        className="absolute inset-0 rounded-[44px] border-[3px] border-white/15 bg-black/90 overflow-hidden"
        style={{
          boxShadow: "0 0 100px rgba(139,92,246,0.25), 0 30px 80px rgba(0,0,0,0.5), inset 0 0 40px rgba(255,255,255,0.03)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[92px] h-[28px] bg-black rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[41px] overflow-hidden bg-[#0A0A0A]">
          <div className="px-4 pt-9 pb-2 flex items-center gap-2">
            <span className="text-[12px] text-[#8B5CF6]">&#9790;</span>
            <span className="text-[11px] font-bold text-white/90 tracking-tight">CeSoir</span>
            <span className="ml-auto text-[9px] text-white/40">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <div className="px-3 flex gap-1 mb-3">
            <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">Solo Diner</span>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold bg-white/5 text-white/40 border border-white/10">Night Owl</span>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-semibold bg-white/5 text-white/40 border border-white/10">Langues</span>
          </div>

          <div className="px-3 space-y-2">
            {[
              { name: "Marie, 26", mode: "Solo Diner", dist: "0.8 km", color: "#8B5CF6" },
              { name: "Lucas, 31", mode: "Night Owl", dist: "1.2 km", color: "#6366F1" },
              { name: "Amina, 24", mode: "Langues", dist: "2.1 km", color: "#06B6D4" },
              { name: "Hugo, 29", mode: "Solo Diner", dist: "2.8 km", color: "#EC4899" },
            ].map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm"
                style={{ opacity: 1 - i * 0.08 }}
              >
                <div
                  className="w-9 h-9 rounded-full shrink-0"
                  style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-white/95 truncate">{p.name}</p>
                  <p className="text-[7px] text-white/50">{p.mode} · {p.dist}</p>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
                >
                  ♥
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 border-t border-white/5 bg-black/80 backdrop-blur flex justify-around">
            {["☾", "📍", "💬", "👤"].map((icon, i) => (
              <span key={i} className={`text-[11px] ${i === 0 ? "text-[#8B5CF6]" : "text-white/30"}`}>{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Ambient floating orbs (parallax background)
// ────────────────────────────────────────────────
function AmbientOrbs({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.4]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-25"
        style={{
          background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          top: "10%",
          left: "-10%",
          y: y1,
          opacity,
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
        style={{
          background: "radial-gradient(circle, #00FF88 0%, transparent 70%)",
          top: "40%",
          right: "-10%",
          y: y2,
          opacity,
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
        style={{
          background: "radial-gradient(circle, #EC4899 0%, transparent 70%)",
          bottom: "10%",
          left: "30%",
          y: y3,
          opacity,
        }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────
// LANDING PAGE
// ────────────────────────────────────────────────
export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const morphRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLElement>(null);

  // Global scroll progress for background parallax
  const { scrollYProgress: globalProgress } = useScroll({ target: containerRef });

  // Hero section scroll (0→1 as hero exits viewport)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Morph section scroll (phone zoom + text reveal)
  const { scrollYProgress: morphProgress } = useScroll({
    target: morphRef,
    offset: ["start end", "end start"],
  });

  // Sticky features scroll
  const { scrollYProgress: stickyProgress } = useScroll({
    target: stickyRef,
    offset: ["start start", "end end"],
  });

  /* ═══ HERO transforms ═══ */
  const heroScale = useSpring(useTransform(heroProgress, [0, 1], [1, 0.85]), { stiffness: 100, damping: 30 });
  const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);
  const heroTitleY = useTransform(heroProgress, [0, 1], [0, -80]);
  const phoneRotateHero = useTransform(heroProgress, [0, 1], [0, -8]);

  /* ═══ MORPH transforms (the big one) ═══ */
  // Phone grows from small to huge as user scrolls through this section
  const phoneScale = useSpring(
    useTransform(morphProgress, [0.15, 0.45, 0.7], [0.6, 1.1, 1.3]),
    { stiffness: 80, damping: 25 }
  );
  const phoneRotate = useTransform(morphProgress, [0.15, 0.45, 0.7], [5, 0, -3]);
  const phoneY = useTransform(morphProgress, [0.15, 0.7], [100, -50]);

  // Text reveals: "Pas demain" → "Pas la semaine prochaine" → "MAINTENANT."
  const text1Opacity = useTransform(morphProgress, [0.1, 0.25, 0.35, 0.45], [0, 1, 1, 0]);
  const text1Y = useTransform(morphProgress, [0.1, 0.25], [40, 0]);

  const text2Opacity = useTransform(morphProgress, [0.35, 0.45, 0.55, 0.65], [0, 1, 1, 0]);
  const text2Y = useTransform(morphProgress, [0.35, 0.45], [40, 0]);

  const text3Opacity = useTransform(morphProgress, [0.6, 0.72, 0.9], [0, 1, 1]);
  const text3Y = useTransform(morphProgress, [0.6, 0.72], [60, 0]);
  const text3Scale = useTransform(morphProgress, [0.6, 0.8, 1], [0.9, 1.05, 1]);

  /* ═══ STICKY features ═══ */
  const stickyPhoneScale = useTransform(stickyProgress, [0, 0.3, 1], [1, 1.05, 1]);

  // Features that slide in sequentially
  const feature1Opacity = useTransform(stickyProgress, [0, 0.1, 0.3, 0.4], [0, 1, 1, 0]);
  const feature1X = useTransform(stickyProgress, [0, 0.1], [60, 0]);

  const feature2Opacity = useTransform(stickyProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
  const feature2X = useTransform(stickyProgress, [0.3, 0.4], [60, 0]);

  const feature3Opacity = useTransform(stickyProgress, [0.6, 0.7, 0.9, 1], [0, 1, 1, 1]);
  const feature3X = useTransform(stickyProgress, [0.6, 0.7], [60, 0]);

  return (
    <div
      ref={containerRef}
      className="relative bg-black text-white overflow-x-hidden"
      style={{ backgroundColor: "#000" }}
    >
      {/* Global ambient orbs */}
      <AmbientOrbs scrollYProgress={globalProgress} />

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
          The first impression. Moon + name + phone.
          ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 z-10"
      >
        <motion.div
          className="relative flex flex-col items-center text-center"
          style={{ scale: heroScale, opacity: heroOpacity, y: heroTitleY }}
        >
          {/* Moon */}
          <motion.span
            className="text-[72px] mb-4 block"
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: ease.out }}
            style={{
              filter: "drop-shadow(0 0 40px rgba(139,92,246,0.5))",
            }}
          >
            &#9790;
          </motion.span>

          {/* Title — letter by letter reveal */}
          <motion.h1
            className="text-[72px] sm:text-[96px] md:text-[120px] font-black tracking-[-0.04em] leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {"CeSoir".split("").map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ y: 80, opacity: 0, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  delay: 0.3 + i * 0.08,
                  duration: 0.8,
                  ease: ease.out,
                }}
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-[16px] sm:text-[20px] text-white/60 mt-6 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: ease.out }}
          >
            Trouve quelqu&apos;un. <span className="text-white font-medium">Ce soir.</span>
          </motion.p>

          {/* Phone mockup enters from below */}
          <motion.div
            className="mt-12"
            initial={{ y: 100, opacity: 0, rotateX: 20 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ delay: 0.8, duration: 1.4, ease: ease.out }}
            style={{ rotate: phoneRotateHero, transformStyle: "preserve-3d" }}
          >
            <PhoneMockup scale={0.75} />
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            delay: 2,
            duration: 3,
            repeat: Infinity,
            times: [0, 0.3, 0.7, 1],
          }}
        >
          <span className="text-[10px] text-white/40 tracking-[0.25em] uppercase">Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — MORPH
          Scroll-driven: phone grows + 3 texts cascade.
          Height = 400vh for long scroll runway.
          ═══════════════════════════════════════════ */}
      <section
        ref={morphRef}
        className="relative z-10"
        style={{ height: "400vh" }}
      >
        {/* Sticky viewport that stays during whole scroll */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {/* Background vignette that intensifies */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 80%)",
              opacity: useTransform(morphProgress, [0, 0.3, 1], [0, 0.4, 0.8]),
            }}
          />

          {/* Phone in background — grows with scroll */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
            style={{
              scale: phoneScale,
              rotate: phoneRotate,
              y: phoneY,
              opacity: useTransform(morphProgress, [0, 0.1, 0.85, 1], [0, 1, 1, 0.3]),
            }}
          >
            <PhoneMockup scale={0.85} />
          </motion.div>

          {/* Layered text overlays */}
          <div className="relative z-10 text-center px-6 w-full">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: text1Opacity, y: text1Y }}
            >
              <h2 className="text-[48px] sm:text-[72px] md:text-[92px] font-black tracking-[-0.03em] leading-[0.95]">
                Pas demain.
              </h2>
            </motion.div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: text2Opacity, y: text2Y }}
            >
              <h2 className="text-[40px] sm:text-[60px] md:text-[78px] font-black tracking-[-0.03em] leading-[0.95] text-white/80">
                Pas la semaine prochaine.
              </h2>
            </motion.div>

            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: text3Opacity, y: text3Y, scale: text3Scale }}
            >
              <h2
                className="text-[72px] sm:text-[120px] md:text-[160px] font-black tracking-[-0.05em] leading-none"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 60px rgba(139,92,246,0.4))",
                }}
              >
                Maintenant.
              </h2>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — STICKY FEATURES
          Phone stays, 3 features slide in sequentially
          ═══════════════════════════════════════════ */}
      <section
        ref={stickyRef}
        className="relative z-10"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-0 h-screen flex items-center">
          <div className="w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            {/* Phone — sticky, subtle pulse */}
            <motion.div
              className="flex justify-center md:justify-end"
              style={{ scale: stickyPhoneScale }}
            >
              <PhoneMockup scale={0.8} />
            </motion.div>

            {/* Features — each slides in and out */}
            <div className="relative min-h-[400px] flex items-center">
              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: feature1Opacity, x: feature1X }}
              >
                <p className="text-[11px] tracking-[0.3em] uppercase font-bold mb-5" style={{ color: "#8B5CF6" }}>
                  01 — Le concept
                </p>
                <h3 className="text-[36px] sm:text-[52px] font-black tracking-[-0.03em] leading-tight mb-6">
                  14 facons de <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    sortir ce soir
                  </span>
                </h3>
                <p className="text-[16px] text-white/50 leading-relaxed max-w-md">
                  Solo Diner, Night Owl, Foodie, Langues, Plus-One… Choisis ton mode et trouve quelqu&apos;un qui cherche la même ambiance.
                </p>
              </motion.div>

              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: feature2Opacity, x: feature2X }}
              >
                <p className="text-[11px] tracking-[0.3em] uppercase font-bold mb-5" style={{ color: "#00FF88" }}>
                  02 — Temps reel
                </p>
                <h3 className="text-[36px] sm:text-[52px] font-black tracking-[-0.03em] leading-tight mb-6">
                  Qui est <br />
                  <span className="text-white">dispo maintenant ?</span>
                </h3>
                <p className="text-[16px] text-white/50 leading-relaxed max-w-md">
                  Voir seulement les gens près de toi, actifs ce soir. Pas de comptes fantômes, pas d&apos;attente. Juste ce soir.
                </p>
              </motion.div>

              <motion.div
                className="absolute inset-0 flex flex-col justify-center"
                style={{ opacity: feature3Opacity, x: feature3X }}
              >
                <p className="text-[11px] tracking-[0.3em] uppercase font-bold mb-5" style={{ color: "#EC4899" }}>
                  03 — Gratuit
                </p>
                <h3 className="text-[36px] sm:text-[52px] font-black tracking-[-0.03em] leading-tight mb-6">
                  Sans pub. <br />
                  <span className="text-white">Sans paywall.</span>
                </h3>
                <p className="text-[16px] text-white/50 leading-relaxed max-w-md">
                  Pas d&apos;algorithme pour te retenir, pas de Premium pour voir tes likes. L&apos;app est simple, honnête et 100% gratuite.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — FINAL CTA
          Cinematic finale. "Ton soir."
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 z-10">
        {/* Central glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="relative z-10 text-center max-w-2xl"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: ease.out }}
        >
          <h2 className="text-[48px] sm:text-[72px] md:text-[88px] font-black tracking-[-0.04em] leading-[0.95] mb-8">
            Ce soir,
            <br />
            c&apos;est{" "}
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
          </h2>

          <motion.p
            className="text-[16px] sm:text-[18px] text-white/50 mb-10 tracking-wide"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Gratuit. Sans pub. Sans paywall.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href="/register">
              <motion.span
                className="inline-block px-14 py-5 rounded-full text-[17px] font-semibold text-white cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  boxShadow: "0 0 60px rgba(139,92,246,0.35), 0 0 80px rgba(0,255,136,0.2)",
                }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 12px 80px rgba(139,92,246,0.5), 0 0 100px rgba(0,255,136,0.3)",
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Commencer maintenant
              </motion.span>
            </Link>
          </motion.div>

          <div className="mt-10">
            <Link
              href="/browse"
              className="text-[14px] text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1"
            >
              Explorer les profils
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER — minimal
          ═══════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[18px] text-[#8B5CF6]">&#9790;</span>
          <span className="text-[15px] font-bold tracking-tight">CeSoir</span>
        </div>
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          <Link href="/about" className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1">A propos</Link>
          <Link href="/safety" className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1">Securite</Link>
          <Link href="/cgu" className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1">CGU</Link>
          <Link href="/privacy" className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1">Confidentialite</Link>
        </div>
        <p className="text-[11px] text-white/30">&copy; 2026 CeSoir. Tous droits reserves.</p>
      </footer>
    </div>
  );
}

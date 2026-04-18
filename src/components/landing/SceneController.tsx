"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import PlasmaOcean from "@/components/landing/PlasmaOcean";
import MoonHero from "@/components/landing/MoonHero";
import PhoneVideo from "@/components/landing/PhoneVideo";
import { springs, easings } from "@/lib/motion-design";
import { usePausableInterval } from "@/lib/usePausableInterval";

/**
 * SceneController — single-page morphic cinematic landing.
 *
 * 4 scenes morph on ONE screen (no vertical scroll between them):
 *   0. INTRO        — Plasma sobre + Moon centered + "Ce soir, c'est *ton* soir."
 *   1. LE CONCEPT   — Moon shrinks to top-right, "Pas demain... *Maintenant*."
 *   2. L'APP        — PhoneVideo centered, Moon tiny corner
 *   3. REJOINDRE    — Moon back center, giant gradient CTA, then loops
 *
 * Advancement:
 *   - Auto-play every 8s (pausable with Space, auto-pauses 10s after manual nav)
 *   - Keyboard: ArrowRight/Down = next, ArrowLeft/Up = prev, Space = pause
 *   - Click on scrubber dots = jump to scene
 */

const SCENE_DURATION_MS = 8000;
const MANUAL_PAUSE_MS = 10000;
const SCENE_COUNT = 4;

const SCENE_NAMES = ["INTRO", "LE CONCEPT", "L'APP", "REJOINDRE"] as const;

type SceneIndex = 0 | 1 | 2 | 3;

// ────────────────────────────────────────────────
// Moon layout variants per scene (position + size)
// ────────────────────────────────────────────────
const moonVariants = {
  0: {
    size: 220,
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
  },
  1: {
    size: 100,
    // top-right corner: positive x, negative y from center
    x: "38vw",
    y: "-36vh",
    rotate: 18,
    opacity: 1,
  },
  2: {
    size: 70,
    x: "42vw",
    y: "-38vh",
    rotate: 28,
    opacity: 0.85,
  },
  3: {
    size: 180,
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
  },
} as const;

// Plasma params per scene (speed influences palette flow feel)
const plasmaParams: Record<SceneIndex, { speed: number; opacity: number }> = {
  0: { speed: 0.5, opacity: 0.45 },
  1: { speed: 0.7, opacity: 0.55 },
  2: { speed: 0.55, opacity: 0.35 },
  3: { speed: 0.9, opacity: 0.6 },
};

// ────────────────────────────────────────────────
// Gradient text helper
// ────────────────────────────────────────────────
const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontStyle: "italic",
};

export default function SceneController() {
  const [scene, setScene] = useState<SceneIndex>(0);
  const [paused, setPaused] = useState(false);
  const manualPauseTimeoutRef = useRef<number | null>(null);

  // Clear any pending manual-pause resume timer
  const clearManualPauseTimer = useCallback(() => {
    if (manualPauseTimeoutRef.current !== null) {
      window.clearTimeout(manualPauseTimeoutRef.current);
      manualPauseTimeoutRef.current = null;
    }
  }, []);

  // Schedule auto-resume after manual interaction
  const scheduleManualResume = useCallback(() => {
    clearManualPauseTimer();
    manualPauseTimeoutRef.current = window.setTimeout(() => {
      setPaused(false);
      manualPauseTimeoutRef.current = null;
    }, MANUAL_PAUSE_MS);
  }, [clearManualPauseTimer]);

  const goTo = useCallback(
    (next: SceneIndex) => {
      setScene(next);
      setPaused(true);
      scheduleManualResume();
    },
    [scheduleManualResume]
  );

  const next = useCallback(() => {
    setScene((s) => ((s + 1) % SCENE_COUNT) as SceneIndex);
    setPaused(true);
    scheduleManualResume();
  }, [scheduleManualResume]);

  const prev = useCallback(() => {
    setScene((s) => ((s - 1 + SCENE_COUNT) % SCENE_COUNT) as SceneIndex);
    setPaused(true);
    scheduleManualResume();
  }, [scheduleManualResume]);

  const togglePause = useCallback(() => {
    clearManualPauseTimer();
    setPaused((p) => !p);
  }, [clearManualPauseTimer]);

  // Auto-play (pausable, battery-saver aware)
  usePausableInterval(
    () => setScene((s) => ((s + 1) % SCENE_COUNT) as SceneIndex),
    paused ? null : SCENE_DURATION_MS
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, togglePause]);

  // Cleanup pause timer on unmount
  useEffect(() => {
    return () => clearManualPauseTimer();
  }, [clearManualPauseTimer]);

  const plasma = plasmaParams[scene];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A0D] text-white">
      {/* ────────────────────────────────
          PlasmaOcean background (animates opacity across scenes)
          ──────────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: plasma.opacity }}
        transition={{ duration: 1.2, ease: easings.out }}
      >
        <PlasmaOcean palette="cesoir" speed={plasma.speed} opacity={1} />
      </motion.div>

      {/* Vignette to keep text legible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,10,13,0.15) 0%, rgba(10,10,13,0.7) 100%)",
        }}
      />

      {/* ────────────────────────────────
          Top nav — minimal, always visible
          ──────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 pt-6">
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

      {/* ────────────────────────────────
          Moon — morphs position + size across scenes
          ──────────────────────────────── */}
      <motion.div
        className="absolute top-1/2 left-1/2 z-10 pointer-events-none"
        style={{ translateX: "-50%", translateY: "-50%" }}
        animate={{
          x: moonVariants[scene].x,
          y: moonVariants[scene].y,
          rotate: moonVariants[scene].rotate,
          opacity: moonVariants[scene].opacity,
        }}
        transition={{ ...springs.cinematic }}
      >
        <motion.div
          animate={{
            width: moonVariants[scene].size,
            height: moonVariants[scene].size,
          }}
          transition={{ ...springs.cinematic }}
          className="flex items-center justify-center"
        >
          <MoonHero size={moonVariants[scene].size} />
        </motion.div>
      </motion.div>

      {/* ────────────────────────────────
          Scene content — AnimatePresence for crossfades
          ──────────────────────────────── */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {scene === 0 && <SceneIntro key="scene-0" />}
          {scene === 1 && <SceneConcept key="scene-1" />}
          {scene === 2 && <SceneApp key="scene-2" />}
          {scene === 3 && <SceneCTA key="scene-3" />}
        </AnimatePresence>
      </div>

      {/* ────────────────────────────────
          Scrubber — bottom dots + current name
          ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 pt-4 pointer-events-none">
        <div className="flex flex-col items-center gap-3 pointer-events-auto">
          {/* Scene name (morphs) */}
          <div className="h-5 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={scene}
                className="text-[11px] text-white/60 uppercase tracking-[0.4em] font-semibold"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: easings.out }}
              >
                {SCENE_NAMES[scene]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: SCENE_COUNT }, (_, i) => {
              const active = i === scene;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i as SceneIndex)}
                  aria-label={`Aller à la scène ${i + 1} — ${SCENE_NAMES[i]}`}
                  className="group relative flex items-center justify-center h-5 px-1"
                >
                  <motion.span
                    className="block h-1.5 rounded-full"
                    animate={{
                      width: active ? 20 : 6,
                      opacity: active ? 1 : 0.4,
                    }}
                    transition={springs.snap}
                    style={{
                      background: active
                        ? "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)"
                        : "rgba(255,255,255,0.2)",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Pause state hint */}
          <AnimatePresence>
            {paused && (
              <motion.span
                className="text-[9px] text-white/30 uppercase tracking-[0.3em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                en pause — espace pour reprendre
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCENES
// ═══════════════════════════════════════════════════════════════════

const sceneFade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ──────────────────── Scene 0: INTRO ────────────────────
function SceneIntro() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center max-w-4xl"
      {...sceneFade}
      transition={{ duration: 0.8, ease: easings.out }}
    >
      {/* Moon is rendered outside; reserve space so title sits below */}
      <div className="h-[260px] sm:h-[280px]" aria-hidden />
      <motion.h1
        className="font-display text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] font-black leading-[0.95] tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.9, delay: 0.25, ease: easings.out }}
      >
        Ce soir,
        <br />
        c&apos;est <span style={gradientText}>ton</span> soir.
      </motion.h1>
    </motion.div>
  );
}

// ──────────────────── Scene 1: LE CONCEPT ────────────────────
function SceneConcept() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center max-w-3xl"
      {...sceneFade}
      transition={{ duration: 0.8, ease: easings.out }}
    >
      <motion.p
        className="text-[11px] sm:text-[12px] text-[#8B5CF6] uppercase tracking-[0.4em] font-bold mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Le concept
      </motion.p>

      <motion.h2
        className="font-display text-[36px] sm:text-[52px] md:text-[68px] font-black leading-[1.05] tracking-tight mb-8 sm:mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.8, delay: 0.2, ease: easings.out }}
      >
        Pas demain.
        <br />
        Pas la semaine prochaine.
        <br />
        <span style={gradientText}>Maintenant.</span>
      </motion.h2>

      <motion.p
        className="text-[15px] sm:text-[17px] text-white/65 leading-relaxed max-w-lg"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: easings.out }}
      >
        CeSoir te connecte avec des gens près de toi, disponibles ce soir.{" "}
        <span className="text-white font-semibold">14 modes de rencontre.</span>
      </motion.p>
    </motion.div>
  );
}

// ──────────────────── Scene 2: L'APP ────────────────────
function SceneApp() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center"
      {...sceneFade}
      transition={{ duration: 0.8, ease: easings.out }}
    >
      <motion.h2
        className="font-display text-[28px] sm:text-[40px] md:text-[52px] font-black leading-[1] tracking-tight mb-6 sm:mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.6, delay: 0.1, ease: easings.out }}
      >
        L&apos;<span style={gradientText}>expérience</span>
      </motion.h2>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ ...springs.cinematic, delay: 0.2 }}
        className="origin-center"
        style={{
          transform: "scale(var(--phone-scale, 1))",
        }}
      >
        {/* Phone scales down on small screens via wrapper */}
        <div className="scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 origin-center">
          <PhoneVideo />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────── Scene 3: CTA ────────────────────
function SceneCTA() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center"
      {...sceneFade}
      transition={{ duration: 0.8, ease: easings.out }}
    >
      {/* Reserve vertical space for Moon (centered, size 180) */}
      <div className="h-[220px] sm:h-[240px]" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ ...springs.cinematic, delay: 0.15 }}
        className="flex flex-col items-center gap-5"
      >
        <Link href="/register">
          <motion.span
            className="inline-flex items-center gap-4 px-10 sm:px-14 py-5 sm:py-6 rounded-2xl font-display text-[22px] sm:text-[28px] md:text-[32px] font-black text-white cursor-pointer tracking-tight"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
              boxShadow: "0 0 80px rgba(139,92,246,0.5)",
            }}
            whileHover={{
              y: -4,
              boxShadow: "0 16px 100px rgba(0,255,136,0.55)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={springs.snap}
          >
            Rejoindre
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.span>
        </Link>

        <motion.p
          className="text-[12px] sm:text-[13px] text-white/50 uppercase tracking-[0.3em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Gratuit <span className="mx-2">·</span> 30 secondes
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

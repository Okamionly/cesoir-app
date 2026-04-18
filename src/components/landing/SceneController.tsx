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
 * 3 scenes morph on ONE screen (no vertical scroll):
 *   0. INTRO + CTA   — Moon + "Ce soir, c'est ton soir." + "Rejoindre" CTA
 *   1. LE CONCEPT    — Moon top-right, "Pas demain... Maintenant."
 *   2. L'APP         — Moon tiny corner, PhoneVideo centered
 *
 * Advancement:
 *   - Auto-play every 9s (pausable with Space, auto-pauses 10s after manual nav)
 *   - Keyboard: ArrowRight/Down = next, ArrowLeft/Up = prev, Space = pause
 *   - Mouse wheel: scroll down = next, scroll up = prev (throttled 600ms)
 *   - Touch swipe: left/right on mobile
 *   - Click on scrubber dots = jump to scene
 */

const SCENE_DURATION_MS = 9000;
const MANUAL_PAUSE_MS = 10000;
const SCENE_COUNT = 3;
const WHEEL_THROTTLE_MS = 600;
const SWIPE_THRESHOLD_PX = 50;

const SCENE_NAMES = ["INTRO", "LE CONCEPT", "L'APP"] as const;

type SceneIndex = 0 | 1 | 2;

// Moon layout variants per scene (position + size)
const moonVariants = {
  0: { size: 180, x: 0, y: "-18vh", rotate: 0, opacity: 1 },
  1: { size: 90, x: "38vw", y: "-36vh", rotate: 18, opacity: 1 },
  2: { size: 60, x: "42vw", y: "-38vh", rotate: 28, opacity: 0.8 },
} as const;

// Plasma params per scene
const plasmaParams: Record<SceneIndex, { speed: number; opacity: number }> = {
  0: { speed: 0.55, opacity: 0.5 },
  1: { speed: 0.75, opacity: 0.55 },
  2: { speed: 0.6, opacity: 0.4 },
};

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
  const lastWheelRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  const clearManualPauseTimer = useCallback(() => {
    if (manualPauseTimeoutRef.current !== null) {
      window.clearTimeout(manualPauseTimeoutRef.current);
      manualPauseTimeoutRef.current = null;
    }
  }, []);

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

  // Auto-play
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

  // Mouse wheel navigation (throttled) — hijacks page scroll for scene nav
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 18) return; // ignore tiny scrolls (trackpad noise)
      const now = Date.now();
      if (now - lastWheelRef.current < WHEEL_THROTTLE_MS) {
        e.preventDefault();
        return;
      }
      lastWheelRef.current = now;
      e.preventDefault();
      if (e.deltaY > 0) next();
      else prev();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [next, prev]);

  // Touch swipe (mobile)
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (dx < 0) next();
      else prev();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [next, prev]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearManualPauseTimer();
  }, [clearManualPauseTimer]);

  const plasma = plasmaParams[scene];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A0D] text-white overscroll-none">
      {/* PlasmaOcean background (animates opacity across scenes) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: plasma.opacity }}
        transition={{ duration: 1.2, ease: easings.out }}
      >
        <PlasmaOcean palette="cesoir" speed={plasma.speed} opacity={1} />
      </motion.div>

      {/* Vignette for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,10,13,0.1) 0%, rgba(10,10,13,0.72) 100%)",
        }}
      />

      {/* Top nav — minimal */}
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

      {/* Moon — morphs position + size across scenes */}
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

      {/* Scene content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {scene === 0 && <SceneIntroCTA key="scene-0" />}
          {scene === 1 && <SceneConcept key="scene-1" />}
          {scene === 2 && <SceneApp key="scene-2" />}
        </AnimatePresence>
      </div>

      {/* Scrubber + legal links (bottom zone) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-6 pt-4 pointer-events-none">
        <div className="flex flex-col items-center gap-2.5 pointer-events-auto">
          {/* Scene name */}
          <div className="h-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={scene}
                className="text-[10px] text-white/55 uppercase tracking-[0.4em] font-semibold"
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
                      width: active ? 22 : 6,
                      opacity: active ? 1 : 0.35,
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

          {/* Hint: scroll / swipe / pause */}
          <AnimatePresence mode="wait">
            <motion.span
              key={paused ? "paused" : "hint"}
              className="text-[9px] text-white/30 uppercase tracking-[0.3em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {paused
                ? "en pause — espace pour reprendre"
                : "molette · flèches · espace"}
            </motion.span>
          </AnimatePresence>

          {/* Micro legal links — subtle */}
          <div className="flex items-center gap-4 mt-1.5 opacity-40 hover:opacity-70 transition-opacity">
            <Link
              href="/about"
              className="text-[9px] text-white/60 hover:text-white/90 transition-colors tracking-wide"
            >
              À propos
            </Link>
            <span className="text-white/20 text-[8px]">·</span>
            <Link
              href="/safety"
              className="text-[9px] text-white/60 hover:text-white/90 transition-colors tracking-wide"
            >
              Sécurité
            </Link>
            <span className="text-white/20 text-[8px]">·</span>
            <Link
              href="/cgu"
              className="text-[9px] text-white/60 hover:text-white/90 transition-colors tracking-wide"
            >
              CGU
            </Link>
            <span className="text-white/20 text-[8px]">·</span>
            <Link
              href="/privacy"
              className="text-[9px] text-white/60 hover:text-white/90 transition-colors tracking-wide"
            >
              Confidentialité
            </Link>
          </div>
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

// ──────────────────── Scene 0: INTRO + CTA (merged) ────────────────────
function SceneIntroCTA() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center max-w-4xl"
      {...sceneFade}
      transition={{ duration: 0.8, ease: easings.out }}
    >
      {/* Reserve space for Moon above (size 180, offset y=-18vh) */}
      <div className="h-[140px] sm:h-[160px]" aria-hidden />

      <motion.h1
        className="font-display text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] font-black leading-[0.95] tracking-tight mb-10 sm:mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.9, delay: 0.25, ease: easings.out }}
      >
        Ce soir,
        <br />
        c&apos;est <span style={gradientText}>ton</span> soir.
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ ...springs.cinematic, delay: 0.55 }}
        className="flex flex-col items-center gap-3"
      >
        <Link href="/register">
          <motion.span
            className="inline-flex items-center gap-3 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl font-display text-[18px] sm:text-[22px] font-black text-white cursor-pointer tracking-tight"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
              boxShadow: "0 0 60px rgba(139,92,246,0.4)",
            }}
            whileHover={{
              y: -4,
              boxShadow: "0 12px 80px rgba(0,255,136,0.5)",
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
          className="text-[11px] sm:text-[12px] text-white/45 uppercase tracking-[0.3em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
        >
          Gratuit <span className="mx-2">·</span> 30 secondes
        </motion.p>
      </motion.div>
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
      >
        <div className="scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-center">
          <PhoneVideo />
        </div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import Link from "next/link";
import PlasmaOcean from "@/components/landing/PlasmaOcean";
import MoonHero from "@/components/landing/MoonHero";
import PhoneVideo from "@/components/landing/PhoneVideo";
import StarField from "@/components/landing/StarField";
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
 *
 * Cinematic polish layered in:
 *   - Ambient StarField particles above plasma
 *   - Top gradient progress bar tied to auto-play clock
 *   - Magnetic CTA on Scene 0
 *   - Rack-focus scene transitions (blur + scale)
 *   - First-visit "scroll to navigate" hint
 *   - Radial pulse on keyboard input
 *   - Premium spotlight + floor reflection behind PhoneVideo
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

// Rack-focus scene transitions: camera refocus feel
const rackFocus = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 1.04, filter: "blur(6px)" },
};

const rackTransition = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export default function SceneController() {
  const [scene, setScene] = useState<SceneIndex>(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 progress in current scene
  const [hintVisible, setHintVisible] = useState(false);
  const [pulseKey, setPulseKey] = useState(0); // triggers keyboard pulse flash
  const manualPauseTimeoutRef = useRef<number | null>(null);
  const lastWheelRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const sceneStartRef = useRef<number>(performance.now());
  const reducedMotion = useReducedMotion();

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

  // Trigger a screen pulse when keyboard navigation fires
  const flashPulse = useCallback(() => {
    setPulseKey((k) => k + 1);
  }, []);

  // Auto-play — WCAG 2.2.2: respect prefers-reduced-motion (no auto-rotate).
  usePausableInterval(
    () => setScene((s) => ((s + 1) % SCENE_COUNT) as SceneIndex),
    paused || reducedMotion ? null : SCENE_DURATION_MS
  );

  // Reset progress clock on scene change
  useEffect(() => {
    sceneStartRef.current = performance.now();
    setProgress(0);
  }, [scene]);

  // Drive progress bar via rAF. Pauses freeze the bar (fade handled in render).
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - sceneStartRef.current;
      setProgress(Math.min(elapsed / SCENE_DURATION_MS, 1));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, scene]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next();
        flashPulse();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
        flashPulse();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePause();
        flashPulse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, togglePause, flashPulse]);

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

  // First-visit scroll hint (once per session)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem("cesoir:landing-hint");
    if (seen) return;
    setHintVisible(true);
    const t = window.setTimeout(() => setHintVisible(false), 5000);
    window.sessionStorage.setItem("cesoir:landing-hint", "1");
    return () => window.clearTimeout(t);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearManualPauseTimer();
  }, [clearManualPauseTimer]);

  const plasma = plasmaParams[scene];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0A0A0D] text-white overscroll-none">
      {/* Top progress bar — auto-play clock */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40 h-[2px] pointer-events-none origin-left"
        style={{
          background:
            "linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #00FF88 100%)",
          scaleX: progress,
          boxShadow: "0 0 12px rgba(139,92,246,0.5)",
        }}
        animate={{ opacity: paused ? 0 : 1 }}
        transition={{ duration: 0.3, ease: easings.out }}
      />

      {/* PlasmaOcean background (animates opacity across scenes) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: plasma.opacity }}
        transition={{ duration: 1.2, ease: easings.out }}
      >
        <PlasmaOcean palette="cesoir" speed={plasma.speed} opacity={1} />
      </motion.div>

      {/* Ambient StarField — above plasma, below text */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <StarField />
      </div>

      {/* Vignette for text legibility */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,10,13,0.1) 0%, rgba(10,10,13,0.72) 100%)",
        }}
      />

      {/* Keyboard pulse flash (radial glow) */}
      <AnimatePresence>
        {pulseKey > 0 && (
          <motion.div
            key={pulseKey}
            className="absolute inset-0 z-[3] pointer-events-none"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easings.out }}
            style={{
              background:
                "radial-gradient(circle at center, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 55%)",
            }}
          />
        )}
      </AnimatePresence>

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
          {/* First-visit scroll hint (above scene name) */}
          <AnimatePresence>
            {hintVisible && !reducedMotion && (
              <motion.div
                key="hint"
                className="flex flex-col items-center gap-1 mb-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.6, ease: easings.out }}
                aria-hidden="true"
              >
                <motion.svg
                  width="18"
                  height="24"
                  viewBox="0 0 18 24"
                  fill="none"
                  animate={{ y: [0, 4, 0] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <rect
                    x="1"
                    y="1"
                    width="16"
                    height="22"
                    rx="8"
                    stroke="currentColor"
                    strokeOpacity="0.7"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <motion.rect
                    x="8"
                    y="6"
                    width="2"
                    height="4"
                    rx="1"
                    fill="currentColor"
                    animate={{ y: [6, 10, 6], opacity: [1, 0.4, 1] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.svg>
                <span className="text-[8px] uppercase tracking-[0.3em] text-white/55">
                  Scroll
                </span>
              </motion.div>
            )}
          </AnimatePresence>

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
                  className="group relative flex items-center justify-center min-w-11 min-h-11"
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

          {/* Hint: scroll / swipe / pause — AA contrast: white/70 on #0A0A0D */}
          <AnimatePresence mode="wait">
            <motion.span
              key={paused ? "paused" : "hint"}
              className="text-[9px] text-white/70 uppercase tracking-[0.3em]"
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

          {/* Micro legal links — WCAG 2.5.5 tap targets (min 44px via py-3)
              and AA contrast (white/70 on #0A0A0D ≈ 4.8:1). */}
          <nav
            aria-label="Liens légaux"
            className="flex items-center gap-3 sm:gap-4 mt-1.5"
          >
            <Link
              href="/about"
              className="text-[10px] text-white/70 hover:text-white transition-colors tracking-wide px-2 py-3 inline-flex items-center min-h-11"
            >
              À propos
            </Link>
            <span className="text-white/60 text-[8px]" aria-hidden="true">·</span>
            <Link
              href="/safety"
              className="text-[10px] text-white/70 hover:text-white transition-colors tracking-wide px-2 py-3 inline-flex items-center min-h-11"
            >
              Sécurité
            </Link>
            <span className="text-white/60 text-[8px]" aria-hidden="true">·</span>
            <Link
              href="/cgu"
              className="text-[10px] text-white/70 hover:text-white transition-colors tracking-wide px-2 py-3 inline-flex items-center min-h-11"
            >
              CGU
            </Link>
            <span className="text-white/60 text-[8px]" aria-hidden="true">·</span>
            <Link
              href="/privacy"
              className="text-[10px] text-white/70 hover:text-white transition-colors tracking-wide px-2 py-3 inline-flex items-center min-h-11"
            >
              Confidentialité
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCENES
// ═══════════════════════════════════════════════════════════════════

// ──────────────────── Scene 0: INTRO + CTA (merged) ────────────────────
function SceneIntroCTA() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center max-w-4xl"
      // First mount: paint immediately (LCP must fire <2.5s). Subsequent
      // scene transitions still use rackFocus on exit and re-entry via key.
      initial={false}
      animate={rackFocus.animate}
      exit={rackFocus.exit}
      transition={rackTransition}
    >
      {/* Reserve space for Moon above (size 180, offset y=-18vh) */}
      <div className="h-[140px] sm:h-[160px]" aria-hidden />

      {/*
        LCP hero — rendered SSR-paintable (no initial hidden state, no delay)
        so Chrome picks this as the stable LCP candidate under 2.5s.
        Keep exit animation for smooth scene morph; suppress entrance anim.
      */}
      <motion.h1
        className="font-display text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] font-black leading-[0.95] tracking-tight mb-10 sm:mb-12"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: easings.out }}
      >
        Ce soir,
        <br />
        c&apos;est <span style={gradientText}>ton</span> soir.
      </motion.h1>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ ...springs.cinematic }}
        className="flex flex-col items-center gap-3"
      >
        <MagneticCTA />

        <motion.p
          className="text-[11px] sm:text-[12px] text-white/45 uppercase tracking-[0.3em]"
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          Gratuit <span className="mx-2">·</span> 30 secondes
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

/**
 * MagneticCTA — Rejoindre button with a magnetic hover effect.
 *
 * When the cursor is within ~80px of the button centre, the button glides
 * toward the cursor (max 8px) via a spring. Disabled on touch/coarse
 * pointers and for prefers-reduced-motion users — then the button is a
 * plain motion element with its existing hover/tap reactions.
 */
function MagneticCTA() {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.6 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    // Only enable magnetism on fine pointers (mouse). Touch gets nothing.
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < 80) {
        const strength = 1 - dist / 80;
        x.set(dx * strength * 0.12); // ~8px max at centre overlap
        y.set(dy * strength * 0.12);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reducedMotion, x, y]);

  return (
    <Link href="/register" ref={ref} className="inline-block">
      <motion.span
        className="inline-flex items-center gap-3 px-10 sm:px-12 py-4 sm:py-5 rounded-2xl font-display text-[18px] sm:text-[22px] font-black text-white cursor-pointer tracking-tight"
        style={{
          background: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
          boxShadow: "0 0 60px rgba(139,92,246,0.4)",
          x: springX,
          y: springY,
        }}
        whileHover={{
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
  );
}

// ──────────────────── Scene 1: LE CONCEPT ────────────────────
function SceneConcept() {
  return (
    <motion.div
      className="relative flex flex-col items-center justify-center text-center max-w-3xl"
      initial={rackFocus.initial}
      animate={rackFocus.animate}
      exit={rackFocus.exit}
      transition={rackTransition}
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
      initial={rackFocus.initial}
      animate={rackFocus.animate}
      exit={rackFocus.exit}
      transition={rackTransition}
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

      {/* Premium frame: spotlight + phone + floor reflection */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ ...springs.cinematic, delay: 0.2 }}
        className="origin-center relative"
      >
        {/* Dramatic spotlight (behind phone) */}
        <div
          className="absolute inset-0 pointer-events-none -z-[1]"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(139,92,246,0.38) 0%, rgba(236,72,153,0.18) 45%, rgba(10,10,13,0) 75%)",
            transform: "scale(1.8)",
            filter: "blur(12px)",
          }}
        />

        <div className="scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-center relative">
          <PhoneVideo />

          {/* Ground shadow under phone */}
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            aria-hidden="true"
            style={{
              bottom: -28,
              width: 220,
              height: 26,
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)",
              filter: "blur(6px)",
            }}
          />

          {/* Floor reflection — mirrored phone silhouette fading out */}
          <motion.div
            className="absolute left-1/2 pointer-events-none"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.1, delay: 0.5, ease: easings.out }}
            style={{
              top: "100%",
              width: 280,
              height: 160,
              transform: "translateX(-50%) scaleY(-1) skewX(-4deg)",
              transformOrigin: "top",
              background:
                "linear-gradient(to bottom, rgba(139,92,246,0.35) 0%, rgba(236,72,153,0.12) 35%, rgba(10,10,13,0) 100%)",
              borderRadius: "44px 44px 0 0",
              filter: "blur(10px)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 80%)",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

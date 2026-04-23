"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useMidnightReset } from "@/lib/useMidnightReset";
import {
  MIDNIGHT_URGENT_COLOR,
  MIDNIGHT_STAR_COLORS,
  MIDNIGHT_BACKDROP,
  MIDNIGHT_TITLE_GRADIENT,
  MIDNIGHT_SUBTITLE_COLOR,
  MIDNIGHT_SUBTEXT_COLOR,
} from "@/lib/chat-content-colors";

// ─────────────────────────────────────────
// Star particle for celebration
// ─────────────────────────────────────────

function CelebrationStar({ index }: { index: number }) {
  const size = Math.random() * 4 + 2;
  const left = Math.random() * 100;
  const top = Math.random() * 100;
  const delay = Math.random() * 1.5;
  const duration = 1.5 + Math.random() * 1.5;

  return (
    <m.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        top: `${top}%`,
        background: MIDNIGHT_STAR_COLORS[index % MIDNIGHT_STAR_COLORS.length],
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0.6, 1, 0],
        scale: [0, 1.5, 1, 1.2, 0],
      }}
      transition={{
        duration,
        delay,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    />
  );
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function MidnightReset() {
  const { timeUntilReset, isResetting } = useMidnightReset();
  const [showOverlay, setShowOverlay] = useState(false);
  const [stars, setStars] = useState<number[]>([]);

  const { hours, minutes, seconds, totalMs } = timeUntilReset;
  const isUrgent = hours === 0 && minutes < 60;
  const isDramatic = totalMs > 0 && totalMs <= 60_000; // last 60 seconds

  // Show celebration overlay when reset triggers.
  // Fix (2026-04-23): reduced from 3s → 2s + tap-to-dismiss.
  useEffect(() => {
    if (isResetting) {
      setShowOverlay(true);
      setStars(Array.from({ length: 40 }, (_, i) => i));

      const timer = setTimeout(() => {
        setShowOverlay(false);
        setStars([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isResetting]);

  const dismissOverlay = () => {
    setShowOverlay(false);
    setStars([]);
  };

  return (
    <>
      {/* ─── Countdown bar ─── */}
      <div
        className="shrink-0 px-4 pt-2 pb-1"
        role="status"
        aria-label="Compte a rebours minuit"
      >
        <AnimatePresence mode="wait">
          {isDramatic ? (
            // ─── Dramatic last-60-seconds countdown ───
            <m.div
              key="dramatic"
              className="flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <m.span
                className="text-[10px] font-medium"
                style={{ color: MIDNIGHT_URGENT_COLOR }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                {"\u{1F525}"}
              </m.span>

              <AnimatePresence mode="popLayout">
                <m.span
                  key={seconds}
                  className="font-black text-[16px] leading-none tabular-nums"
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk')",
                    color: MIDNIGHT_URGENT_COLOR,
                    minWidth: "2ch",
                    textAlign: "center",
                    display: "inline-block",
                  }}
                  initial={{ opacity: 0, y: -12, scale: 1.4 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.6 }}
                  transition={springs.snap}
                >
                  {seconds}
                </m.span>
              </AnimatePresence>

              <m.span
                className="text-[10px] font-bold"
                style={{ color: MIDNIGHT_URGENT_COLOR }}
              >
                sec
              </m.span>
            </m.div>
          ) : (
            // ─── Normal countdown ───
            <m.p
              key="countdown"
              className="text-center text-[10px] font-medium"
              style={{ color: isUrgent ? MIDNIGHT_URGENT_COLOR : undefined }}
              initial={{ opacity: 0 }}
              animate={
                isUrgent
                  ? { opacity: [0.6, 1, 0.6] }
                  : { opacity: 1 }
              }
              exit={{ opacity: 0 }}
              transition={
                isUrgent
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.4 }
              }
            >
              <span className={isUrgent ? "" : "text-text-muted"}>
                {"\u23F0"} Reset dans {hours}h {String(minutes).padStart(2, "0")}m
              </span>
            </m.p>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Full-screen "Nouveau jour" celebration overlay ─── */}
      <AnimatePresence>
        {showOverlay && (
          <m.div
            className="fixed inset-0 z-[350] flex flex-col items-center justify-center cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="alert"
            aria-label="Nouveau jour — touche pour fermer"
            onClick={dismissOverlay}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                dismissOverlay();
              }
            }}
            tabIndex={0}
          >
            {/* Dark backdrop */}
            <m.div
              className="absolute inset-0"
              style={{
                background: MIDNIGHT_BACKDROP,
                backdropFilter: "blur(12px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Stars sparkle */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {stars.map((i) => (
                <CelebrationStar key={i} index={i} />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Rotating moon */}
              <m.div
                className="text-[72px] mb-6"
                initial={{ rotate: -180, scale: 0.3, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{
                  ...springs.elastic,
                  rotate: { type: "spring", stiffness: 80, damping: 12, mass: 1.5 },
                }}
                aria-hidden="true"
              >
                {"\u263E"}
              </m.div>

              {/* "Nouveau jour" text */}
              <m.h1
                className="font-black text-[36px] leading-tight text-center mb-3"
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk')",
                  background: MIDNIGHT_TITLE_GRADIENT,
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  opacity: springs.cinematic,
                  scale: springs.cinematic,
                  backgroundPosition: { duration: 4, repeat: Infinity, ease: "linear" },
                }}
              >
                Nouveau jour
              </m.h1>

              {/* Subtitle */}
              <m.p
                className="text-[15px] font-medium text-center"
                style={{ color: MIDNIGHT_SUBTITLE_COLOR }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.3 }}
              >
                Bonne soiree !
              </m.p>

              {/* Subtext */}
              <m.p
                className="text-[12px] text-center mt-2"
                style={{ color: MIDNIGHT_SUBTEXT_COLOR }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Nouveaux matchs, nouveaux challenges, nouvelle energie
              </m.p>

              {/* Dismiss hint + button — fix 2026-04-23 : user could not skip the 3s overlay */}
              <m.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissOverlay();
                }}
                className="mt-8 px-5 py-2 rounded-full text-[13px] font-medium border tap-target"
                style={{
                  color: MIDNIGHT_SUBTITLE_COLOR,
                  borderColor: MIDNIGHT_SUBTEXT_COLOR,
                  background: "transparent",
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                aria-label="Fermer l'ecran Nouveau jour"
              >
                Continuer &rarr;
              </m.button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

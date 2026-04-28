"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useMidnightReset } from "@/lib/useMidnightReset";
import {
  MIDNIGHT_URGENT_COLOR,
  MIDNIGHT_STAR_COLORS,
  MIDNIGHT_TITLE_GRADIENT,
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

  // Show celebration toast when reset triggers.
  // 2026-04-28 (user feedback "le site crash"): refonte du blocking overlay
  // full-screen en toast non-bloquant. Auto-dismiss en 4s, fermeture immédiate
  // via ✕ — le contenu de la page reste visible et utilisable.
  useEffect(() => {
    if (isResetting) {
      setShowOverlay(true);
      setStars(Array.from({ length: 12 }, (_, i) => i));

      const timer = setTimeout(() => {
        setShowOverlay(false);
        setStars([]);
      }, 4000);

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
        aria-label="Compte à rebours minuit"
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
                {"⏰"} Reset dans {hours}h {String(minutes).padStart(2, "0")}m
              </span>
            </m.p>
          )}
        </AnimatePresence>
      </div>

      {/* ─── "Nouveau jour" celebration toast (non-blocking) ───
          Refonte 2026-04-28 : avant = overlay full-screen black + blur qui
          ressemblait à un crash. Maintenant = toast en haut, contenu de la
          page reste accessible derrière, fermeture immédiate via ✕. */}
      <AnimatePresence>
        {showOverlay && (
          <m.div
            className="fixed top-4 left-1/2 z-[350] -translate-x-1/2 max-w-[92vw] w-[360px]"
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.92 }}
            transition={springs.snap}
            role="status"
            aria-label="Nouveau jour"
          >
            <div
              className="relative rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl border border-white/10"
              style={{
                background: "linear-gradient(135deg, rgba(20,20,30,0.95), rgba(40,30,60,0.95))",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Rotating moon */}
              <m.span
                className="text-[36px] leading-none shrink-0"
                initial={{ rotate: -180, scale: 0.3 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 80, damping: 12 }}
                aria-hidden="true"
              >
                {"☾"}
              </m.span>

              {/* Texts */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-[15px] leading-tight"
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk')",
                    background: MIDNIGHT_TITLE_GRADIENT,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Nouveau jour
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: MIDNIGHT_SUBTEXT_COLOR }}
                >
                  Bonne soirée ! Nouveaux matchs, nouvelle énergie.
                </p>
              </div>

              {/* Dismiss button — visible et tap-able immédiatement */}
              <button
                type="button"
                onClick={dismissOverlay}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors tap-target"
                aria-label="Fermer"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            {/* Subtle stars sparkle inside the toast bounds */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
              {stars.map((i) => (
                <CelebrationStar key={i} index={i} />
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

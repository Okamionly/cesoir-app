"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useMidnightReset } from "@/lib/useMidnightReset";

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
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        top: `${top}%`,
        background: index % 3 === 0 ? "#00FF88" : index % 3 === 1 ? "#8B5CF6" : "#FFF",
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

  // Show celebration overlay when reset triggers
  useEffect(() => {
    if (isResetting) {
      setShowOverlay(true);
      setStars(Array.from({ length: 40 }, (_, i) => i));

      const timer = setTimeout(() => {
        setShowOverlay(false);
        setStars([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isResetting]);

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
            <motion.div
              key="dramatic"
              className="flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="text-[10px] font-medium"
                style={{ color: "#EF4444" }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                {"\u{1F525}"}
              </motion.span>

              <AnimatePresence mode="popLayout">
                <motion.span
                  key={seconds}
                  className="font-black text-[16px] leading-none tabular-nums"
                  style={{
                    fontFamily: "var(--font-display, 'Space Grotesk')",
                    color: "#EF4444",
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
                </motion.span>
              </AnimatePresence>

              <motion.span
                className="text-[10px] font-bold"
                style={{ color: "#EF4444" }}
              >
                sec
              </motion.span>
            </motion.div>
          ) : (
            // ─── Normal countdown ───
            <motion.p
              key="countdown"
              className={`text-center text-[10px] font-medium ${
                isUrgent ? "text-[#EF4444]" : "text-text-muted"
              }`}
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
              {"\u23F0"} Reset dans {hours}h {String(minutes).padStart(2, "0")}m
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Full-screen "Nouveau jour" celebration overlay ─── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-[350] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="alert"
            aria-label="Nouveau jour"
          >
            {/* Dark backdrop */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0.92) 70%)",
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
              <motion.div
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
              </motion.div>

              {/* "Nouveau jour" text */}
              <motion.h1
                className="font-black text-[36px] leading-tight text-center mb-3"
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk')",
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88, #8B5CF6)",
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
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-[15px] font-medium text-center"
                style={{ color: "#888" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.3 }}
              >
                Bonne soiree !
              </motion.p>

              {/* Subtext */}
              <motion.p
                className="text-[12px] text-center mt-2"
                style={{ color: "#555" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Nouveaux matchs, nouveaux challenges, nouvelle energie
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

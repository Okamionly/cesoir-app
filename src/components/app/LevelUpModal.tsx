"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import type { LevelUpData } from "@/lib/useGamification";

interface LevelUpModalProps {
  data: LevelUpData | null;
  onDismiss: () => void;
}

// ─── Confetti particle ───
function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#8B5CF6", "#00FF88", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const tx = (Math.random() - 0.5) * 400;
  const ty = Math.random() * 500 + 200;
  const rot = Math.random() * 720 - 360;
  const delay = Math.random() * 0.8;
  const size = Math.random() * 8 + 4;

  return (
    <div
      className="absolute top-0 rounded-sm"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 1.4,
        backgroundColor: color,
        // @ts-expect-error CSS custom properties for confetti animation
        "--tx": `${tx}px`,
        "--ty": `${ty}px`,
        "--rot": `${rot}deg`,
        animation: `confetti-fall 2s ease-out ${delay}s both`,
      }}
      aria-hidden="true"
    />
  );
}

export default function LevelUpModal({ data, onDismiss }: LevelUpModalProps) {
  const [confetti, setConfetti] = useState<number[]>([]);

  const spawnConfetti = useCallback(() => {
    setConfetti(Array.from({ length: 50 }, (_, i) => i));
  }, []);

  // Spawn confetti on open
  useEffect(() => {
    if (data) {
      const timer = setTimeout(spawnConfetti, 200);
      return () => clearTimeout(timer);
    }
    setConfetti([]);
  }, [data, spawnConfetti]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [data, onDismiss]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label={`Niveau ${data.newLevel} atteint`}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* Confetti burst */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full">
            {/* "LEVEL UP" label */}
            <motion.p
              className="text-[13px] font-bold tracking-[0.3em] uppercase mb-4"
              style={{ color: "#00FF88" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.snap, delay: 0.1 }}
            >
              Level Up
            </motion.p>

            {/* Level number — big spring from 3x scale */}
            <motion.div
              className="relative mb-6"
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springs.rubber}
            >
              {/* Glow pulse behind number */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
                  width: 160,
                  height: 160,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />

              <p
                className="font-black text-[80px] leading-none text-center relative"
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk')",
                  background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {data.newLevel}
              </p>
            </motion.div>

            {/* New title — blur-reveal */}
            <motion.h2
              className="font-bold text-[28px] text-center mb-2"
              style={{
                fontFamily: "var(--font-display, 'Space Grotesk')",
                background: "linear-gradient(135deg, #8B5CF6 0%, #00FF88 50%, #8B5CF6 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                opacity: { ...springs.cinematic, delay: 0.3 },
                filter: { ...springs.cinematic, delay: 0.3 },
                backgroundPosition: { duration: 4, repeat: Infinity, ease: "linear" },
              }}
            >
              {data.newTitle}
            </motion.h2>

            <motion.p
              className="text-[13px] text-center mb-8"
              style={{ color: "#888" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Tu es passe du niveau {data.oldLevel} au niveau {data.newLevel}
            </motion.p>

            {/* Rewards list — staggered slide-in */}
            {data.rewards.length > 0 && (
              <motion.div
                className="w-full space-y-2 mb-8"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.1, delayChildren: 0.6 },
                  },
                }}
              >
                <motion.p
                  className="text-[11px] font-semibold tracking-wider uppercase text-center mb-3"
                  style={{ color: "#666" }}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                  }}
                >
                  Recompenses debloquees
                </motion.p>

                {data.rewards.map((reward, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.9 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: springs.elastic,
                      },
                    }}
                  >
                    <span className="text-[24px] flex-shrink-0" aria-hidden="true">
                      {reward.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-[14px] truncate">
                        {reward.label}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: "#888" }}>
                        {reward.description}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      style={{
                        background:
                          reward.type === "badge"
                            ? "rgba(139,92,246,0.15)"
                            : reward.type === "feature"
                              ? "rgba(0,255,136,0.1)"
                              : reward.type === "boost"
                                ? "rgba(245,158,11,0.15)"
                                : "rgba(236,72,153,0.15)",
                        color:
                          reward.type === "badge"
                            ? "#8B5CF6"
                            : reward.type === "feature"
                              ? "#00FF88"
                              : reward.type === "boost"
                                ? "#f59e0b"
                                : "#ec4899",
                      }}
                    >
                      {reward.type}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Continue button */}
            <motion.button
              onClick={onDismiss}
              className="w-full max-w-[240px] py-3.5 rounded-2xl font-bold text-[15px] text-white"
              style={{ background: "#8B5CF6" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.heavy, delay: 0.8 }}
              whileTap={{ scale: 0.95, transition: springs.micro }}
            >
              Continuer
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

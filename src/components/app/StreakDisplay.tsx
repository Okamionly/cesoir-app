"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface StreakDisplayProps {
  currentStreak: number;
  lastActive: string; // ISO date string
  streakHistory: boolean[]; // last 7 days, true = active
}

const MILESTONES = [3, 7, 14, 30];

function FireParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  const colors = ["#f59e0b", "#ef4444", "#f97316"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        left: `${x}%`,
        bottom: "20%",
        opacity: 0.7,
      }}
      animate={{
        y: [0, -30 - Math.random() * 40],
        x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30],
        opacity: [0.7, 0],
        scale: [1, 0.3],
      }}
      transition={{
        duration: 1 + Math.random() * 0.5,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 0.5,
      }}
      aria-hidden="true"
    />
  );
}

export default function StreakDisplay({
  currentStreak,
  lastActive,
  streakHistory,
}: StreakDisplayProps) {
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  const highStreak = currentStreak > 7;

  // Calculate hours until streak expires (assume expires 24h after lastActive)
  useEffect(() => {
    function compute() {
      const expireTime = new Date(lastActive).getTime() + 24 * 60 * 60 * 1000;
      const diff = Math.max(0, expireTime - Date.now());
      setHoursLeft(Math.floor(diff / 3_600_000));
    }
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [lastActive]);

  const isExpiring = hoursLeft !== null && hoursLeft < 6 && hoursLeft > 0;

  // Flame size grows with streak
  const flameSize = useMemo(() => {
    if (currentStreak >= 30) return 48;
    if (currentStreak >= 14) return 40;
    if (currentStreak >= 7) return 36;
    if (currentStreak >= 3) return 32;
    return 28;
  }, [currentStreak]);

  // Day labels
  const dayLabels = ["L", "M", "M", "J", "V", "S", "D"];

  // Particles for high streaks
  const particles = useMemo(() => {
    if (!highStreak) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1.5,
      x: 35 + Math.random() * 30,
      size: 3 + Math.random() * 4,
    }));
  }, [highStreak]);

  // Next milestone
  const nextMilestone = MILESTONES.find((m) => m > currentStreak) ?? null;

  return (
    <motion.div
      className="rounded-2xl p-4"
      style={{ background: "#141414", border: "1px solid #222" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="region"
      aria-label={`Streak de ${currentStreak} jours`}
    >
      <div className="flex items-center gap-4">
        {/* Flame icon area */}
        <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
          {/* Particles */}
          {particles.map((p) => (
            <FireParticle key={p.id} delay={p.delay} x={p.x} size={p.size} />
          ))}
          {/* Flame */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={
              highStreak
                ? { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }
                : { scale: [1, 1.03, 1] }
            }
            transition={{ repeat: Infinity, duration: highStreak ? 0.8 : 2, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <svg width={flameSize} height={flameSize} viewBox="0 0 24 24" fill="url(#flameGrad)">
              <defs>
                <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
              </defs>
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
            </svg>
          </motion.div>
        </div>

        {/* Streak number */}
        <div className="flex-1">
          <motion.p
            className="font-bold text-[36px] leading-none"
            style={{
              fontFamily: "var(--font-display, 'Space Grotesk')",
              background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            key={currentStreak}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            {currentStreak}
          </motion.p>
          <p className="text-[13px]" style={{ color: "#888" }}>
            jour{currentStreak !== 1 ? "s" : ""} consecutif{currentStreak !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Next milestone */}
        {nextMilestone && (
          <div className="text-right flex-shrink-0">
            <p className="text-[11px]" style={{ color: "#666" }}>Prochain</p>
            <p className="text-white font-bold text-[14px]">{nextMilestone}j</p>
          </div>
        )}
      </div>

      {/* Calendar row - last 7 days */}
      <div className="flex items-center justify-between mt-4 px-1" role="img" aria-label="Activite des 7 derniers jours">
        {streakHistory.slice(-7).map((active, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px]" style={{ color: "#666" }}>
              {dayLabels[i]}
            </span>
            <motion.div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: active
                  ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                  : "#222",
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 500, damping: 25 }}
            >
              {active && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Milestone markers */}
      <div className="flex gap-2 mt-4">
        {MILESTONES.map((m) => (
          <div
            key={m}
            className="flex-1 h-1.5 rounded-full relative"
            style={{ background: "#222" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: currentStreak >= m
                  ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                  : "transparent",
              }}
              initial={{ width: 0 }}
              animate={{ width: currentStreak >= m ? "100%" : "0%" }}
              transition={{ duration: 0.6, delay: MILESTONES.indexOf(m) * 0.1 }}
            />
            <span
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-medium"
              style={{ color: currentStreak >= m ? "#f59e0b" : "#555" }}
            >
              {m}j
            </span>
          </div>
        ))}
      </div>

      {/* Expiry warning */}
      {isExpiring && (
        <motion.div
          className="mt-6 p-2.5 rounded-xl flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" aria-hidden="true">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <span className="text-[12px] font-medium" style={{ color: "#EF4444" }}>
            Streak expire dans {hoursLeft}h
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

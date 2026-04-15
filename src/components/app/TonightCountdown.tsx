"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─── Constants ───────────────────────────────────

const EVENING_START_HOUR = 18; // 18h
const NIGHT_END_HOUR = 2; // 02h

interface TimePhase {
  key: "morning" | "afternoon" | "soon" | "active";
  message: string;
  sub: string;
  gradientFrom: string;
  gradientTo: string;
}

// ─── Helpers ─────────────────────────────────────

function getPhase(hour: number): TimePhase {
  if (hour >= NIGHT_END_HOUR && hour < 12) {
    return {
      key: "morning",
      message: "Prepare-toi...",
      sub: "La soiree est encore loin",
      gradientFrom: "#1e1b4b",
      gradientTo: "#312e81",
    };
  }
  if (hour >= 12 && hour < 16) {
    return {
      key: "afternoon",
      message: "Ca approche...",
      sub: "Plus que quelques heures",
      gradientFrom: "#312e81",
      gradientTo: "#4c1d95",
    };
  }
  if (hour >= 16 && hour < EVENING_START_HOUR) {
    return {
      key: "soon",
      message: "Bientot !",
      sub: "Choisis ton mode, prepare ton profil",
      gradientFrom: "#4c1d95",
      gradientTo: "#7c3aed",
    };
  }
  // Active hours: 18h-02h (or 18-23 + 0-2)
  return {
    key: "active",
    message: "C'est l'heure !",
    sub: "La soiree bat son plein",
    gradientFrom: "#7c3aed",
    gradientTo: "#00FF88",
  };
}

function getTimeUntilEvening(): { hours: number; minutes: number; seconds: number; totalMs: number } {
  const now = new Date();
  const hour = now.getHours();

  // If already in active hours
  if (hour >= EVENING_START_HOUR || hour < NIGHT_END_HOUR) {
    return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  // Calculate time until 18h today
  const target = new Date(now);
  target.setHours(EVENING_START_HOUR, 0, 0, 0);
  const diff = target.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, totalMs: diff };
}

function getDayProgress(): number {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Active hours = progress is 1
  if (hour >= EVENING_START_HOUR || hour < NIGHT_END_HOUR) return 1;

  // From 6h to 18h = 0 to 1
  const startHour = 6;
  const totalMinutes = (EVENING_START_HOUR - startHour) * 60;
  const currentMinutes = Math.max(0, (hour - startHour) * 60 + minute);

  return Math.min(1, currentMinutes / totalMinutes);
}

// ─── Component ───────────────────────────────────

export default function TonightCountdown() {
  const [time, setTime] = useState(getTimeUntilEvening());
  const [phase, setPhase] = useState<TimePhase>(getPhase(new Date().getHours()));
  const [progress, setProgress] = useState(getDayProgress());

  useEffect(() => {
    const tick = () => {
      setTime(getTimeUntilEvening());
      setPhase(getPhase(new Date().getHours()));
      setProgress(getDayProgress());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = phase.key === "active";

  // Ring geometry
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.cinematic}
      className="relative overflow-hidden rounded-3xl p-6"
      style={{
        background: `linear-gradient(135deg, ${phase.gradientFrom}, ${phase.gradientTo})`,
      }}
    >
      {/* Ambient particles */}
      {isActive && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </>
      )}

      <div className="relative z-10 flex items-center gap-5">
        {/* Countdown ring */}
        <div className="relative w-[148px] h-[148px] shrink-0">
          {/* Outer glow when active */}
          {isActive && (
            <motion.div
              className="absolute inset-[-6px] rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(0,255,136,0)",
                  "0 0 30px rgba(0,255,136,0.4)",
                  "0 0 0px rgba(0,255,136,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            {/* Background circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="5"
              fill="none"
            />
            {/* Progress arc */}
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              stroke={isActive ? "#00FF88" : "#8B5CF6"}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Glowing tip */}
            {progress > 0.05 && progress < 1 && (
              <motion.circle
                cx="70"
                cy="70"
                r={radius}
                stroke={isActive ? "#00FF88" : "#a78bfa"}
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`2 ${circumference - 2}`}
                strokeDashoffset={dashOffset}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isActive ? (
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center"
              >
                <span className="text-3xl">{"\uD83C\uDF19"}</span>
                <p className="text-[10px] text-white/70 mt-1 font-medium">EN COURS</p>
              </motion.div>
            ) : (
              <>
                <motion.p
                  key={`${time.hours}${time.minutes}${time.seconds}`}
                  className="text-2xl font-mono font-bold text-white tracking-tight"
                >
                  {`${time.hours}:${time.minutes.toString().padStart(2, "0")}:${time.seconds
                    .toString()
                    .padStart(2, "0")}`}
                </motion.p>
                <p className="text-[9px] text-white/50 mt-0.5 tracking-widest uppercase">
                  avant 18h
                </p>
              </>
            )}
          </div>
        </div>

        {/* Phase text */}
        <div className="flex-1 min-w-0">
          <motion.h3
            key={phase.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.snap}
            className="text-lg font-bold text-white"
          >
            {phase.message}
          </motion.h3>
          <motion.p
            key={phase.sub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-white/60 mt-1 leading-snug"
          >
            {isActive ? (
              <>
                {phase.sub}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-1"
                >
                  {"\u2728"}
                </motion.span>
              </>
            ) : (
              phase.sub
            )}
          </motion.p>

          {/* Phase dots */}
          <div className="flex gap-1.5 mt-3">
            {(["morning", "afternoon", "soon", "active"] as const).map((p) => (
              <motion.div
                key={p}
                className={`h-1.5 rounded-full transition-all ${
                  p === phase.key
                    ? "w-6 bg-white"
                    : (["morning", "afternoon", "soon", "active"].indexOf(p) <
                        ["morning", "afternoon", "soon", "active"].indexOf(phase.key))
                      ? "w-3 bg-white/40"
                      : "w-3 bg-white/15"
                }`}
                layout
                transition={springs.snap}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, moodMatchVariants } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ProfileDot {
  id: number;
  x: number;
  y: number;
  delay: number;
  photo: string;
  name: string;
}

interface RadarAnimationProps {
  /** Whether the radar is actively scanning */
  active: boolean;
  /** Called when scanning completes with the number of profiles found */
  onComplete?: (count: number) => void;
  /** Duration of the scan in ms (default: 4000) */
  duration?: number;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const FAKE_NAMES = [
  "Lea", "Hugo", "Camille", "Lucas", "Chloe",
  "Louis", "Emma", "Jules", "Manon", "Theo",
  "Jade", "Rayan", "Ines", "Nathan", "Lola",
];

function randomInCircle(radius: number): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const r = radius * (0.3 + Math.random() * 0.65);
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

function photoUrl(idx: number): string {
  const gender = idx % 2 === 0 ? "women" : "men";
  return `https://randomuser.me/api/portraits/${gender}/${(idx * 7 + 3) % 80}.jpg`;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function RadarAnimation({
  active,
  onComplete,
  duration = 4000,
}: RadarAnimationProps) {
  const [dots, setDots] = useState<ProfileDot[]>([]);
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const RADAR_SIZE = 260;
  const RADAR_RADIUS = RADAR_SIZE / 2 - 20;

  // Generate profile dots at random intervals while active
  const spawnDot = useCallback(() => {
    setDots((prev) => {
      if (prev.length >= 12) return prev;
      const idx = prev.length;
      const pos = randomInCircle(RADAR_RADIUS);
      const newDot: ProfileDot = {
        id: Date.now() + idx,
        x: pos.x,
        y: pos.y,
        delay: Math.random() * 0.3,
        photo: photoUrl(idx),
        name: FAKE_NAMES[idx % FAKE_NAMES.length],
      };
      return [...prev, newDot];
    });
    setCount((c) => c + 1);
  }, [RADAR_RADIUS]);

  useEffect(() => {
    if (!active) {
      setDots([]);
      setCount(0);
      completedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    completedRef.current = false;
    const interval = duration / 14; // ~14 dots over the duration
    timerRef.current = setInterval(() => {
      spawnDot();
    }, interval);

    const completionTimeout = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      completedRef.current = true;
      onComplete?.(count);
    }, duration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(completionTimeout);
    };
  }, [active, duration, onComplete, spawnDot, count]);

  if (!active) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Radar circle */}
      <div
        className="relative rounded-full border border-accent/20 bg-black/40 backdrop-blur-md"
        style={{ width: RADAR_SIZE, height: RADAR_SIZE }}
      >
        {/* Grid rings */}
        {[0.33, 0.66, 1].map((scale) => (
          <div
            key={scale}
            className="absolute border border-accent/10 rounded-full"
            style={{
              width: RADAR_RADIUS * 2 * scale,
              height: RADAR_RADIUS * 2 * scale,
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%)`,
            }}
          />
        ))}

        {/* Cross lines */}
        <div className="absolute top-1/2 left-[20px] right-[20px] h-[1px] bg-accent/10" />
        <div className="absolute left-1/2 top-[20px] bottom-[20px] w-[1px] bg-accent/10" />

        {/* Pulse rings from center */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-full border border-accent/30"
            style={{
              top: "50%",
              left: "50%",
              width: 20,
              height: 20,
              marginTop: -10,
              marginLeft: -10,
            }}
            animate={{
              scale: [0, 2.5],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.66,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Rotating sweep line */}
        <motion.div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: RADAR_RADIUS,
            height: 2,
            transformOrigin: "0% 50%",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* The line itself */}
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00FF88, transparent)",
            }}
          />
          {/* Glow tip */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00FF88]"
            style={{
              boxShadow: "0 0 12px #00FF88, 0 0 24px #00FF8860",
            }}
          />
        </motion.div>

        {/* Sweep trail (fading cone) */}
        <motion.div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: RADAR_RADIUS,
            height: RADAR_RADIUS,
            transformOrigin: "0% 0%",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div
            className="w-full h-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(0,255,136,0.15) 0deg, transparent 40deg)",
              borderRadius: "0 100% 0 0",
            }}
          />
        </motion.div>

        {/* Profile dots appearing */}
        <AnimatePresence>
          {dots.map((dot) => (
            <motion.div
              key={dot.id}
              className="absolute z-10"
              style={{
                top: `calc(50% + ${dot.y}px)`,
                left: `calc(50% + ${dot.x}px)`,
                marginTop: -14,
                marginLeft: -14,
              }}
              variants={moodMatchVariants.profileDot}
              initial="hidden"
              animate="visible"
              transition={{ delay: dot.delay }}
            >
              <div className="relative">
                <img
                  src={dot.photo}
                  alt={dot.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-[#00FF88]/60"
                  loading="lazy"
                  decoding="async"
                />
                {/* Glow ring around dot */}
                <motion.div
                  className="absolute inset-[-3px] rounded-full border border-[#00FF88]/40"
                  animate={{
                    scale: [1, 1.4],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Center dot (user) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-4 h-4 rounded-full bg-accent border-2 border-white/20" />
        </div>
      </div>

      {/* Counter */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
      >
        <motion.p
          className="text-[28px] font-black text-text tabular-nums"
          key={count}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.snap}
        >
          {count}
        </motion.p>
        <p className="text-[13px] text-text-muted font-medium">
          profils compatibles trouves
        </p>
      </motion.div>
    </div>
  );
}

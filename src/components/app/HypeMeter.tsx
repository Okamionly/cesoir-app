"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

type HypeLevel = "calm" | "active" | "fire";

interface HypeMeterProps {
  variant?: "compact" | "full";
  zone?: string;
}

// --- Helpers ---

function getLevel(count: number): HypeLevel {
  if (count < 15) return "calm";
  if (count < 35) return "active";
  return "fire";
}

function getLevelConfig(level: HypeLevel) {
  switch (level) {
    case "calm":
      return {
        label: "Calme",
        color: "#3B82F6",
        bgGradient: "linear-gradient(135deg, #3B82F6, #60A5FA)",
        ringColor: "rgba(59, 130, 246, 0.3)",
      };
    case "active":
      return {
        label: "Anime",
        color: "#8B5CF6",
        bgGradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
        ringColor: "rgba(139, 92, 246, 0.3)",
      };
    case "fire":
      return {
        label: "En feu",
        color: "#8B5CF6",
        bgGradient: "linear-gradient(135deg, #8B5CF6, #00FF88)",
        ringColor: "rgba(139, 92, 246, 0.4)",
      };
  }
}

function randomCount(): number {
  return Math.floor(Math.random() * 60) + 5;
}

// --- Component ---

export default function HypeMeter({ variant = "full", zone }: HypeMeterProps) {
  const [count, setCount] = useState(42);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated updates every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(randomCount());
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const level = getLevel(count);
  const config = getLevelConfig(level);

  // Gauge percentage (0-100)
  const gaugePercent = Math.min(100, (count / 65) * 100);

  // --- Compact variant ---
  if (variant === "compact") {
    return (
      <motion.div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border"
        animate={level === "fire" ? { boxShadow: [`0 0 0 0 ${config.ringColor}`, `0 0 0 6px transparent`] } : {}}
        transition={level === "fire" ? { duration: 1.5, repeat: Infinity } : {}}
        role="status"
        aria-label={`Activite: ${config.label}, ${count} personnes actives${zone ? ` a ${zone}` : ""}`}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-bold text-text">{count}</span>
        <span className="text-[10px] text-text-muted font-medium">{config.label}</span>
      </motion.div>
    );
  }

  // --- Full variant ---
  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-5"
      role="status"
      aria-label={`Activite: ${config.label}, ${count} personnes actives${zone ? ` pres de ${zone}` : " pres de toi"}`}
    >
      <div className="flex items-center gap-4">
        {/* Circular gauge */}
        <div className="relative w-20 h-20 flex-shrink-0">
          {/* Pulsing ring for fire level */}
          {level === "fire" && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${config.color}` }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          )}

          {/* Background ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-border"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 34 * (1 - gaugePercent / 100),
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#00FF88" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={count}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-display font-bold text-text leading-none"
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: config.bgGradient }}
            >
              {config.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-text">
            {count} personne{count > 1 ? "s" : ""} active{count > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {zone ? `pres de ${zone}` : "pres de toi"}
          </p>

          {/* Level bar */}
          <div className="flex gap-1 mt-2.5">
            {(["calm", "active", "fire"] as HypeLevel[]).map((l) => (
              <div
                key={l}
                className="h-1.5 flex-1 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(128,128,128,0.15)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: l === "fire"
                      ? "linear-gradient(90deg, #8B5CF6, #00FF88)"
                      : getLevelConfig(l).color,
                  }}
                  initial={{ width: "0%" }}
                  animate={{
                    width:
                      level === "fire"
                        ? "100%"
                        : level === "active" && l !== "fire"
                        ? "100%"
                        : level === "calm" && l === "calm"
                        ? "100%"
                        : "0%",
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-text-muted">Calme</span>
            <span className="text-[9px] text-text-muted">Anime</span>
            <span className="text-[9px] text-text-muted">En feu</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

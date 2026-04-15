"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";

interface SparkTimerProps {
  matchedAt: string; // ISO string
  duration?: number; // seconds, default 7200 (2h)
  compact?: boolean;
}

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCompact(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}m`;
}

function getBarColor(progress: number): string {
  // progress: 1 = full time, 0 = expired
  if (progress > 0.6) return "#00FF88";
  if (progress > 0.25) return "#F59E0B";
  return "#EF4444";
}

function getGradientForProgress(progress: number): string {
  if (progress > 0.6) return "linear-gradient(90deg, #00FF88, #8B5CF6)";
  if (progress > 0.25) return "linear-gradient(90deg, #F59E0B, #EF4444)";
  return "linear-gradient(90deg, #EF4444, #EF4444)";
}

export default function SparkTimer({ matchedAt, duration = 7200, compact = false }: SparkTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { secondsLeft, progress } = useMemo(() => {
    const matchedTime = new Date(matchedAt).getTime();
    const expiresAt = matchedTime + duration * 1000;
    const left = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const prog = left / duration;
    return { secondsLeft: left, progress: prog };
  }, [matchedAt, duration, now]);

  const isUrgent = secondsLeft > 0 && secondsLeft < 900; // < 15min
  const isExpired = secondsLeft <= 0;

  // ---------- Compact variant (for chat list) ----------
  if (compact) {
    return (
      <span
        className="text-[10px] font-semibold"
        style={{ color: isExpired ? "#EF4444" : isUrgent ? "#EF4444" : "#8B5CF6" }}
        aria-label={`Temps restant : ${formatCompact(secondsLeft)}`}
      >
        {isExpired ? "Expire" : formatCompact(secondsLeft)}
      </span>
    );
  }

  // ---------- Full variant (for conversation header) ----------
  if (isExpired) {
    return (
      <div className="px-4 py-2 border-b border-border">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2"
        >
          <span className="text-danger text-sm font-semibold" role="alert">
            Match expire — propose un plan !
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-border" role="timer" aria-label={`Temps restant : ${formatTimeLeft(secondsLeft)}`}>
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-semibold text-text shrink-0">
          {formatTimeLeft(secondsLeft)}
        </span>
        <span className="text-[11px] text-text-muted shrink-0">
          pour fixer un plan
        </span>
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: getGradientForProgress(progress),
            }}
            animate={isUrgent ? { opacity: [1, 0.5, 1] } : {}}
            transition={isUrgent ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
          />
        </div>
      </div>
    </div>
  );
}

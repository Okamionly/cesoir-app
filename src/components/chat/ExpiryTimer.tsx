"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ExpiryTimerProps {
  /** ISO string of when the match was created */
  matchedAt: string;
  /** Duration in seconds (default: 48h = 172800s) */
  duration?: number;
  /** Has conversation started? If true, timer is irrelevant */
  conversationStarted?: boolean;
  /** Compact mode for chat list */
  compact?: boolean;
  /** Called when match expires */
  onExpire?: () => void;
  className?: string;
}

// ─────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────

function formatHoursMinutes(seconds: number): string {
  if (seconds <= 0) return "Expire";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

function formatCompact(seconds: number): string {
  if (seconds <= 0) return "Expire";
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `Expire dans ${h}h`;
  const m = Math.floor(seconds / 60);
  return `Expire dans ${m}m`;
}

// ─────────────────────────────────────────
// Circular countdown SVG
// ─────────────────────────────────────────

function CircularCountdown({
  progress,
  isUrgent,
  size = 44,
}: {
  progress: number;
  isUrgent: boolean;
  size?: number;
}) {
  const stroke = 3;
  const radius = (size - stroke * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  const color = isUrgent ? "#EF4444" : progress > 0.5 ? "#00FF88" : "#F59E0B";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset,
            opacity: isUrgent ? [1, 0.4, 1] : 1,
          }}
          transition={
            isUrgent
              ? { strokeDashoffset: springs.heavy, opacity: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } }
              : springs.heavy
          }
        />
      </svg>

      {/* Timer icon in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width={size * 0.35}
          height={size * 0.35}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export default function ExpiryTimer({
  matchedAt,
  duration = 172800, // 48h
  conversationStarted = false,
  compact = false,
  onExpire,
  className = "",
}: ExpiryTimerProps) {
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

  const isExpired = secondsLeft <= 0;
  const isUrgent = !isExpired && secondsLeft < 6 * 3600; // < 6h

  // Fire onExpire callback
  useEffect(() => {
    if (isExpired && onExpire) onExpire();
  }, [isExpired, onExpire]);

  // If conversation started, timer doesn't apply
  if (conversationStarted) return null;

  // ── Compact: for chat list ──
  if (compact) {
    return (
      <motion.span
        className={`text-[10px] font-semibold ${className}`}
        style={{ color: isExpired ? "#EF4444" : isUrgent ? "#EF4444" : "#8B5CF6" }}
        animate={isUrgent && !isExpired ? { opacity: [1, 0.4, 1] } : {}}
        transition={isUrgent ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : {}}
        aria-label={formatCompact(secondsLeft)}
      >
        {formatCompact(secondsLeft)}
      </motion.span>
    );
  }

  // ── Expired state ──
  if (isExpired) {
    return (
      <motion.div
        className={`flex items-center gap-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-4 py-3 ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.elastic}
        role="alert"
      >
        <CircularCountdown progress={0} isUrgent size={36} />
        <div>
          <p className="text-[13px] text-[#EF4444] font-bold">Match expire</p>
          <p className="text-[10px] text-white/30 mt-0.5">
            Le match a ete dissous
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Full timer ──
  return (
    <motion.div
      className={`flex items-center gap-3 bg-black border rounded-xl px-4 py-3 ${
        isUrgent ? "border-[#EF4444]/30" : "border-white/10"
      } ${className}`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.heavy}
      role="timer"
      aria-label={`Match expire dans ${formatHoursMinutes(secondsLeft)}`}
    >
      <CircularCountdown progress={progress} isUrgent={isUrgent} />

      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-bold tabular-nums ${isUrgent ? "text-[#EF4444]" : "text-white"}`}>
          {formatHoursMinutes(secondsLeft)}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {isUrgent ? "Depechee-toi!" : "avant expiration du match"}
        </p>
      </div>

      {/* Urgency indicator */}
      {isUrgent && (
        <motion.div
          className="w-2 h-2 rounded-full bg-[#EF4444]"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SparkCountdownProps {
  startTime: string;
  duration?: number; // seconds, default 7200 (2h)
  onExpire?: () => void;
  compact?: boolean;
}

function getProgress(startMs: number, durationMs: number): number {
  const elapsed = Date.now() - startMs;
  return Math.min(1, Math.max(0, elapsed / durationMs));
}

function getRemainingMs(startMs: number, durationMs: number): number {
  return Math.max(0, durationMs - (Date.now() - startMs));
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expire";
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m`;
}

function getBarColor(progress: number, remainingMs: number): string {
  const fifteenMin = 15 * 60 * 1000;
  if (remainingMs < fifteenMin) return "#EF4444";
  if (progress >= 0.5) return "#F59E0B";
  return "#00FF88";
}

export default function SparkCountdown({
  startTime,
  duration = 7200,
  onExpire,
  compact = false,
}: SparkCountdownProps) {
  const [now, setNow] = useState(Date.now());
  const [expired, setExpired] = useState(false);

  const startMs = new Date(startTime).getTime();
  const durationMs = duration * 1000;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = getProgress(startMs, durationMs);
  const remainingMs = getRemainingMs(startMs, durationMs);
  const isExpired = remainingMs <= 0;
  const isUrgent = remainingMs > 0 && remainingMs < 15 * 60 * 1000;
  const barColor = getBarColor(progress, remainingMs);
  const label = formatRemaining(remainingMs);

  useEffect(() => {
    if (isExpired && !expired) {
      setExpired(true);
      onExpire?.();
    }
  }, [isExpired, expired, onExpire]);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {isExpired ? (
          <motion.span
            className="text-[10px] font-bold text-[#EF4444]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            Expire
          </motion.span>
        ) : (
          <>
            {isUrgent && (
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
            <span
              className="text-[10px] font-bold"
              style={{ color: barColor }}
            >
              {label}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isUrgent && !isExpired && (
            <motion.span
              className="w-2 h-2 rounded-full bg-[#EF4444]"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
          <span
            className="text-[12px] font-bold"
            style={{ color: isExpired ? "#EF4444" : barColor }}
          >
            {label}
          </span>
        </div>
        {!isExpired && (
          <span className="text-[10px] text-text-muted">
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>

      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        {isExpired ? (
          <motion.div
            className="h-full rounded-full bg-[#EF4444]"
            style={{ width: "100%" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        ) : (
          <motion.div
            className="h-full rounded-full transition-colors duration-500"
            style={{
              width: `${Math.max(2, (1 - progress) * 100)}%`,
              backgroundColor: barColor,
            }}
            layout
          />
        )}
      </div>
    </div>
  );
}

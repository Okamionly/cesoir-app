"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";

interface DateCountdownProps {
  targetTime: string;
  venueName: string;
  venueAddress: string;
  onCancel?: () => void;
  onArrive?: () => void;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function DateCountdown({
  targetTime,
  venueName,
  venueAddress,
  onCancel,
  onArrive,
}: DateCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds, totalMinutes, expired } = useMemo(() => {
    const diff = Math.max(0, new Date(targetTime).getTime() - now);
    const totalSec = Math.floor(diff / 1000);
    return {
      hours: Math.floor(totalSec / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      totalMinutes: Math.floor(totalSec / 60),
      expired: diff <= 0,
    };
  }, [targetTime, now]);

  const isUrgent = totalMinutes < 30 && !expired;

  return (
    <motion.div
      className="rounded-2xl p-4 mx-2 my-3 overflow-hidden relative"
      style={{
        background: "#141414",
        border: isUrgent ? "2px solid #8B5CF6" : "1px solid #222",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role="status"
      aria-label={`Rendez-vous dans ${hours} heures ${minutes} minutes`}
    >
      {/* Accent gradient border glow */}
      {isUrgent && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,255,136,0.1))",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <p
          className="text-[13px] font-medium mb-3"
          style={{ color: "#8B5CF6" }}
        >
          Rendez-vous dans...
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[
            { value: pad(hours), label: "h" },
            { value: pad(minutes), label: "m" },
            { value: pad(seconds), label: "s" },
          ].map((unit, i) => (
            <div key={i} className="flex items-baseline gap-0.5">
              <motion.span
                className="font-bold text-[36px] leading-none"
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk')",
                  background: expired
                    ? "#EF4444"
                    : "linear-gradient(135deg, #8B5CF6, #00FF88)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                key={`${unit.value}-${i}`}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {expired ? "00" : unit.value}
              </motion.span>
              <span className="text-[14px] font-medium" style={{ color: "#666" }}>
                {unit.label}
              </span>
              {i < 2 && (
                <span className="text-[24px] font-light mx-1" style={{ color: "#444" }}>
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Venue info */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl mb-4"
          style={{ background: "#1a1a1a" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "rgba(139,92,246,0.2)" }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B5CF6">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-[14px]">{venueName}</p>
            <p className="text-[12px] mt-0.5" style={{ color: "#888" }}>
              {venueAddress}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold text-[14px]"
            style={{ background: "#222", color: "#999" }}
            aria-label="Annuler le rendez-vous"
          >
            Annuler
          </button>
          <motion.button
            onClick={onArrive}
            className="flex-1 py-3 rounded-xl font-semibold text-[14px] text-white"
            style={{ background: "#00FF88", color: "#111" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Signaler votre arrivee"
          >
            J&apos;arrive
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

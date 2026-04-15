"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface DateCountdownProps {
  /** ISO date string of the confirmed date */
  dateTime: string;
  /** Name of the other person */
  partnerName: string;
  /** Place/venue name */
  venue: string;
  /** Optional accent color (defaults to #8B5CF6) */
  accentColor?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // total ms remaining
}

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

export default function DateCountdown({
  dateTime,
  partnerName,
  venue,
  accentColor = "#8B5CF6",
}: DateCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(dateTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(dateTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [dateTime]);

  const isPast = timeLeft.total <= 0;

  // Dynamic gradient based on urgency
  const urgencyGrad =
    timeLeft.hours < 1
      ? `linear-gradient(135deg, #00FF88, ${accentColor})`
      : `linear-gradient(135deg, ${accentColor}, #8B5CF6)`;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{ background: urgencyGrad }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Glow effect */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold mb-1">
        {isPast ? "C'est l'heure !" : "RDV confirme"}
      </p>

      {/* Venue + Partner */}
      <h3 className="text-[18px] font-black text-white leading-tight mb-3">
        {isPast
          ? `Rejoins ${partnerName} !`
          : `RDV avec ${partnerName}`}
      </h3>
      <p className="text-[13px] text-white/70 mb-4 flex items-center gap-1.5">
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/50"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {venue}
      </p>

      {/* Timer display */}
      {!isPast && (
        <div className="flex items-baseline gap-1">
          <TimeUnit value={timeLeft.hours} label="h" />
          <span className="text-white/40 text-[20px] font-light">:</span>
          <TimeUnit value={timeLeft.minutes} label="min" />
          <span className="text-white/40 text-[20px] font-light">:</span>
          <TimeUnit value={timeLeft.seconds} label="s" />
        </div>
      )}

      {isPast && (
        <motion.p
          className="text-[15px] text-white font-bold"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          C'est maintenant !
        </motion.p>
      )}
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-[28px] font-black text-white tabular-nums leading-none">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] text-white/50 font-medium">{label}</span>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useWomenFirst, type UseWomenFirstReturn } from "@/lib/useWomenFirst";
import type { Gender } from "@/lib/supabase-types";

// ── Countdown digit with key-based spring swap ───

function CountdownDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          className="text-[20px] font-black text-text tabular-nums"
          initial={{ y: -12, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.8 }}
          transition={springs.snap}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">
        {label}
      </span>
    </div>
  );
}

// ── Countdown bar ─────────────────────────────────

function CountdownBar({ wf }: { wf: UseWomenFirstReturn }) {
  const { timeLeft, timeLeftFormatted, expired } = wf;

  // Progress: 0 = full time, 1 = expired
  const TOTAL_MS = 24 * 60 * 60 * 1000;
  const progress = Math.min(1, Math.max(0, 1 - timeLeft.total / TOTAL_MS));
  const isUrgent = timeLeft.total > 0 && timeLeft.total < 2 * 60 * 60 * 1000;

  const barColor = expired
    ? "#EF4444"
    : isUrgent
      ? "#F59E0B"
      : "#8B5CF6";

  return (
    <div className="w-full">
      {/* Time digits */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <CountdownDigit
          value={String(timeLeft.hours).padStart(2, "0")}
          label="h"
        />
        <span className="text-[16px] font-bold text-text-muted">:</span>
        <CountdownDigit
          value={String(timeLeft.minutes).padStart(2, "0")}
          label="m"
        />
        <span className="text-[16px] font-bold text-text-muted">:</span>
        <CountdownDigit
          value={String(timeLeft.seconds).padStart(2, "0")}
          label="s"
        />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${(1 - progress) * 100}%` }}
          transition={springs.snap}
        />
      </div>
    </div>
  );
}

// ── Banner shown in chat ──────────────────────────

interface WomenFirstBannerProps {
  conversationId: string | undefined;
  userId: string | undefined;
  userGender: Gender | undefined;
  peerName: string | undefined;
  peerGender: Gender | undefined;
  conversationCreatedAt: string | undefined;
  hasMessages: boolean;
  firstSenderId: string | null;
  mode: string | null;
  onExpire?: () => void;
}

export function WomenFirstBanner({
  conversationId,
  userId,
  userGender,
  peerName,
  peerGender,
  conversationCreatedAt,
  hasMessages,
  firstSenderId,
  mode,
  onExpire,
}: WomenFirstBannerProps) {
  const wf = useWomenFirst(
    conversationId,
    userId,
    userGender,
    peerName,
    peerGender,
    conversationCreatedAt,
    hasMessages,
    firstSenderId,
    mode,
  );

  const [wasExpired, setWasExpired] = useState(false);

  useEffect(() => {
    if (wf.expired && !wasExpired) {
      setWasExpired(true);
      onExpire?.();
    }
  }, [wf.expired, wasExpired, onExpire]);

  // Don't render if women-first doesn't apply or conversation already has messages
  if (!wf.isWomenFirst || hasMessages) return null;

  const isWoman = userGender === "femme";

  return (
    <motion.div
      className="mx-4 mb-3 p-4 rounded-2xl border border-border bg-bg-card"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={springs.snap}
    >
      {/* Icon + prompt */}
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: wf.expired ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)",
          }}
          animate={
            isWoman && !wf.expired
              ? { scale: [1, 1.08, 1] }
              : undefined
          }
          transition={
            isWoman && !wf.expired
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <span className="text-[18px]">
            {wf.expired ? "⏰" : isWoman ? "💬" : "⏳"}
          </span>
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-text">
            {wf.expired
              ? "Match expire"
              : wf.prompt}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {wf.expired
              ? `${peerName ?? "Elle"} n'a pas envoye de message a temps`
              : isWoman
                ? "Les femmes parlent d'abord dans ce mode"
                : `${peerName ?? "Elle"} doit ecrire en premier`}
          </p>
        </div>
      </div>

      {/* Countdown */}
      {!wf.expired && <CountdownBar wf={wf} />}

      {/* Expired state */}
      {wf.expired && (
        <motion.div
          className="mt-2 text-center py-2 rounded-xl bg-[#EF4444]/10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.snap}
        >
          <p className="text-[12px] font-bold text-[#EF4444]">
            Ce match a expire
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Toggle component (standalone, reusable) ───────

interface WomenFirstToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
}

export default function WomenFirstMode({
  enabled,
  onChange,
}: WomenFirstToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-bg-card rounded-2xl border border-border">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            enabled ? "bg-[#8B5CF6]/20" : "bg-border/30"
          }`}
        >
          <span className="text-[16px]">{enabled ? "👑" : "💬"}</span>
        </div>
        <div>
          <p className="text-[14px] text-text font-semibold">
            Les femmes parlent d&apos;abord
          </p>
          <p className="text-[11px] text-text-muted">
            {enabled
              ? "La femme doit ecrire en premier (24h)"
              : "Tout le monde peut ecrire en premier"}
          </p>
        </div>
      </div>

      <motion.button
        role="switch"
        aria-checked={enabled}
        aria-label="Les femmes parlent d'abord"
        onClick={() => onChange(!enabled)}
        className="relative w-[44px] h-[26px] rounded-full shrink-0 tap-target"
        animate={{
          backgroundColor: enabled ? "#8B5CF6" : "var(--color-border)",
        }}
        transition={springs.snap}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          className="absolute top-[3px] left-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md"
          animate={{ x: enabled ? 18 : 0 }}
          transition={springs.snap}
        />
      </motion.button>
    </div>
  );
}

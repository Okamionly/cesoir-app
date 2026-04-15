"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import MusicEqualizer from "@/components/app/MusicEqualizer";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface VibeCardProps {
  emoji: string;
  moodName: string;
  gradient: string;
  songs: string[];
  onShare?: () => void;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function VibeCard({
  emoji,
  moodName,
  gradient,
  songs,
  onShare,
}: VibeCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-white/10 shadow-glow"
      style={{ background: gradient }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springs.elastic}
    >
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative px-6 pt-8 pb-6 text-white">
        {/* Emoji + Equalizer row */}
        <div className="flex items-center justify-between mb-4">
          <motion.span
            className="text-[52px] leading-none drop-shadow-lg"
            animate={{ rotate: [0, -5, 5, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {emoji}
          </motion.span>

          <MusicEqualizer bars={3} size="lg" color="rgba(255,255,255,0.8)" />
        </div>

        {/* Mood name */}
        <h3 className="text-[22px] font-black tracking-tight mb-1">
          {moodName}
        </h3>
        <p className="text-[11px] text-white/60 font-medium mb-5">
          Ce soir je suis...
        </p>

        {/* Song list (max 3) */}
        <div className="space-y-2 mb-6">
          {songs.slice(0, 3).map((song, i) => (
            <motion.div
              key={song}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.heavy, delay: 0.3 + i * 0.1 }}
            >
              <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] font-bold text-white/70 shrink-0">
                {i + 1}
              </span>
              <span className="text-[12px] text-white/90 font-medium truncate">
                {song}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onShare}
          className="w-full py-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 text-[14px] font-bold text-white hover:bg-white/30 transition-colors"
          whileTap={{ scale: 0.95, transition: springs.micro }}
        >
          Ecouter ensemble ?
        </motion.button>

        {/* Branding */}
        <p className="text-center text-[9px] text-white/30 mt-3 font-medium tracking-wider">
          CESOIR
        </p>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { getStarters } from "@/lib/conversationStarters";
import { MODES, type ModeKey } from "@/lib/modes";

interface ModeStartersProps {
  mode: ModeKey;
  profileName: string;
  onSelect: (text: string) => void;
}

export default function ModeStarters({ mode, profileName, onSelect }: ModeStartersProps) {
  const starters = getStarters(mode, profileName);
  const modeData = MODES[mode];

  return (
    <div className="flex flex-col items-center gap-4 py-8 px-5">
      {/* Mode icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
        style={{ background: `${modeData.color}15` }}
        aria-hidden="true"
      >
        {modeData.icon}
      </div>

      <p className="text-[13px] text-text-muted text-center max-w-[260px]">
        Commence la conversation avec {profileName}
      </p>

      {/* Starter bubbles */}
      <div className="w-full flex flex-col gap-2 mt-2">
        {starters.map((text, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(text)}
            className="w-full flex items-start gap-3 bg-bg-card border border-border rounded-2xl px-4 py-3 text-left hover:border-accent/30 active:bg-accent/5 transition-colors tap-target"
          >
            <span
              className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-[14px] shrink-0"
              style={{ background: `${modeData.color}15` }}
              aria-hidden="true"
            >
              {modeData.icon}
            </span>
            <span className="text-[13px] text-text leading-relaxed">{text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

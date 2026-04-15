"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOODS = [
  { emoji: "\uD83D\uDE0A", label: "Content" },
  { emoji: "\uD83D\uDD25", label: "On fire" },
  { emoji: "\uD83E\uDD42", label: "Festif" },
  { emoji: "\uD83C\uDF19", label: "Chill" },
  { emoji: "\uD83D\uDC9C", label: "Love" },
  { emoji: "\uD83C\uDF89", label: "Party" },
  { emoji: "\uD83D\uDE34", label: "Fatigue" },
  { emoji: "\uD83E\uDD14", label: "Pensif" },
] as const;

export type MoodEmoji = (typeof MOODS)[number]["emoji"];

const STORAGE_KEY = "cesoir_mood";

interface StoredMood {
  emoji: MoodEmoji;
  timestamp: number;
}

function loadMood(): MoodEmoji | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredMood;
    // Expire after 12h
    if (Date.now() - stored.timestamp > 12 * 60 * 60_000) return null;
    return stored.emoji;
  } catch {
    return null;
  }
}

function saveMood(emoji: MoodEmoji): void {
  if (typeof window === "undefined") return;
  const stored: StoredMood = { emoji, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

// ---------- Selector Component ----------

interface MoodSelectorProps {
  onSelect?: (emoji: MoodEmoji) => void;
}

export function MoodSelector({ onSelect }: MoodSelectorProps) {
  const [selected, setSelected] = useState<MoodEmoji | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSelected(loadMood());
  }, []);

  function handleSelect(emoji: MoodEmoji) {
    setSelected(emoji);
    saveMood(emoji);
    setOpen(false);
    onSelect?.(emoji);
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors tap-target"
        aria-label="Choisir ton mood"
        aria-expanded={open}
      >
        <span className="text-[18px]">{selected ?? "\uD83D\uDE0A"}</span>
        <span className="text-[11px] text-white/50 font-medium">
          {selected ? MOODS.find((m) => m.emoji === selected)?.label : "Mood"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-wrap gap-1 z-50 w-[200px] shadow-xl"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {MOODS.map((mood) => (
              <button
                key={mood.emoji}
                onClick={() => handleSelect(mood.emoji)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors tap-target ${
                  selected === mood.emoji
                    ? "bg-[#8B5CF6]/20 ring-1 ring-[#8B5CF6]"
                    : "hover:bg-white/5"
                }`}
                aria-label={mood.label}
              >
                <span className="text-[22px]">{mood.emoji}</span>
                <span className="text-[8px] text-white/40">{mood.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Display Badge ----------

interface MoodBadgeProps {
  emoji?: MoodEmoji | null;
  size?: "sm" | "md";
}

export function MoodBadge({ emoji, size = "sm" }: MoodBadgeProps) {
  const resolved = emoji ?? loadMood();
  if (!resolved) return null;

  const textSize = size === "sm" ? "text-[14px]" : "text-[20px]";

  return (
    <span className={`${textSize} leading-none`} role="img" aria-label="Mood">
      {resolved}
    </span>
  );
}

export default function MoodStatus() {
  return <MoodSelector />;
}

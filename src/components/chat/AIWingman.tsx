"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { ModeKey } from "@/lib/modes";

const SUGGESTIONS: Record<string, string[]> = {
  "solo-diner": [
    "Tu recommandes quoi comme resto ce soir ?",
    "Plutot cuisine du monde ou classique ?",
    "Tu as un spot prefere dans le coin ?",
  ],
  "dog-date": [
    "Comment s'appelle ton chien ?",
    "Ton chien s'entend bien avec les autres ?",
    "Tu connais un parc sympa pas loin ?",
  ],
  "night-owl": [
    "Quel est ton bar prefere dans le coin ?",
    "Tu sors souvent en semaine ?",
    "Plutot balade nocturne ou bar ?",
  ],
  langue: [
    "Tu veux pratiquer quelle langue ce soir ?",
    "On se retrouve dans un cafe ?",
    "Tu preferes parler ou ecouter ?",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "C'est quoi ton plan pour ce soir ?",
  "Tu connais un bon endroit pas loin ?",
  "Ca fait longtemps que tu es sur CeSoir ?",
];

const LIEU_SUGGESTION = "Il y a un cafe bien note a 400m";

interface AIWingmanProps {
  mode: string | null;
  messageCount: number;
  onSelectSuggestion: (text: string) => void;
}

export default function AIWingman({ mode, messageCount, onSelectSuggestion }: AIWingmanProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (messageCount >= 3) return null;

  const modeKey = mode as ModeKey;
  const chips = SUGGESTIONS[modeKey] ?? DEFAULT_SUGGESTIONS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25 }}
      className="px-3 pb-2"
      role="region"
      aria-label="Suggestions de messages"
    >
      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2 px-1">
        Suggestions
      </p>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar"
      >
        {chips.map((chip, i) => (
          <motion.button
            key={chip}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            onClick={() => onSelectSuggestion(chip)}
            className="shrink-0 px-3.5 py-2 rounded-full border border-accent/20 bg-accent/5 text-[12px] text-accent font-medium tap-target whitespace-nowrap active:scale-95 transition-transform"
          >
            {chip}
          </motion.button>
        ))}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: chips.length * 0.05, duration: 0.2 }}
          onClick={() => onSelectSuggestion(LIEU_SUGGESTION)}
          className="shrink-0 px-3.5 py-2 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/5 text-[12px] text-[#00FF88] font-medium tap-target whitespace-nowrap active:scale-95 transition-transform"
        >
          📍 {LIEU_SUGGESTION}
        </motion.button>
      </div>
    </motion.div>
  );
}

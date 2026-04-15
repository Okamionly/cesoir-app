"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Badge } from "@/lib/badges";
import { RARITY_CONFIG } from "@/lib/badges";

function BadgePill({ badge, onTap }: { badge: Badge; onTap: () => void }) {
  const color = RARITY_CONFIG[badge.rarity].borderColor;

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onTap}
      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12px] font-medium transition-colors"
      style={{
        borderColor: `${color}30`,
        background: `${color}10`,
        color,
      }}
      aria-label={`Badge ${badge.name}`}
    >
      <span aria-hidden="true">{badge.emoji}</span>
      <span>{badge.name}</span>
    </motion.button>
  );
}

export default function BadgeRow({ badges }: { badges: Badge[] }) {
  const [tooltip, setTooltip] = useState<Badge | null>(null);

  if (badges.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1" role="list" aria-label="Badges">
        {badges.map((b) => (
          <BadgePill
            key={b.id}
            badge={b}
            onTap={() => setTooltip(tooltip?.id === b.id ? null : b)}
          />
        ))}
      </div>

      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 z-10"
          >
            <div className="bg-bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-base">{tooltip.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-text">{tooltip.name}</p>
                  <p className="text-[11px] text-text-muted">{tooltip.description}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

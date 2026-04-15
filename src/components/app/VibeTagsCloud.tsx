"use client";

import { useCallback } from "react";
import { motion } from "motion/react";
import { haptics } from "@/lib/haptics";

const ALL_TAGS = [
  "Cinema",
  "Musique live",
  "Street food",
  "Randonnee",
  "Cocktails",
  "Jeux de societe",
  "Yoga",
  "Photo",
  "Cuisine",
  "Lecture",
  "Danse",
  "Tech",
  "Voyages",
  "Art",
  "Sport",
  "Meditation",
  "Karaoke",
  "Escape Game",
  "Brunch",
  "Marche nocturne",
] as const;

type TagSize = "sm" | "md" | "lg";

const TAG_SIZES: Record<number, TagSize> = {
  0: "lg",
  1: "md",
  2: "sm",
  3: "lg",
  4: "md",
  5: "sm",
  6: "lg",
  7: "sm",
  8: "md",
  9: "lg",
  10: "sm",
  11: "md",
  12: "lg",
  13: "sm",
  14: "md",
  15: "lg",
  16: "sm",
  17: "md",
  18: "lg",
  19: "sm",
};

const SIZE_CLASSES: Record<TagSize, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-base px-5 py-2.5 font-medium",
};

const MAX_SELECTED = 8;

interface VibeTagsCloudProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function VibeTagsCloud({ selected, onChange }: VibeTagsCloudProps) {
  const toggleTag = useCallback(
    (tag: string) => {
      const isSelected = selected.includes(tag);
      if (isSelected) {
        haptics.light();
        onChange(selected.filter((t) => t !== tag));
      } else if (selected.length < MAX_SELECTED) {
        haptics.medium();
        onChange([...selected, tag]);
      } else {
        haptics.error();
      }
    },
    [selected, onChange],
  );

  return (
    <div className="w-full" role="group" aria-label="Choisis tes vibes (max 8)">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-medium" style={{ color: "#111111" }}>
          Tes vibes
        </p>
        <p className="text-xs" style={{ color: "#8B5CF6" }}>
          {selected.length}/{MAX_SELECTED}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {ALL_TAGS.map((tag, i) => {
          const isActive = selected.includes(tag);
          const size = TAG_SIZES[i] ?? "md";
          const animDelay = (i % 5) * 0.4;

          return (
            <motion.button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border transition-colors whitespace-nowrap ${SIZE_CLASSES[size]}`}
              style={{
                backgroundColor: isActive
                  ? "rgba(139,92,246,0.15)"
                  : "rgba(0,0,0,0.03)",
                borderColor: isActive ? "#8B5CF6" : "rgba(0,0,0,0.08)",
                color: isActive ? "#8B5CF6" : "#111111",
              }}
              animate={{
                y: [0, -3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: animDelay,
                ease: "easeInOut",
              }}
              whileTap={{ scale: 0.95 }}
              role="checkbox"
              aria-checked={isActive}
              aria-label={`${tag}${isActive ? " (selectionne)" : ""}`}
              disabled={!isActive && selected.length >= MAX_SELECTED}
            >
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mr-1 inline-block"
                  aria-hidden="true"
                >
                  ✓
                </motion.span>
              )}
              {tag}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

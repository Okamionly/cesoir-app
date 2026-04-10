"use client";

import { MODES, ModeKey, MODE_KEYS } from "@/lib/modes";

interface ModeFilterProps {
  active: ModeKey | "all";
  onChange: (mode: ModeKey | "all") => void;
}

export default function ModeFilter({ active, onChange }: ModeFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      <button
        onClick={() => onChange("all")}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border transition-all tap-target ${
          active === "all"
            ? "border-accent text-white gradient-bg-subtle"
            : "border-border text-text-muted bg-bg-card"
        }`}
      >
        <span>⭐</span>
        <span>Tout</span>
      </button>
      {MODE_KEYS.map((key) => {
        const mode = MODES[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border transition-all tap-target ${
              active === key
                ? "border-accent text-white gradient-bg-subtle"
                : "border-border text-text-muted bg-bg-card"
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.name}</span>
          </button>
        );
      })}
    </div>
  );
}

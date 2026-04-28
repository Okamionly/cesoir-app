"use client";

/**
 * VibePicker — single-row mood selector for /profile (Wave 17, mig 039).
 *
 * Layout matches the Soirées date carousel in EventFilters v3: 5 chips
 * distributed via flex-1 so they fit a 390px viewport WITHOUT a horizontal
 * scroller. Tapping a chip selects it (or unselects if already active),
 * persisting through the useVibe hook.
 *
 * Selected state shows a gradient ring built from the vibe's accent
 * colour, matching how active filters look elsewhere in the app.
 */

import { motion, type Transition } from "motion/react";
import { springs } from "@/lib/motion-design";
import { VIBES, type Vibe } from "@/lib/vibes";
import { useVibe } from "@/lib/useVibe";

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(6);
  }
}

function VibeChip({
  vibe,
  active,
  disabled,
  onClick,
}: {
  vibe: Vibe;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      aria-label={`Vibe ${vibe.label}`}
      disabled={disabled}
      onClick={() => {
        haptic();
        onClick();
      }}
      whileTap={{ scale: 0.92 }}
      transition={springs.snap as Transition}
      className={[
        "relative w-full flex flex-col items-center justify-center",
        "rounded-2xl px-1 py-2.5 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        "tap-target disabled:opacity-60 disabled:cursor-not-allowed",
        active
          ? "text-text"
          : "bg-bg-card border border-border text-text-muted hover:text-text",
      ].join(" ")}
      style={
        active
          ? {
              // Tinted background + colored ring drawn from the vibe accent.
              // Uses inline style so we can interpolate the per-vibe hex.
              background: `${vibe.color}15`,
              boxShadow: `0 0 0 2px ${vibe.color}, 0 0 14px ${vibe.color}55`,
            }
          : undefined
      }
    >
      <span className="text-[20px] leading-none" aria-hidden="true">
        {vibe.emoji}
      </span>
      <span
        className={[
          "text-[10px] font-bold leading-none mt-1.5 tracking-tight",
          active ? "text-text" : "",
        ].join(" ")}
      >
        {vibe.label}
      </span>
    </motion.button>
  );
}

export default function VibePicker() {
  const { vibe, setVibe, saving, loading } = useVibe();

  return (
    <div
      role="group"
      aria-label="Sélection du vibe de ce soir"
      className="flex items-stretch gap-1.5"
    >
      {VIBES.map((v) => {
        const active = vibe === v.id;
        return (
          <div key={v.id} className="flex-1 min-w-0">
            <VibeChip
              vibe={v}
              active={active}
              disabled={saving || loading}
              onClick={() => {
                // Tap the active chip again → clear the vibe.
                setVibe(active ? null : v.id);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

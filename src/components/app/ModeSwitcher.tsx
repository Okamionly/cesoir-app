"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { MODE_ICONS, IconStar } from "@/components/ui/Icons";
import { useProfiles } from "@/lib/useProfiles";
import { useGeolocation } from "@/lib/useGeolocation";
import {
  MODE_SWITCHER_ALL_COLOR,
  MODE_SWITCHER_LIVE_COLOR,
  MODE_SWITCHER_RING_END,
} from "@/lib/mode-switcher-colors";

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface ModeSwitcherProps {
  active: ModeKey | "all";
  onChange: (mode: ModeKey | "all") => void;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function ModeSwitcher({ active, onChange }: ModeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real per-mode active counts — derived from nearby profiles.
  const { latitude, longitude } = useGeolocation();
  const { profiles } = useProfiles(latitude ?? undefined, longitude ?? undefined);
  const activeCounts = useMemo(() => {
    // Wave 15: 4 active modes only.
    const counts: Record<ModeKey | "all", number> = {
      all: profiles.length,
      "solo-diner": 0,
      "plus-one": 0,
      "night-owl": 0,
      "foodie-quest": 0,
    };
    for (const p of profiles) {
      if (p.mode in counts) counts[p.mode] = (counts[p.mode] ?? 0) + 1;
    }
    return counts;
  }, [profiles]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const activeMode = active === "all" ? null : MODES[active];
  const ActiveIcon = active !== "all" ? MODE_ICONS[active] : null;

  return (
    <div ref={containerRef} className="shrink-0 px-5 pb-2 relative z-30">
      {/* Pill trigger */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors"
        style={{
          borderColor: activeMode ? `${activeMode.color}40` : "var(--border)",
          background: activeMode ? `${activeMode.color}08` : "var(--bg-card)",
        }}
        whileTap={{ scale: 0.95, transition: springs.snap }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Mode actif: ${activeMode?.name ?? "Tous les modes"}`}
      >
        {/* Icon */}
        <span className="flex items-center justify-center w-5 h-5">
          {ActiveIcon ? (
            <ActiveIcon size={16} className="text-accent" />
          ) : (
            <IconStar size={16} className="text-accent" />
          )}
        </span>

        {/* Label */}
        <span className="text-[12px] font-semibold text-text">
          {activeMode?.name ?? "Tous les modes"}
        </span>

        {/* Active count */}
        <span className="text-[10px] text-text-muted font-medium">
          {activeCounts[active]} actifs
        </span>

        {/* Chevron */}
        <motion.svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-text-muted"
          animate={{ rotate: open ? 180 : 0 }}
          transition={springs.snap}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute left-5 right-5 mt-1.5 bg-bg-card border border-border rounded-2xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: -8, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.8 }}
            transition={springs.snap}
            style={{ transformOrigin: "top center", maxHeight: 360, overflowY: "auto" }}
            role="listbox"
            aria-label="Selectionner un mode"
          >
            {/* "Tous" option */}
            <ModeOption
              key="all"
              label="Tous les modes"
              icon={<IconStar size={16} className="text-accent" />}
              count={activeCounts.all}
              isActive={active === "all"}
              color={MODE_SWITCHER_ALL_COLOR}
              onClick={() => { onChange("all"); setOpen(false); }}
            />

            {/* Divider */}
            <div className="mx-4 border-t border-border" />

            {/* Mode list */}
            {MODE_KEYS.map((key, i) => {
              const mode = MODES[key];
              const Icon = MODE_ICONS[key];
              return (
                <ModeOption
                  key={key}
                  label={mode.name}
                  icon={Icon ? <Icon size={16} className="text-accent" /> : null}
                  emoji={mode.icon}
                  count={activeCounts[key]}
                  isActive={active === key}
                  color={mode.color}
                  badge={mode.badge}
                  index={i}
                  onClick={() => { onChange(key); setOpen(false); }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
// Single mode option row
// ─────────────────────────────────────────

function ModeOption({
  label,
  icon,
  emoji,
  count,
  isActive,
  color,
  badge,
  index = 0,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  emoji?: string;
  count: number;
  isActive: boolean;
  color: string;
  badge?: string;
  index?: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/5"
      style={{
        background: isActive ? `${color}08` : undefined,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.snap, delay: index * 0.02 }}
      role="option"
      aria-selected={isActive}
    >
      {/* Icon with gradient border when active */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
        style={{ background: `${color}12` }}
      >
        {/* Gradient border ring for active mode */}
        {isActive && (
          <motion.div
            className="absolute -inset-[2px] rounded-[10px]"
            style={{
              background: `linear-gradient(135deg, ${color}, ${MODE_SWITCHER_RING_END})`,
              padding: 2,
              // CSS mask anchor — #000/black is not a visible color,
              // only defines opaque region. Keyword avoids eslint friction.
              mask: "linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)",
              maskComposite: "exclude",
              WebkitMask: "linear-gradient(black 0 0) content-box, linear-gradient(black 0 0)",
              WebkitMaskComposite: "xor",
            }}
            layoutId="mode-active-ring"
            transition={springs.snap}
          />
        )}
        {icon || <span className="text-[14px]">{emoji}</span>}
      </div>

      {/* Label + count */}
      <div className="flex-1 min-w-0">
        <span
          className="text-[13px] font-semibold block truncate"
          style={{ color: isActive ? color : "var(--text)" }}
        >
          {label}
        </span>
      </div>

      {/* Badge if any */}
      {badge && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0"
          style={{ borderColor: `${color}25`, color, background: `${color}08` }}
        >
          {badge}
        </span>
      )}

      {/* Active count */}
      <div className="flex items-center gap-1 shrink-0">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: MODE_SWITCHER_LIVE_COLOR }}
        />
        <span className="text-[10px] text-text-muted font-medium">
          {count}
        </span>
      </div>

      {/* Checkmark for active */}
      {isActive && (
        <motion.svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.snap}
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </motion.svg>
      )}
    </motion.button>
  );
}

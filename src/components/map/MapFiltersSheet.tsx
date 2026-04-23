"use client";

import { m, AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { springs, micro } from "@/lib/motion-design";
import { MODES, MODE_KEYS, type ModeKey } from "@/lib/modes";
import { MODE_COLORS } from "@/lib/mode-colors";

export interface MapFilters {
  modes: ModeKey[]; // empty = all
  showEvents: boolean;
  /** Show profile pins on the map. (U4: events/profils dual-toggle Wave 14.) */
  showProfiles: boolean;
  showFlash: boolean;
  showHeatmap: boolean;
  showOnlineOnly: boolean;
  ageMin: number;
  ageMax: number;
  distanceKm: number;
}

export const DEFAULT_FILTERS: MapFilters = {
  modes: [],
  showEvents: true,
  showProfiles: true,
  showFlash: true,
  showHeatmap: false,
  showOnlineOnly: false,
  ageMin: 18,
  ageMax: 55,
  distanceKm: 10,
};

interface MapFiltersSheetProps {
  open: boolean;
  onClose: () => void;
  filters: MapFilters;
  onChange: (next: MapFilters) => void;
}

/**
 * Glassmorphic bottom-sheet for map filtering.
 * Swipe-down dismiss via motion drag. Full control of active modes,
 * toggles for heatmap/events/online, plus age + distance sliders.
 */
export default function MapFiltersSheet({ open, onClose, filters, onChange }: MapFiltersSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const toggleMode = (k: ModeKey) => {
    const has = filters.modes.includes(k);
    onChange({ ...filters, modes: has ? filters.modes.filter(m => m !== k) : [...filters.modes, k] });
  };

  const resetAll = () => onChange(DEFAULT_FILTERS);

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key="filters-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
          />
          <m.div
            key="filters-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springs.heavy}
            drag="y"
            dragConstraints={{ top: 0, bottom: 600 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.point.y > 300 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-[1101] bg-bg/95 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
            style={{ touchAction: "none" }}
          >
            <div className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-6 pt-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold">Filtres de la carte</h2>
                <m.button
                  onClick={resetAll}
                  className="text-[11px] text-accent font-semibold tap-target"
                  whileTap={micro.tapScale}
                >Reinitialiser</m.button>
              </div>

              {/* Modes chips */}
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Modes</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {MODE_KEYS.map((k) => {
                  const active = filters.modes.includes(k);
                  const color = MODE_COLORS[k] || "var(--color-accent)";
                  return (
                    <m.button
                      key={k}
                      onClick={() => toggleMode(k)}
                      className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold border tap-target flex items-center gap-1"
                      style={{
                        borderColor: active ? color : "var(--color-border)",
                        background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : "transparent",
                        color: active ? color : "var(--color-text-muted)",
                      }}
                      whileTap={micro.tapScale}
                    >
                      <span aria-hidden="true">{MODES[k].icon}</span>
                      <span>{MODES[k].name}</span>
                    </m.button>
                  );
                })}
              </div>

              {/* Toggles */}
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">Affichage</p>
              <div className="space-y-2 mb-5">
                <ToggleRow label="Voir les soirees" checked={filters.showEvents} onChange={(v) => onChange({ ...filters, showEvents: v })} />
                <ToggleRow label="Voir les profils" checked={filters.showProfiles} onChange={(v) => onChange({ ...filters, showProfiles: v })} />
                <ToggleRow label="Flash plans" checked={filters.showFlash} onChange={(v) => onChange({ ...filters, showFlash: v })} />
                <ToggleRow label="Zones chaudes (heatmap)" checked={filters.showHeatmap} onChange={(v) => onChange({ ...filters, showHeatmap: v })} />
                <ToggleRow label="Profils en ligne uniquement" checked={filters.showOnlineOnly} onChange={(v) => onChange({ ...filters, showOnlineOnly: v })} />
              </div>

              {/* Age */}
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                Age : {filters.ageMin} - {filters.ageMax} ans
              </p>
              <div className="flex items-center gap-2 mb-5">
                <input
                  type="range" min={18} max={55} value={filters.ageMin}
                  onChange={(e) => onChange({ ...filters, ageMin: Math.min(Number(e.target.value), filters.ageMax - 1) })}
                  className="flex-1 accent-accent"
                  aria-label="Age minimum"
                />
                <input
                  type="range" min={19} max={60} value={filters.ageMax}
                  onChange={(e) => onChange({ ...filters, ageMax: Math.max(Number(e.target.value), filters.ageMin + 1) })}
                  className="flex-1 accent-accent"
                  aria-label="Age maximum"
                />
              </div>

              {/* Distance */}
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
                Distance : {filters.distanceKm} km
              </p>
              <input
                type="range" min={1} max={50} value={filters.distanceKm}
                onChange={(e) => onChange({ ...filters, distanceKm: Number(e.target.value) })}
                className="w-full accent-accent mb-6"
                aria-label="Distance maximale"
              />

              <m.button
                onClick={onClose}
                className="w-full gradient-bg text-white py-3 rounded-full text-[13px] font-semibold tap-target"
                whileTap={micro.tapScale}
              >
                Voir la carte
              </m.button>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-card border border-border/40 tap-target"
      aria-pressed={checked}
    >
      <span className="text-[12px] text-text">{label}</span>
      <span
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{ background: checked ? "var(--color-accent)" : "var(--color-border)" }}
      >
        <m.span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow"
          animate={{ x: checked ? 16 : 0 }}
          transition={springs.snap}
        />
      </span>
    </button>
  );
}

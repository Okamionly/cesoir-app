"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";

// ---------- Types ----------

export interface FilterValues {
  ageMin: number;
  ageMax: number;
  distanceMax: number;
  gender: "hommes" | "femmes" | "tous";
}

const DEFAULT_FILTERS: FilterValues = {
  ageMin: 18,
  ageMax: 99,
  distanceMax: 25,
  gender: "tous",
};

const STORAGE_KEY = "cesoir_filters";

function loadFilters(): FilterValues {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

function saveFilters(f: FilterValues): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
}

// ---------- Range Slider ----------

function RangeSlider({
  min,
  max,
  value,
  onChange,
  label,
  unit,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  unit: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-sm font-bold text-accent">
          {value}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1 rounded-full bg-border" />
        <div
          className="absolute h-1 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
          aria-label={label}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-accent shadow-md pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}

function DualRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  label,
  unit,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  label: string;
  unit: string;
}) {
  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-sm font-bold text-accent">
          {valueMin}{unit} - {valueMax}{unit}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1 rounded-full bg-border" />
        <div
          className="absolute h-1 rounded-full bg-accent"
          style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }}
        />
        {/* Min handle */}
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= valueMax - 1) onChangeMin(v);
          }}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
          aria-label={`${label} minimum`}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-accent shadow-md pointer-events-none"
          style={{ left: `calc(${pctMin}% - 10px)` }}
        />
        {/* Max handle */}
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= valueMin + 1) onChangeMax(v);
          }}
          className="absolute w-full h-6 opacity-0 cursor-pointer z-20"
          aria-label={`${label} maximum`}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-accent shadow-md pointer-events-none"
          style={{ left: `calc(${pctMax}% - 10px)` }}
        />
      </div>
    </div>
  );
}

// ---------- Gender selector ----------

const GENDER_OPTIONS: { value: FilterValues["gender"]; label: string }[] = [
  { value: "hommes", label: "Hommes" },
  { value: "femmes", label: "Femmes" },
  { value: "tous", label: "Tous" },
];

// ---------- Main Component ----------

export default function FilterSheet({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply?: (filters: FilterValues) => void;
}) {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);

  useEffect(() => {
    if (open) {
      setFilters(loadFilters());
    }
  }, [open]);

  const handleApply = useCallback(() => {
    saveFilters(filters);
    onApply?.(filters);
    onClose();
  }, [filters, onApply, onClose]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <h2 className="text-lg font-bold text-text">Filtres</h2>
              <button
                onClick={handleReset}
                className="text-sm text-accent font-medium"
              >
                Reinitialiser
              </button>
            </div>

            <div className="px-5">
              {/* Age range */}
              <DualRangeSlider
                min={18}
                max={99}
                valueMin={filters.ageMin}
                valueMax={filters.ageMax}
                onChangeMin={(v) => setFilters((f) => ({ ...f, ageMin: v }))}
                onChangeMax={(v) => setFilters((f) => ({ ...f, ageMax: v }))}
                label="Age"
                unit=" ans"
              />

              {/* Distance */}
              <RangeSlider
                min={1}
                max={50}
                value={filters.distanceMax}
                onChange={(v) => setFilters((f) => ({ ...f, distanceMax: v }))}
                label="Distance max"
                unit=" km"
              />

              {/* Gender selection */}
              <div className="mb-6">
                <p className="text-sm font-medium text-text mb-3">Genre</p>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters((f) => ({ ...f, gender: opt.value }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        filters.gender === opt.value
                          ? "gradient-bg text-white"
                          : "bg-bg-card border border-border text-text-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <button
                onClick={handleApply}
                className="w-full py-3.5 rounded-2xl gradient-bg text-white font-bold text-[15px] transition-all active:scale-[0.98] mb-2"
              >
                Appliquer les filtres
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Export hook for consuming filters ----------

export function useFilters(): FilterValues {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  useEffect(() => {
    setFilters(loadFilters());
    const handler = () => setFilters(loadFilters());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return filters;
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { haptics } from "@/lib/haptics";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const SLOTS = [
  { label: "Apres-midi", range: "14h-18h" },
  { label: "Soiree", range: "18h-22h" },
  { label: "Nuit", range: "22h+" },
] as const;

const STORAGE_KEY = "cesoir_availability";

type Grid = boolean[][];

function emptyGrid(): Grid {
  return SLOTS.map(() => DAYS.map(() => false));
}

function loadGrid(): { grid: Grid; repeat: boolean } {
  if (typeof window === "undefined") return { grid: emptyGrid(), repeat: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { grid: Grid; repeat: boolean };
      return parsed;
    }
  } catch {
    // ignore
  }
  return { grid: emptyGrid(), repeat: false };
}

function saveGrid(grid: Grid, repeat: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid, repeat }));
  } catch {
    // ignore
  }
}

function getTodayIndex(): number {
  const day = new Date().getDay();
  // JS: 0=Sun, 1=Mon ... 6=Sat  ->  We want 0=Mon ... 6=Sun
  return day === 0 ? 6 : day - 1;
}

export default function AvailabilitySchedule() {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const todayIdx = getTodayIndex();

  useEffect(() => {
    const saved = loadGrid();
    setGrid(saved.grid);
    setRepeatWeekly(saved.repeat);
  }, []);

  const toggle = useCallback(
    (slotIdx: number, dayIdx: number) => {
      haptics.light();
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[slotIdx][dayIdx] = !next[slotIdx][dayIdx];
        saveGrid(next, repeatWeekly);
        return next;
      });
    },
    [repeatWeekly],
  );

  const toggleRepeat = useCallback(() => {
    haptics.medium();
    setRepeatWeekly((prev) => {
      const next = !prev;
      saveGrid(grid, next);
      return next;
    });
  }, [grid]);

  return (
    <div
      className="w-full rounded-2xl p-4"
      style={{ backgroundColor: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)" }}
      role="grid"
      aria-label="Disponibilites de la semaine"
    >
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "#111111" }}>
        Mes disponibilites
      </h3>

      {/* Header row */}
      <div className="mb-1 grid grid-cols-8 gap-1">
        <div />
        {DAYS.map((day, i) => (
          <div
            key={day}
            className="text-center text-xs font-medium rounded-md py-1"
            style={{
              color: i === todayIdx ? "#8B5CF6" : "#111111",
              border: i === todayIdx ? "1.5px solid #8B5CF6" : "1.5px solid transparent",
            }}
            role="columnheader"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Slot rows */}
      {SLOTS.map((slot, slotIdx) => (
        <div key={slot.label} className="mb-1 grid grid-cols-8 gap-1 items-center" role="row">
          <div
            className="text-xs pr-1 truncate"
            style={{ color: "#666666" }}
            role="rowheader"
            title={`${slot.label} (${slot.range})`}
          >
            {slot.label}
          </div>
          {DAYS.map((day, dayIdx) => {
            const active = grid[slotIdx]?.[dayIdx] ?? false;
            return (
              <motion.button
                key={`${slot.label}-${day}`}
                type="button"
                onClick={() => toggle(slotIdx, dayIdx)}
                className="aspect-square rounded-lg w-full transition-colors"
                style={{
                  background: active
                    ? "linear-gradient(135deg, #8B5CF6, #00FF88)"
                    : "rgba(0,0,0,0.04)",
                  border: active ? "none" : "1px dashed rgba(0,0,0,0.12)",
                }}
                whileTap={{ scale: 0.9 }}
                role="gridcell"
                aria-checked={active}
                aria-label={`${day} ${slot.label} ${slot.range}${active ? " - disponible" : " - indisponible"}`}
              />
            );
          })}
        </div>
      ))}

      {/* Repeat toggle */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: "#666666" }}>
          Repeter chaque semaine
        </span>
        <button
          type="button"
          onClick={toggleRepeat}
          className="relative h-6 w-11 rounded-full transition-colors"
          style={{ backgroundColor: repeatWeekly ? "#8B5CF6" : "rgba(0,0,0,0.12)" }}
          role="switch"
          aria-checked={repeatWeekly}
          aria-label="Repeter chaque semaine"
        >
          <motion.span
            className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full"
            style={{ backgroundColor: "#FFFFFF" }}
            animate={{ x: repeatWeekly ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}

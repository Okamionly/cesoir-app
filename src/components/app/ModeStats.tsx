"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { MODES, type ModeKey } from "@/lib/modes";

export interface ModeStatData {
  mode: ModeKey;
  uses: number;
  matches: number;
  meetups: number;
}

interface ModeStatsProps {
  stats: ModeStatData[];
}

export default function ModeStats({ stats }: ModeStatsProps) {
  const maxValue = useMemo(() => {
    let m = 1;
    for (const s of stats) {
      m = Math.max(m, s.uses, s.matches, s.meetups);
    }
    return m;
  }, [stats]);

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px] text-white/40">Pas encore de stats</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[13px] text-white/40 uppercase tracking-widest font-bold">
        Statistiques par mode
      </h3>

      {stats.map((stat, idx) => {
        const mode = MODES[stat.mode];
        if (!mode) return null;

        return (
          <motion.div
            key={stat.mode}
            className="bg-white/5 rounded-xl p-3 border border-white/5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {/* Mode header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[16px]">{mode.icon}</span>
              <span className="text-[13px] text-white font-semibold">{mode.name}</span>
            </div>

            {/* Bars */}
            <div className="space-y-2">
              <StatBar
                label="Utilisations"
                value={stat.uses}
                max={maxValue}
                color={mode.color}
              />
              <StatBar
                label="Matchs"
                value={stat.matches}
                max={maxValue}
                color="#8B5CF6"
              />
              <StatBar
                label="Rencontres"
                value={stat.meetups}
                max={maxValue}
                color="#00FF88"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-[80px] shrink-0">{label}</span>
      <div className="flex-1 h-[6px] bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-white/60 font-mono w-6 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

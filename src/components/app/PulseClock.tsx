"use client";

import { useState, useEffect } from "react";
import { MODES, ModeKey, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES } from "@/lib/mock-profiles";

// Simulates real-time pulse data (will be Supabase RPC in production)
function generatePulse() {
  const pulse: { mode: ModeKey; count: number }[] = [];
  for (const key of MODE_KEYS) {
    const base = MOCK_PROFILES.filter(p => p.mode === key).length;
    const jitter = Math.floor(Math.random() * 8) - 2;
    const count = Math.max(0, base * 3 + jitter);
    if (count > 0) pulse.push({ mode: key, count });
  }
  return pulse.sort((a, b) => b.count - a.count);
}

export default function PulseClock() {
  const [pulse, setPulse] = useState<{ mode: ModeKey; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPulse(generatePulse());
    const timer = setInterval(() => setPulse(generatePulse()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTotal(pulse.reduce((s, p) => s + p.count, 0));
  }, [pulse]);

  if (!mounted) return <div className="bg-bg-card border border-border rounded-2xl p-4 h-24 animate-pulse" />;

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      {/* Total */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[36px] font-black gradient-text">{total}</span>
            <span className="text-[12px] text-text-muted font-medium">personnes</span>
          </div>
          <p className="text-[11px] text-text-muted">disponibles dans 2 km</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-safe animate-pulse" />
          <span className="text-[10px] text-safe font-bold uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Modes breakdown */}
      <div className="flex flex-wrap gap-1.5">
        {pulse.slice(0, 8).map(p => (
          <div
            key={p.mode}
            className="flex items-center gap-1 bg-accent/5 border border-accent/10 px-2 py-1 rounded-lg transition-all"
          >
            <span className="text-[12px]" aria-hidden="true">{MODES[p.mode].icon}</span>
            <span className="text-[10px] font-bold text-accent">{p.count}</span>
          </div>
        ))}
      </div>

      {/* Activity bar */}
      <div className="flex gap-0.5 mt-3 h-1.5 rounded-full overflow-hidden bg-border">
        {pulse.slice(0, 6).map(p => {
          const pct = (p.count / total) * 100;
          return (
            <div
              key={p.mode}
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: MODES[p.mode].color,
                minWidth: "4px",
              }}
              aria-label={`${MODES[p.mode].name}: ${p.count}`}
            />
          );
        })}
      </div>
    </div>
  );
}

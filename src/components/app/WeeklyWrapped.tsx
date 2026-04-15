"use client";

import { useState, useRef, useCallback } from "react";

export interface WeeklyStats {
  matchCount: number;
  messageCount: number;
  modesUsed: string[];
  distanceKm: number;
  weekLabel: string; // e.g. "7-13 Avr 2026"
}

const defaultStats: WeeklyStats = {
  matchCount: 0,
  messageCount: 0,
  modesUsed: [],
  distanceKm: 0,
  weekLabel: "",
};

function getWeekLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  return `${monday.getDate()}-${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

interface WeeklyWrappedProps {
  stats?: WeeklyStats;
}

export default function WeeklyWrapped({ stats }: WeeklyWrappedProps) {
  const data = stats ?? { ...defaultStats, weekLabel: getWeekLabel() };
  const cardRef = useRef<HTMLDivElement>(null);
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const text = [
      `Ma semaine CeSoir (${data.weekLabel})`,
      `${data.matchCount} matchs`,
      `${data.messageCount} messages`,
      `${data.modesUsed.length} modes explores`,
      `${data.distanceKm.toFixed(1)} km parcourus`,
      "",
      "cesoir-app.vercel.app",
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Mon Weekly Wrapped CeSoir", text });
        setShared(true);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
    }

    if (shared) return;
    setTimeout(() => setShared(false), 2000);
  }, [data, shared]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, #8B5CF6 0%, #ec4899 50%, #f59e0b 100%)",
        }}
      >
        <div className="relative z-10 text-white">
          <p className="text-[11px] uppercase tracking-widest opacity-80 mb-1">
            Weekly Wrapped
          </p>
          <p className="text-[13px] font-medium opacity-90 mb-6">
            {data.weekLabel}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBlock value={data.matchCount} label="Matchs" />
            <StatBlock value={data.messageCount} label="Messages" />
            <StatBlock value={data.modesUsed.length} label="Modes" />
            <StatBlock value={`${data.distanceKm.toFixed(1)}km`} label="Parcourus" />
          </div>

          {data.modesUsed.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1.5">
                Modes explores
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.modesUsed.map(mode => (
                  <span
                    key={mode}
                    className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-medium"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] opacity-50 text-center">cesoir-app.vercel.app</p>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="w-full mt-4 py-3 rounded-full text-sm font-semibold transition-all active:scale-[0.98]"
        style={{
          background: shared ? "#22c55e" : "linear-gradient(135deg, #8B5CF6, #ec4899)",
          color: "#fff",
        }}
      >
        {shared ? "Copie !" : "Partager sur Instagram"}
      </button>
    </div>
  );
}

function StatBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[11px] opacity-70">{label}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePausableInterval } from "@/lib/usePausableInterval";

function getTimeUntil20h() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0);

  // If past 20h, show "C'est maintenant"
  if (now.getHours() >= 20 || now.getHours() < 5) {
    return null;
  }

  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds };
}

export default function Countdown() {
  const [time, setTime] = useState(getTimeUntil20h());

  usePausableInterval(() => setTime(getTimeUntil20h()), 1000);

  if (!time) {
    return (
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex items-center gap-2 bg-[#00FF88]/10 border border-[#00FF88]/20 px-5 py-2.5 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse" />
          <span className="text-[14px] text-[#00FF88] font-bold tracking-wide">C&apos;EST MAINTENANT</span>
        </div>
        <p className="text-[11px] text-text-muted">Les profils sont actifs. Fonce.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-semibold">Ta soiree commence dans</p>
      <div className="flex items-center gap-2">
        <TimeBlock value={time.hours} label="h" />
        <span className="text-accent text-2xl font-light animate-pulse">:</span>
        <TimeBlock value={time.minutes} label="m" />
        <span className="text-accent text-2xl font-light animate-pulse">:</span>
        <TimeBlock value={time.seconds} label="s" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-bg-card border border-border rounded-xl w-16 h-16 flex items-center justify-center">
        <span className="font-display text-[28px] font-bold gradient-text-deco">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] text-text-muted mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

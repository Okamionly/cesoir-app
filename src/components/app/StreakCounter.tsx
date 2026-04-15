"use client";

import { useState, useEffect } from "react";

const STREAK_KEY = "cesoir_streak";
const LAST_VISIT_KEY = "cesoir_last_visit";

interface StreakData {
  count: number;
  lastVisit: string; // YYYY-MM-DD
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
  );
}

function getStreakTier(count: number): { label: string; color: string } {
  if (count >= 30) return { label: "30+", color: "#ef4444" };
  if (count >= 7) return { label: String(count), color: "#f59e0b" };
  return { label: String(count), color: "#8B5CF6" };
}

function loadStreak(): StreakData {
  if (typeof window === "undefined") return { count: 0, lastVisit: "" };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {
    // corrupted — reset
  }
  return { count: 0, lastVisit: "" };
}

function saveStreak(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  localStorage.setItem(LAST_VISIT_KEY, data.lastVisit);
}

export default function StreakCounter() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const today = todayStr();
    const data = loadStreak();

    if (data.lastVisit === today) {
      // Already counted today
      setStreak(data.count);
      return;
    }

    const diff = data.lastVisit ? daysBetween(data.lastVisit, today) : -1;

    let newCount: number;
    if (diff === 1) {
      // Consecutive day
      newCount = data.count + 1;
    } else {
      // Streak broken or first visit
      newCount = 1;
    }

    const updated: StreakData = { count: newCount, lastVisit: today };
    saveStreak(updated);
    setStreak(newCount);
  }, []);

  if (streak === 0) return null;

  const tier = getStreakTier(streak);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
      aria-label={`Streak de ${streak} jours`}
    >
      <span className="text-base" aria-hidden="true">
        {streak >= 30 ? "\uD83D\uDD25" : streak >= 7 ? "\uD83D\uDD25" : "\uD83D\uDD25"}
      </span>
      <span>{tier.label}</span>
    </div>
  );
}

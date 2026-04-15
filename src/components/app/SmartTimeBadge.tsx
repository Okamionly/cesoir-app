"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SmartTimeBadgeProps {
  timestamp: Date;
  variant?: "badge" | "text";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const absDiffMin = Math.abs(diffMin);

  // Future
  if (diffMin > 0) {
    if (absDiffMin <= 15) return "Maintenant";
    if (absDiffMin < 60) return `Dans ${absDiffMin} min`;
    const hours = Math.floor(absDiffMin / 60);
    if (hours < 6) {
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      if (date <= todayEnd) {
        const h = date.getHours();
        const m = date.getMinutes();
        return `Ce soir a ${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
      }
      return `Dans ${hours}h`;
    }
    return `Dans ${hours}h`;
  }

  // Past
  if (absDiffMin <= 15) return "Maintenant";
  if (absDiffMin < 60) return `Il y a ${absDiffMin} min`;
  const hoursAgo = Math.floor(absDiffMin / 60);
  if (hoursAgo < 24) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth()
    ) {
      return "Hier soir";
    }
    return `Il y a ${hoursAgo}h`;
  }
  if (hoursAgo < 48) return "Hier soir";
  return `Il y a ${Math.floor(hoursAgo / 24)}j`;
}

function isNow(date: Date): boolean {
  const diffMs = Math.abs(date.getTime() - Date.now());
  return diffMs <= 15 * 60 * 1000;
}

export default function SmartTimeBadge({
  timestamp,
  variant = "badge",
}: SmartTimeBadgeProps) {
  const [label, setLabel] = useState(() => formatRelativeTime(timestamp));
  const [active, setActive] = useState(() => isNow(timestamp));

  useEffect(() => {
    const tick = () => {
      setLabel(formatRelativeTime(timestamp));
      setActive(isNow(timestamp));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [timestamp]);

  if (variant === "text") {
    return (
      <span
        className="inline-flex items-center gap-1 text-sm"
        style={{ color: active ? "#22c55e" : "#111111" }}
        aria-label={`Horaire : ${label}`}
      >
        {active && (
          <motion.span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "#22c55e" }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
          />
        )}
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: active ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.1)",
        color: active ? "#22c55e" : "#8B5CF6",
      }}
      role="status"
      aria-label={`Horaire : ${label}`}
    >
      {active && (
        <motion.span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: "#22c55e" }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

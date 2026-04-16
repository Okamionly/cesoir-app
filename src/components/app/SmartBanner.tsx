"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import {
  getUserPreferences,
  getSmartNotifications,
  type SmartNotification,
} from "@/lib/recommendations";

// ─────────────────────────────────────────
// Storage
// ─────────────────────────────────────────

const DISMISSED_KEY = "cesoir_smart_banner_dismissed";

function getDismissedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ids: string[]; ts: number };
    // Reset dismissals after 6 hours
    if (Date.now() - parsed.ts > 6 * 60 * 60 * 1000) return [];
    return parsed.ids;
  } catch {
    return [];
  }
}

function dismissId(id: string): void {
  if (typeof window === "undefined") return;
  const current = getDismissedIds();
  current.push(id);
  localStorage.setItem(
    DISMISSED_KEY,
    JSON.stringify({ ids: current, ts: Date.now() }),
  );
}

// ─────────────────────────────────────────
// Icon mapping
// ─────────────────────────────────────────

function getTypeColor(type: SmartNotification["type"]): string {
  switch (type) {
    case "nearby":
      return "#8B5CF6";
    case "compatible":
      return "#00FF88";
    case "event":
      return "#F59E0B";
    case "trending":
      return "#EF4444";
    case "timing":
      return "#06B6D4";
    default:
      return "#8B5CF6";
  }
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function SmartBanner() {
  const [notification, setNotification] = useState<SmartNotification | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to avoid blocking initial render
    const timer = setTimeout(() => {
      const prefs = getUserPreferences();
      const notifications = getSmartNotifications(prefs);
      const dismissed = getDismissedIds();

      // Find first non-dismissed notification
      const active = notifications.find((n) => !dismissed.includes(n.id));
      if (active) {
        setNotification(active);
        setVisible(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    if (notification) {
      dismissId(notification.id);
    }
    setVisible(false);
  }, [notification]);

  const handleAction = useCallback(() => {
    if (notification?.actionRoute && typeof window !== "undefined") {
      window.location.href = notification.actionRoute;
    }
  }, [notification]);

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={springs.snap}
          className="mx-4 mb-3 overflow-hidden"
        >
          <div
            className="relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3.5 overflow-hidden"
          >
            {/* Accent line at top */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ backgroundColor: getTypeColor(notification.type) }}
            />

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2.5 right-3 text-white/30 hover:text-white/60 transition-colors text-sm leading-none"
              aria-label="Fermer"
            >
              x
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: `${getTypeColor(notification.type)}15` }}
              >
                {notification.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight line-clamp-2">
                  {notification.title}
                </p>
                <p className="text-white/45 text-xs mt-1 line-clamp-2">
                  {notification.body}
                </p>

                {/* Action button */}
                {notification.actionLabel && (
                  <button
                    onClick={handleAction}
                    className="mt-2 text-xs font-semibold transition-colors"
                    style={{ color: getTypeColor(notification.type) }}
                  >
                    {notification.actionLabel} &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

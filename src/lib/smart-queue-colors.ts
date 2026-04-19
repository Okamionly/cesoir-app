/**
 * Smart Queue badge colors — domain meta.
 *
 * Per-badge identity colors for the Smart Queue overlay on SwipeCard.
 * These encode product semantics (karma = gold, dispo = vert, intention =
 * violet, distance = cyan) — not UI surface tokens.
 *
 * @see src/components/app/SmartQueueBadge.tsx
 */

export type SmartQueueBadgeKey = "karma" | "dispo" | "intention" | "distance";

export interface SmartQueueBadgeColor {
  /** Foreground (text + pulse dot) */
  color: string;
  /** Translucent background fill */
  bgColor: string;
}

export const SMART_QUEUE_COLORS: Record<SmartQueueBadgeKey, SmartQueueBadgeColor> = {
  karma: {
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.15)",
  },
  dispo: {
    color: "#00FF88",
    bgColor: "rgba(0,255,136,0.15)",
  },
  intention: {
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.15)",
  },
  distance: {
    color: "#06b6d4",
    bgColor: "rgba(6,182,212,0.15)",
  },
};

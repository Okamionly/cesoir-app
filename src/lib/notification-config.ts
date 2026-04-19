/**
 * Per-notification-type colors — domain meta.
 *
 * Each notification type encodes a distinct semantic:
 *   - match    : violet
 *   - like     : pink
 *   - message  : blue
 *   - event    : amber
 *   - challenge: green
 *   - review   : gold
 *   - system   : gray
 *
 * Hex values kept raw because they encode per-category identity, NOT UI
 * surface tokens. Same philosophy as lib/modes.ts / lib/mode-colors.ts.
 *
 * @see lib/design-tokens.ts — canonical UI surface tokens
 */

import type { ReactNode } from "react";

export type ExtendedNotifType =
  | "match"
  | "like"
  | "message"
  | "event"
  | "challenge"
  | "system"
  | "review"
  | "feed";

export interface NotificationTypeConfig {
  icon: ReactNode;
  color: string;
  bgColor: string;
}

/**
 * Semantic color palette for notification types.
 * Used as a lookup when rendering — components supply their own icon JSX.
 */
export const NOTIFICATION_TYPE_COLORS: Record<ExtendedNotifType, Pick<NotificationTypeConfig, "color" | "bgColor">> = {
  match: {
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.12)",
  },
  like: {
    color: "#EC4899",
    bgColor: "rgba(236,72,153,0.12)",
  },
  message: {
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.12)",
  },
  event: {
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.12)",
  },
  challenge: {
    color: "#00FF88",
    bgColor: "rgba(0,255,136,0.12)",
  },
  review: {
    color: "#FBBF24",
    bgColor: "rgba(251,191,36,0.12)",
  },
  system: {
    color: "#6B7280",
    bgColor: "rgba(107,114,128,0.12)",
  },
  feed: {
    color: "#6B7280",
    bgColor: "rgba(107,114,128,0.12)",
  },
};

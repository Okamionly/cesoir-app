/**
 * Floating Action Button menu actions.
 *
 * Each action has a distinct brand color encoding its feature identity.
 * Product-semantic — not UI tokens.
 */

import type { ReactNode } from "react";

export interface FABActionMeta {
  label: string;
  color: string;
  href: string;
}

// Icon rendering is owned by the component — this file only exposes the
// data-side (label/color/href) so raw hex lives outside components/.
//
// 2026-04-24: "Mood Match" previously pointed at /mood-match (404 — the route
// was never shipped). It now points at /modes, the mode selection screen,
// which is the closest semantic match for "pick your vibe for tonight".
// Trust-killer fix flagged by CPO audit (scout report, `FAB /mood-match` dead_code).
export const FAB_ACTIONS_META: FABActionMeta[] = [
  { label: "Mood Match", color: "#8B5CF6", href: "/modes" },
  { label: "Speed Dating", color: "#F59E0B", href: "/speed-dating" },
  { label: "Créer un plan", color: "#00FF88", href: "/plans/create" },
];

export interface FABAction extends FABActionMeta {
  icon: ReactNode;
}

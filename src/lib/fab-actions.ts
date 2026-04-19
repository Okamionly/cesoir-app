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
export const FAB_ACTIONS_META: FABActionMeta[] = [
  { label: "Mood Match", color: "#8B5CF6", href: "/mood-match" },
  { label: "Speed Dating", color: "#F59E0B", href: "/speed-dating" },
  { label: "Creer un plan", color: "#00FF88", href: "/plans/create" },
];

export interface FABAction extends FABActionMeta {
  icon: ReactNode;
}

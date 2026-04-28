// ==============================================================
// Wave 17 — Pre-built date plan templates for /plans/create.
//
// Tap a template -> form is pre-filled with sensible defaults
// (title, mode, when, duration). User then edits and submits
// the existing plan creation flow. Templates are *seeds*, not
// rigid presets: every field stays editable.
//
// Mode mapping rationale (constrained by Wave 15's 4-mode roster
// in src/lib/modes.ts):
//   - diner   -> solo-diner   (food primary intent)
//   - verre   -> plus-one     (looking for a drinks +1)
//   - cinema  -> plus-one     (event +1)
//   - balade  -> night-owl    (best fit; walks tend to be late)
//   - concert -> plus-one     (event +1)
//   - sport   -> plus-one     (need a partner, no sport mode yet)
// ==============================================================

import type { LucideIcon } from "@/components/ui/lucide";
import {
  Wine,
  Film,
  Footprints,
  Music,
  Dumbbell,
  UtensilsCrossed,
} from "lucide-react";
import type { ModeKey } from "./modes";

export type PlanTemplateTime = "tonight" | "tomorrow" | "weekend";

export interface PlanTemplate {
  id: string;
  label: string;
  emoji: string;
  /** Mode the plan attaches to. Saved on flash_plans.mode. */
  mode: ModeKey;
  /** Default title — user can rewrite freely. */
  suggestedTitle: string;
  /** Duration in hours; informs the deadline downstream if needed. */
  suggestedDuration: number;
  /** Coarse time bucket. Resolved to a concrete `whenAt` at apply time. */
  suggestedTime: PlanTemplateTime;
  /** Lucide icon shown next to the emoji in the pill row. */
  icon: LucideIcon;
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "diner",
    label: "Dîner",
    emoji: "🍽️", // 🍽️
    mode: "solo-diner",
    suggestedTitle: "Dîner ce soir",
    suggestedDuration: 2,
    suggestedTime: "tonight",
    icon: UtensilsCrossed,
  },
  {
    id: "verre",
    label: "Verre",
    emoji: "🍷", // 🍷
    mode: "plus-one",
    suggestedTitle: "Un verre quelque part",
    suggestedDuration: 1,
    suggestedTime: "tonight",
    icon: Wine,
  },
  {
    id: "cinema",
    label: "Cinéma",
    emoji: "🎬", // 🎬
    mode: "plus-one",
    suggestedTitle: "Ciné ce soir",
    suggestedDuration: 2,
    suggestedTime: "tonight",
    icon: Film,
  },
  {
    id: "balade",
    label: "Balade",
    emoji: "🚶", // 🚶
    mode: "night-owl",
    suggestedTitle: "Balade nocturne",
    suggestedDuration: 1,
    suggestedTime: "tonight",
    icon: Footprints,
  },
  {
    id: "concert",
    label: "Concert",
    emoji: "🎶", // 🎶
    mode: "plus-one",
    suggestedTitle: "Concert à deux",
    suggestedDuration: 3,
    suggestedTime: "weekend",
    icon: Music,
  },
  {
    id: "sport",
    label: "Sport",
    emoji: "🏃", // 🏃
    mode: "plus-one",
    suggestedTitle: "Session sport",
    suggestedDuration: 1,
    suggestedTime: "tomorrow",
    icon: Dumbbell,
  },
];

/**
 * Resolve a template's `suggestedTime` to a concrete ISO datetime
 * compatible with `<input type="datetime-local">`'s value (YYYY-MM-DDTHH:mm).
 *
 * Defaults:
 *   - tonight  -> today at 20:00 (or +2h if it's already past 20:00)
 *   - tomorrow -> tomorrow at 20:00
 *   - weekend  -> next Saturday at 21:00
 */
export function resolveTemplateWhen(time: PlanTemplateTime): string {
  const now = new Date();
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setMinutes(0);

  if (time === "tonight") {
    target.setHours(20, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setTime(now.getTime() + 2 * 60 * 60 * 1000);
      target.setMinutes(0, 0, 0);
    }
  } else if (time === "tomorrow") {
    target.setDate(target.getDate() + 1);
    target.setHours(20, 0, 0, 0);
  } else {
    // weekend -> next Saturday
    const dow = target.getDay();
    const daysUntilSat = (6 - dow + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilSat);
    target.setHours(21, 0, 0, 0);
  }

  // datetime-local needs local time without timezone suffix.
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    target.getFullYear(),
    "-",
    pad(target.getMonth() + 1),
    "-",
    pad(target.getDate()),
    "T",
    pad(target.getHours()),
    ":",
    pad(target.getMinutes()),
  ].join("");
}

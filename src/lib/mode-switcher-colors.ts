/**
 * Mode switcher brand colors — domain meta.
 *
 * Colors used by ModeSwitcher for the "all modes" fallback indicator,
 * the active-mode gradient ring, and the active-count pulse dot. All hex
 * values here encode product semantics (brand violet for the "all" tile,
 * brand vert for the live-count indicator, brand vert endpoint for the
 * active ring gradient) — NOT UI surface tokens.
 *
 * @see src/components/app/ModeSwitcher.tsx
 * @see src/lib/mode-colors.ts — per-mode brand colors
 */

// "All modes" tile fallback accent (also used when no mode is active)
export const MODE_SWITCHER_ALL_COLOR = "#8B5CF6";

// Active count pulse dot (live indicator)
export const MODE_SWITCHER_LIVE_COLOR = "#00FF88";

// Endpoint of the active gradient ring around a selected mode
// (start = per-mode color, end = brand vert)
export const MODE_SWITCHER_RING_END = "#00FF88";

/**
 * CeSoir Design Tokens
 *
 * Two palettes coexist in the app — DO NOT merge them:
 * - `landing` — public marketing surfaces (dark, cinematic)
 * - `app`     — post-login product surfaces (White Fluo Minimal)
 *
 * Fonts are shared across both palettes and come from the root layout's
 * `next/font` wiring: Space Grotesk (display) + Outfit (body).
 *
 * See `src/app/globals.css` `@theme inline {}` for the Tailwind v4 custom
 * properties that power `bg-bg`, `text-text-muted`, etc. Those tokens are
 * the app palette; this file exposes both palettes as typed TS values for
 * inline styles, gradients, framer/motion variants, and any runtime color
 * computation that Tailwind classes can't express.
 */

// ─────────────────────────────────────────
// LANDING — public, dark, cinematic
// ─────────────────────────────────────────

export const landing = {
  bg: "#0A0A0D",
  fg: "#FFFFFF",
  violet: "#8B5CF6",
  rose: "#EC4899",
  vert: "#00FF88",
  gradient: "linear-gradient(135deg, #8B5CF6, #EC4899, #00FF88)",
  shadow: "0 0 60px rgba(139,92,246,0.4)",
} as const;

export type LandingToken = typeof landing;

// ─────────────────────────────────────────
// APP — White Fluo Minimal (post-login)
// ─────────────────────────────────────────

export const app = {
  bg: "#FFFFFF",
  bgCard: "#FAFAFA",
  bgDark: "#111111",
  border: "#EBEBEB",
  text: "#111111",
  textMuted: "#888888",
  textSoft: "#666666",
  violet: "#8B5CF6",
  vert: "#00FF88",
  gradient: "linear-gradient(135deg, #8B5CF6, #00FF88)",
} as const;

export type AppToken = typeof app;

// ─────────────────────────────────────────
// FONTS — shared
// ─────────────────────────────────────────

export const fonts = {
  display: "var(--font-space-grotesk), sans-serif",
  body: "var(--font-outfit), sans-serif",
} as const;

export type FontToken = typeof fonts;

// ─────────────────────────────────────────
// COMPOSITE — when you need both palettes typed together
// ─────────────────────────────────────────

export const tokens = { landing, app, fonts } as const;
export type Tokens = typeof tokens;

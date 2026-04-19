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
// SPACING — 4px rhythm (eliminates half-step polyp)
// ─────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export type SpacingToken = typeof spacing;

// ─────────────────────────────────────────
// TYPOGRAPHY — 8 canonical sizes
// ─────────────────────────────────────────

export const typography = {
  caption: { fontSize: 10, lineHeight: 14 },
  micro:   { fontSize: 11, lineHeight: 16 },
  small:   { fontSize: 12, lineHeight: 18 },
  body:    { fontSize: 14, lineHeight: 21 },
  title:   { fontSize: 16, lineHeight: 24 },
  heading: { fontSize: 22, lineHeight: 30 },
  display: { fontSize: 32, lineHeight: 40 },
  hero:    { fontSize: 48, lineHeight: 56 },
} as const;

export type TypographyToken = typeof typography;

// ─────────────────────────────────────────
// RADIUS — keep minimal, kill rounded-[Npx] outliers
// ─────────────────────────────────────────

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  round: 9999,
} as const;

export type RadiusToken = typeof radius;

// ─────────────────────────────────────────
// SHADOWS — neutral + brand glow
// ─────────────────────────────────────────

export const shadows = {
  sm: "0 1px 2px rgba(17,17,17,0.05)",
  md: "0 4px 12px rgba(17,17,17,0.08)",
  lg: "0 8px 24px rgba(17,17,17,0.12)",
  glowViolet: "0 0 20px rgba(139,92,246,0.35)",
  glowVert:   "0 0 20px rgba(0,255,136,0.35)",
} as const;

export type ShadowToken = typeof shadows;

// ─────────────────────────────────────────
// Z-INDEX — canonical layer scale
// ─────────────────────────────────────────

export const zIndex = {
  base: 0,
  overlay: 10,
  nav: 20,
  dropdown: 30,
  sticky: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
  fab: 800,
  sos: 900,
  debug: 9999,
} as const;

export type ZIndexToken = typeof zIndex;

// ─────────────────────────────────────────
// COMPOSITE — when you need both palettes typed together
// ─────────────────────────────────────────

export const tokens = {
  landing,
  app,
  fonts,
  spacing,
  typography,
  radius,
  shadows,
  zIndex,
} as const;
export type Tokens = typeof tokens;

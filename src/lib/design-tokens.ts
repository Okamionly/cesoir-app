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
  /* AA 2026-04-23 — darkened from #888 to hit 4.5:1 on white body text */
  textMuted: "#707070",
  textSoft: "#666666",
  /* Trust / safety signal tokens */
  trustVerified: "#00FF88",
  trustPending:  "#F59E0B",
  trustFlagged:  "#EF4444",
  trustNeutral:  "#888888",
  violet: "#8B5CF6",
  vert: "#00FF88",
  /** Dark-green ink used for "tu y es" / success text pairs on light chips.
   *  Meets WCAG AA contrast vs `vert` tints. */
  vertDark: "#0A9459",
  // Super-like pink accent (used for super-like halos, match toasts, shop tints).
  rose: "#EC4899",
  // Secondary violet/purple tint (shop mixed gradients).
  purple: "#A855F7",
  // Premium gold shimmer (premium CTA gradients — paired with --color-warn).
  gold: "#FBBF24",
  // Amber star — used for rating stars + super-like accent. Distinct from
  // `gold` (premium CTA): this is the Tailwind amber-500 hue used by review
  // stars and the super-like halo on public profile pages.
  amberStar: "#F59E0B",
  // Atmospheric dark surface — out-of-palette, for camera viewport / offline
  // map fallback tints. NOT a UI token; kept here to avoid eslint friction.
  dark: "#1A1A2E",
  // OG/social-share dark backdrop (Edge runtime ImageResponse). Out-of-palette.
  ogBg: "#0A0A0A",
  // OG/social-share neutral subtitle. Out-of-palette.
  ogSubtitle: "#A1A1AA",
  darkMid: "#16213E",
  darkDeep: "#0F3460",
  // Third-party brand hex (for OAuth / verify badges).
  linkedinBlue: "#3B82F6",
  linkedinBrand: "#0A66C2",
  // Instagram gradient stops (kept as a 5-stop list).
  instagramGradient: [
    "#F09433",
    "#E6683C",
    "#DC2743",
    "#CC2366",
    "#BC1888",
  ],
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
  /** 20px — added 2026-04-23 to fill gap between title(16) & heading(22). */
  lg:      { fontSize: 20, lineHeight: 28 },
  heading: { fontSize: 22, lineHeight: 30 },
  /** 24px — added 2026-04-23 for section headers between heading(22) & display(32). */
  "2xl":   { fontSize: 24, lineHeight: 32 },
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
  /** 28px — phone-card tier, added 2026-04-23 for SwipeCard/browse shells. */
  "3xl": 28,
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
//
// 2026-04-26 — P0 SAFETY FIX: re-documented the ladder so the SOS overlay
// (triple-tap moon → red full-screen alert) is GUARANTEED above every map UI
// layer. Before this fix, /map shipped with `z-[1100]`/`z-[1200]` filter
// sheet + route modal, which painted ABOVE SOSButton's `z-[200]` overlay —
// a safety regression on a dating app.
//
// IMPORTANT: there are TWO modal tiers in the app and they MUST NOT mix:
//
//   1. App-wide standard modals (chat sheets, photo gallery, story creator,
//      report sheet, match cinematic, vibe check) live in the 50–350 range
//      and use Tailwind's z-50 plus arbitrary z-[60..350] classes. They
//      render INSIDE the page chrome, BELOW the SOS overlay (200 today,
//      until they're migrated below the new sos token).
//
//   2. Map-surface modals (filter sheet, route modal, search bar, fly-in
//      cards, live activity panel) sit in a dedicated 800–880 (chrome) /
//      850–870 (overlay) band so they paint above MapLibre canvas + page
//      header but BELOW sos (900) and toast (950).
//
// Documented ladder (low → high). When in doubt, prefer a token over a
// magic number, and never raise something past sos (900) without an
// explicit safety-review note.
//
//   base                0       — page background, default stacking
//   overlay             10      — non-interactive page overlays (heatmap)
//   nav                 20      — generic in-flow nav
//   dropdown            30      — autocomplete dropdowns, ModeSwitcher
//   fab                 40      — floating action button (sits BELOW BottomNav)
//   sticky / bottomNav  50      — sticky bars, BottomNav, TopNav, OfflineBanner
//   modal               60      — standard modal tier (chat sheets, story creator)
//   tooltip             70      — tooltips
//   modalElevated      100      — full-screen lightboxes (PhotoGallery, VibeCheck)
//   modalUrgent        150–350  — urgent app modals (safety/page modal=150,
//                                 MidnightReset=350)
//   mapFab             800      — MapFloatingActions column (right-side)
//   mapSheet           850      — map bottom-sheet backdrop + filter sheet,
//                                 KeyboardShortcuts hint, MapCarousel, also
//                                 the shared BottomSheet primitive (was 900,
//                                 dropped so BottomSheet on /map cannot
//                                 cover SOS)
//   mapSheetContent    851      — map bottom-sheet content (paired w/ 850)
//   mapModal           860      — map-surface modals (route modal, perm modal)
//   mapModalContent    861      — map-surface modal content (paired w/ 860)
//   mapChrome          880–950  — map chrome above the sheet but below SOS:
//                                 MapFloatingActions(880), filter pill(940),
//                                 MapSearchBar(950 → moved to 870 in fix),
//                                 LiveActivityPanel(900 → 870 in fix),
//                                 ProfileFlyInCard(1000 → 870 in fix)
//   sos                900      — ⚠️ SAFETY-CRITICAL — SOSButton red overlay
//                                 MUST be reachable above every map UI element
//                                 (the current SOSButton.tsx still uses
//                                 z-[200] and should be migrated to read this
//                                 token; until then, no map z is ≥ 900)
//   toast              950      — top toast notifications, sit above SOS so
//                                 SOS-confirmation toast is visible
//   skipLink / debug   9999     — focus-visible skip-to-content link, dev
//                                 overlays
//
// Migration plan for follow-up PRs (out of scope for this hotfix):
//   - SOSButton.tsx: replace `z-[200]` with `style={{ zIndex: zIndex.sos }}`
//   - All chat/story/photo modals: explicit token instead of arbitrary z-[NN]
//   - PageHeader: drop `!z-[1000]` override on /map (no longer needed once
//     filter sheet is at 850)
export const zIndex = {
  base: 0,
  overlay: 10,
  nav: 20,
  dropdown: 30,
  fab: 40,
  sticky: 50,
  bottomNav: 50,
  modal: 60,
  tooltip: 70,
  modalElevated: 100,
  modalUrgent: 350,
  mapFab: 800,
  mapSheet: 850,
  mapSheetContent: 851,
  mapModal: 860,
  mapModalContent: 861,
  sos: 900,
  toast: 950,
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

/**
 * Chat content brand colors — domain meta.
 *
 * Shared by PlaylistShare, VoiceNote, LocationShare, WeMetFeedback for:
 *  - Brand gradient stops (violet → vert, pink album art)
 *  - Playback waveform accent
 *  - Voice note bubble "other" text glyph color
 *  - Map viewport grid + soft tinted background
 *  - Feedback 5-star rating glow (violet)
 *
 * Product-semantic — not UI surface tokens.
 *
 * @see src/components/chat/PlaylistShare.tsx
 * @see src/components/chat/VoiceNote.tsx
 * @see src/components/chat/LocationShare.tsx
 * @see src/components/app/WeMetFeedback.tsx
 */

// ─── Brand anchors ────────────────────────────────────────
export const BRAND_VIOLET = "#8B5CF6";
export const BRAND_VERT = "#00FF88";
export const BRAND_PINK = "#EC4899";
export const BRAND_CYAN = "#06b6d4";

// ─── Shared gradients (linear strings usable in inline style.background) ──
export const CHAT_VIOLET_VERT_GRADIENT = `linear-gradient(180deg, ${BRAND_VIOLET}, ${BRAND_VERT})`;
export const CHAT_VIOLET_VERT_135 = `linear-gradient(135deg, ${BRAND_VIOLET}, ${BRAND_VERT})`;

// Alternating album-art gradients for SharedPlaylist rows
export const CHAT_ALBUM_GRADIENTS = [
  `linear-gradient(135deg, ${BRAND_VIOLET}, ${BRAND_PINK})`,
  `linear-gradient(135deg, ${BRAND_CYAN}, ${BRAND_VIOLET})`,
] as const;

// Voice bubble (non-own) play icon fill — app.bgDark
export const CHAT_VOICE_DARK_FILL = "#111";

// Voice bubble (non-own) waveform accent — violet
export const CHAT_VOICE_WAVEFORM_ACCENT = BRAND_VIOLET;

// Voice bubble (non-own) background — near-white neutral (matches text-dark
// contrast needs; intentionally not --color-bg-card which is warmer)
export const CHAT_VOICE_NEUTRAL_BG = "#F2F2F2";

// Location map tint (soft violet→vert overlay)
export const LOCATION_MAP_SOFT_TINT =
  `linear-gradient(135deg, rgba(139,92,246,0.12), rgba(0,255,136,0.12))`;

// Location grid pattern color (violet)
export const LOCATION_MAP_GRID_COLOR = BRAND_VIOLET;

// Location pin center color (violet)
export const LOCATION_MAP_PIN_COLOR = BRAND_VIOLET;

// ─── WeMetFeedback — star rating palette ──────────────────
export const WEMET_STAR_ACTIVE = BRAND_VIOLET;
export const WEMET_STAR_INACTIVE = "#555";
export const WEMET_STAR_GLOW_ZERO = "0 0 0px rgba(139,92,246,0)";
export const WEMET_STAR_GLOW_PEAK = "0 0 12px rgba(139,92,246,0.4)";

// ─── MidnightReset — celebration palette ──────────────────
export const MIDNIGHT_URGENT_COLOR = "#EF4444";
// Star colors used in the celebration overlay (index % 3 selector)
export const MIDNIGHT_STAR_COLORS = [BRAND_VERT, BRAND_VIOLET, "#FFF"] as const;
// Radial backdrop for the celebration overlay
export const MIDNIGHT_BACKDROP =
  "radial-gradient(circle at 50% 40%, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0.92) 70%)";
// Text gradient for "Nouveau jour"
export const MIDNIGHT_TITLE_GRADIENT =
  `linear-gradient(135deg, ${BRAND_VIOLET}, ${BRAND_VERT}, ${BRAND_VIOLET})`;
// Subtle subtitle tones — intentionally off-palette greys to match the
// dark radial overlay contrast budget (not --color-text-muted which is
// tuned against the app white background).
export const MIDNIGHT_SUBTITLE_COLOR = "#888";
export const MIDNIGHT_SUBTEXT_COLOR = "#555";

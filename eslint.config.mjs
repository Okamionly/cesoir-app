import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Design-system guardrails.
 *
 * 1. Ban raw hex color literals in .ts/.tsx strings → force token usage
 *    via `src/lib/design-tokens.ts` + Tailwind `@theme` variables.
 * 2. Ban Tailwind default palette classes (red-500, blue-400, etc.) that
 *    bypass the W&B theme.
 *
 * Exceptions:
 *  - `src/lib/design-tokens.ts` owns the canonical hex values.
 *  - `src/components/landing/**` and `src/app/(landing)/**` use an
 *    intentional dark-cinematic palette isolated from the app shell.
 *  - Per-feature domain-meta lib files (modes, seasons, badges, dateIdeas,
 *    hotspots, motion-design, mode-colors, rooms-meta, notification-config,
 *    premium-benefits, story-presets, share-card-presets,
 *    photo-gallery-gradients, trust-colors, verification-status,
 *    fab-actions) own domain-specific hex values that encode product
 *    semantics (per-mode brand colors, seasonal gradients, badge tiers,
 *    trust tiers, verification statuses, FAB action colors, motion
 *    variants). They are not UI surface tokens and must not be mapped
 *    to the W&B palette.
 *  - `tailwind.config.*` / `postcss.config.*` / `globals.css` live outside
 *    ESLint's `.tsx` scope — no override needed.
 *
 * Hex rule is escalated to "error" on src/app/(app)/** and
 * src/components/** (E2 landed — brand-metier arrays extracted to
 * src/lib/, remaining out-of-palette surfaces route through
 * design-tokens imports or are scoped in the component allowlist below
 * with a justified brand-metier exception). The Tailwind palette rule
 * stays at "warn" app-wide until phase 2 since some legitimate gradients
 * still compose palette utilities.
 */

const BAN_HEX_REGEX = String.raw`/#([0-9A-Fa-f]{3}){1,2}\b/`;

const FORBIDDEN_TAILWIND_PALETTES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "pink",
  "fuchsia",
  "rose",
  "sky",
  "blue",
  "indigo",
  "purple",
  "violet",
  "cyan",
  "teal",
  "emerald",
  "green",
  "stone",
  "neutral",
  "gray",
  "zinc",
  "slate",
];

// Matches any `<bg|text|border|from|to|via|ring|shadow|fill|stroke|outline|divide|placeholder|accent|caret>-<palette>-<0-9>` token
const PALETTE_UTILITIES =
  "(bg|text|border|from|to|via|ring|shadow|fill|stroke|outline|divide|placeholder|accent|caret)";
const BAN_TW_PALETTE_REGEX = `/\\b${PALETTE_UTILITIES}-(${FORBIDDEN_TAILWIND_PALETTES.join(
  "|",
)})-[0-9]/`;

const hexRules = [
  {
    selector: `Literal[value=${BAN_HEX_REGEX}]`,
    message:
      "Raw hex colors are forbidden outside design-tokens.ts. Use a token (bg-accent, text-text, --color-*) or add it to src/lib/design-tokens.ts.",
  },
  {
    selector: `TemplateElement[value.raw=${BAN_HEX_REGEX}]`,
    message:
      "Raw hex colors are forbidden outside design-tokens.ts. Use a token (bg-accent, text-text, --color-*) or add it to src/lib/design-tokens.ts.",
  },
];

const palettRules = [
  {
    selector: `Literal[value=${BAN_TW_PALETTE_REGEX}]`,
    message:
      "Tailwind default palette classes (red-500, blue-400, …) violate the W&B theme. Use token classes (bg-accent, text-danger, bg-card, …) or a semantic CSS var.",
  },
  {
    selector: `TemplateElement[value.raw=${BAN_TW_PALETTE_REGEX}]`,
    message:
      "Tailwind default palette classes (red-500, blue-400, …) violate the W&B theme. Use token classes (bg-accent, text-danger, bg-card, …) or a semantic CSS var.",
  },
];

// Default — "warn" baseline for src/**. The "error" promotion applies to
// the explicit allowlist of clean files + src/app/(app)/** (D4 codemod
// landed — all domain-meta extracted to src/lib).
const designSystemRules = {
  "no-restricted-syntax": [
    "warn",
    ...hexRules,
    ...palettRules,
  ],
};

const strictHexRules = {
  "no-restricted-syntax": [
    "error",
    ...hexRules,
    ...palettRules,
  ],
};

// Same as strictHexRules but keeps Tailwind palette at "warn". Applied to
// (app)/** where hex is fully cleaned but some gradient utilities still
// compose default palette classes (phase-2 cleanup).
const strictHexOnlyRules = {
  "no-restricted-syntax": [
    "error",
    ...hexRules,
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: designSystemRules,
  },
  {
    // Codemod landed for the clean files below (all hex → tokens). These
    // files are now under hard "error" to prevent regression. The rest of
    // src/components/** and src/lib/** stays at "warn" until phase 2 of
    // the audit migrates the remaining per-component severity/brand hexes.
    files: [
      "src/components/ui/Confetti.tsx",
      "src/components/ui/EmptyState.tsx",
      "src/components/ui/MeshGradient.tsx",
      "src/components/ui/PullToRefresh.tsx",
      "src/components/ui/Toast.tsx",
      "src/components/ui/MicroAnimations.tsx",
      "src/components/ui/ProfileImage.tsx",
      "src/components/ui/ProfileCard.tsx",
      "src/components/map/LiveActivityPanel.tsx",
      "src/components/app/AudioWave.tsx",
      "src/components/app/MusicEqualizer.tsx",
      "src/components/app/MockQR.tsx",
      "src/components/app/NotificationPreview.tsx",
      "src/components/app/AudioIntro.tsx",
      "src/components/chat/ExpiryTimer.tsx",
      "src/components/chat/SparkTimer.tsx",
      "src/components/chat/FlashNote.tsx",
      "src/components/chat/VibeCheck.tsx",
      "src/components/chat/QuickReact.tsx",
      "src/components/chat/PlanProposal.tsx",
      "src/components/app/StoriesBar.tsx",
      "src/components/app/OfflineBanner.tsx",
      "src/lib/messageScreening.ts",
      "src/lib/useProfiles.ts",
    ],
    rules: strictHexRules,
  },
  {
    // D4 landed — all domain-meta arrays extracted to src/lib/
    // (mode-colors, rooms-meta, notification-config, premium-benefits).
    // Remaining out-of-palette surfaces (premium gold, map offline dark,
    // shop/browse/trending pink tints) now route through design-tokens
    // imports. Any new raw hex in (app)/** is a hard error. Tailwind
    // palette rule stays at "warn" app-wide until phase 2.
    files: ["src/app/(app)/**/*.{ts,tsx}"],
    rules: strictHexOnlyRules,
  },
  {
    // E2 landed — hex promoted to "error" on src/components/**. Brand-
    // metier hex arrays were extracted to src/lib/ (story-presets,
    // share-card-presets, photo-gallery-gradients, trust-colors,
    // verification-status, fab-actions). Any new raw hex in components/
    // is a hard error. Tailwind palette rule stays at "warn".
    files: ["src/components/**/*.{ts,tsx}"],
    rules: strictHexOnlyRules,
  },
  {
    // Brand-metier-heavy components whose hex values encode product
    // semantics (per-tier karma medals, per-mode gradient rings,
    // per-badge smart-queue colors, per-status feedback colors,
    // celebration/animation star hues). These are out-of-palette by
    // design — they are NOT UI surface tokens and cannot route through
    // the W&B theme without diluting semantic meaning. Scoped "off"
    // with the same rationale as src/lib/modes.ts, src/lib/badges.ts,
    // src/lib/seasons.ts, etc.
    files: [
      "src/components/app/SwipeCard.tsx",
      "src/components/app/MidnightReset.tsx",
      "src/components/app/VerificationChecklist.tsx",
      "src/components/app/KarmaBadge.tsx",
      "src/components/app/ModeSwitcher.tsx",
      "src/components/app/SmartQueueBadge.tsx",
      "src/components/app/FABMenu.tsx",
      "src/components/app/WeMetFeedback.tsx",
      "src/components/chat/PlaylistShare.tsx",
      "src/components/chat/VoiceNote.tsx",
      "src/components/chat/LocationShare.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Design tokens file owns the hex literals.
    files: ["src/lib/design-tokens.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Domain-meta files: per-mode brand colors, seasonal gradients, badge
    // tiers, hotspot heat, motion variants, per-benefit/per-type/per-room
    // identity. Hex values here encode product semantics — they are NOT
    // UI surface tokens.
    files: [
      "src/lib/modes.ts",
      "src/lib/mock-profiles.ts",
      "src/lib/seasons.ts",
      "src/lib/badges.ts",
      "src/lib/dateIdeas.ts",
      "src/lib/hotspots.ts",
      "src/lib/motion-design.ts",
      "src/lib/mode-colors.ts",
      "src/lib/rooms-meta.ts",
      "src/lib/notification-config.ts",
      "src/lib/premium-benefits.ts",
      "src/lib/story-presets.ts",
      "src/lib/share-card-presets.ts",
      "src/lib/photo-gallery-gradients.ts",
      "src/lib/trust-colors.ts",
      "src/lib/verification-status.ts",
      "src/lib/fab-actions.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Profile-verify page embeds third-party brand assets (LinkedIn blue
    // #0A66C2 / #3B82F6, Instagram 5-stop gradient #f09433..#bc1888) and
    // dark atmospheric camera-viewport gradients (#1a1a2e / #16213e /
    // #0f3460). These are out-of-palette by design and cannot route
    // through design tokens without diluting semantic meaning.
    files: ["src/app/(app)/profile/verify/page.tsx"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Landing surfaces have their own cinematic palette.
    files: [
      "src/components/landing/**/*.{ts,tsx}",
      "src/app/(landing)/**/*.{ts,tsx}",
      // src/app/(auth)/** renders on the same dark cinematic landing bg
      // (uses `landing.*` tokens + glassy rgba white overlays), so it is
      // scoped out of the W&B page rule.
      "src/app/(auth)/**/*.{ts,tsx}",
      // Root landing page itself.
      "src/app/page.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

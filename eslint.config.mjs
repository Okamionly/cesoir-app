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
 *  - `src/lib/modes.ts`, `src/lib/mock-profiles.ts`, `src/lib/seasons.ts`,
 *    `src/lib/badges.ts`, `src/lib/dateIdeas.ts`, `src/lib/hotspots.ts`,
 *    `src/lib/motion-design.ts` own domain-specific hex values that
 *    encode product semantics (per-mode brand colors, seasonal
 *    gradients, badge tiers, motion variants). They are not UI surface
 *    tokens and must not be mapped to the W&B palette.
 *  - `tailwind.config.*` / `postcss.config.*` / `globals.css` live outside
 *    ESLint's `.tsx` scope — no override needed.
 *
 * Hex rule is escalated to "error" on `src/components/**` and `src/lib/**`
 * once the codemod landed. The Tailwind palette rule stays at "warn" for
 * now since some legitimate gradients still compose palette utilities.
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
    // src/app/** stays at "warn" until the parallel page codemod (C1).
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
    // Design tokens file owns the hex literals.
    files: ["src/lib/design-tokens.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Domain-meta files: per-mode brand colors, seasonal gradients, badge
    // tiers, hotspot heat, motion variants. Hex values here encode product
    // semantics — they are not UI surface tokens.
    files: [
      "src/lib/modes.ts",
      "src/lib/mock-profiles.ts",
      "src/lib/seasons.ts",
      "src/lib/badges.ts",
      "src/lib/dateIdeas.ts",
      "src/lib/hotspots.ts",
      "src/lib/motion-design.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    // Landing surfaces have their own cinematic palette.
    files: [
      "src/components/landing/**/*.{ts,tsx}",
      "src/app/(landing)/**/*.{ts,tsx}",
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

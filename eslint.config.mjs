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
 *  - `tailwind.config.*` / `postcss.config.*` / `globals.css` live outside
 *    ESLint's `.tsx` scope — no override needed.
 *
 * Both rules are "warn" so the lint surface is visible without blocking
 * the pipeline — migration is tracked in the design audit doc.
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

const designSystemRules = {
  "no-restricted-syntax": [
    "warn",
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
    // Design tokens file owns the hex literals.
    files: ["src/lib/design-tokens.ts"],
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

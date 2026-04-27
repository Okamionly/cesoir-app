import { z } from "zod";

/**
 * Central zod schemas for API boundary validation.
 *
 * Wave 12 (2026-04-20): wired into every /api/** route via `safeParse`.
 * On failure, routes MUST return 400 with `{ error: 'validation_failed',
 * issues }`. Never trust client input — RLS is defence-in-depth, not
 * the only line.
 */

// ─────────────────────────────────────────────────────────────
// Profile / auth (pre-existing, kept stable)
// ─────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  name: z.string().min(1, "Prenom requis").max(50, "50 caracteres max"),
  age: z.number().int().min(18, "18 ans minimum").max(99, "99 ans maximum"),
  gender: z.enum(["homme", "femme", "autre"], { message: "Genre requis" }),
  looking_for: z.enum(["hommes", "femmes", "tous"], { message: "Preference requise" }),
  bio: z.string().max(500, "500 caracteres max").optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message vide").max(2000, "2000 caracteres max").trim(),
});

export const reportSchema = z.object({
  reason: z.enum([
    "fake_profile", "harassment", "inappropriate_content",
    "spam", "underage", "scam", "other",
  ], { message: "Raison requise" }),
  details: z.string().max(1000, "1000 caracteres max").optional(),
});

export const authSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caracteres minimum").max(128, "128 caracteres max"),
});

// ─────────────────────────────────────────────────────────────
// Swipe / matching
// ─────────────────────────────────────────────────────────────

/**
 * Mode keys — keep in sync with `src/lib/modes.ts` MODE_KEYS.
 * Wave 15 PMF focus: 4 active modes. Legacy slugs accepted at API boundary
 * for backwards-compat (clients may still send old enum on first deploy)
 * but are ignored downstream.
 */
const MODE_KEY_VALUES = [
  // Active (Wave 15)
  "solo-diner", "plus-one", "night-owl", "foodie-quest",
  // TODO WAVE-16: accepted for backwards-compat until 30-day client rollout.
  "tourist", "breakup", "new-in-town", "langue", "dog-date",
  "seasonal", "fit-date", "culture-club", "sober-tonight", "gamer-night",
] as const;

export const swipeSchema = z.object({
  // Keep as string (not strict uuid) — tests and legacy clients pass short
  // identifiers; RLS + PG FK constraints reject unknown ids server-side.
  targetId: z.string().min(1, "targetId requis"),
  direction: z.enum(["like", "pass", "superlike"], {
    message: "direction invalide (like | pass | superlike)",
  }),
  mode: z.string().max(40).optional(),
});

export const recommendationsQuerySchema = z.object({
  lat: z.coerce.number()
    .refine((v) => !Number.isNaN(v), "lat requis")
    .refine((v) => v >= -90 && v <= 90, "lat hors plage [-90, 90]"),
  lng: z.coerce.number()
    .refine((v) => !Number.isNaN(v), "lng requis")
    .refine((v) => v >= -180 && v <= 180, "lng hors plage [-180, 180]"),
  mode: z.enum(MODE_KEY_VALUES).nullish(),
  maxDistance: z.coerce.number().positive().max(50, "maxDistance ≤ 50km").optional(),
  minAge: z.coerce.number().int().min(18).max(99).optional(),
  maxAge: z.coerce.number().int().min(18).max(99).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  genderFilter: z.enum(["men", "women", "all", "nonbinary"]).optional(),
});

// ─────────────────────────────────────────────────────────────
// Wallet (Roses)
// ─────────────────────────────────────────────────────────────

/**
 * Wallet mutations from the client are SPEND-only.
 *
 * Audit 2026-04-26 (P0 fraud fix): the `earn` action was removed because it
 * let any authenticated user grant themselves arbitrary roses via
 * `POST /api/wallet/roses { action: "earn", amount: 999999 }`. Roses are
 * server-issued only — they originate from Stripe webhooks, the
 * `claim_invite_code` RPC, or achievement triggers. The route still returns
 * HTTP 410 (Gone) for legacy clients that send `action: "earn"`.
 */
export const walletActionSchema = z.object({
  action: z.enum(["spend"], { message: "action doit être 'spend'" }),
  amount: z.number()
    .int("amount doit être un entier")
    .positive("amount doit être positif")
    .max(100_000, "amount trop élevé"),
});

// ─────────────────────────────────────────────────────────────
// Undos
// ─────────────────────────────────────────────────────────────

export const undoSchema = z.object({
  targetId: z.string().min(1, "targetId requis"),
  originalAction: z.enum(["like", "pass", "superlike"], {
    message: "originalAction invalide",
  }),
});

// ─────────────────────────────────────────────────────────────
// Squad
// ─────────────────────────────────────────────────────────────

export const squadJoinSchema = z.object({
  invite_code: z.string()
    .trim()
    .length(6, "Code invalide (6 caracteres)")
    .regex(/^[A-Z0-9]+$/i, "Code alphanumérique uniquement"),
});

// ─────────────────────────────────────────────────────────────
// Stripe checkout / portal
// ─────────────────────────────────────────────────────────────

export const stripeCheckoutSchema = z.object({
  priceId: z.string().min(1, "priceId requis"),
  mode: z.enum(["subscription", "payment"], {
    message: "mode doit être 'subscription' ou 'payment'",
  }),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const stripePortalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ProfileInput = z.infer<typeof profileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type SwipeInput = z.infer<typeof swipeSchema>;
export type RecommendationsQueryInput = z.infer<typeof recommendationsQuerySchema>;
export type WalletActionInput = z.infer<typeof walletActionSchema>;
export type UndoInput = z.infer<typeof undoSchema>;
export type SquadJoinInput = z.infer<typeof squadJoinSchema>;
export type StripeCheckoutInput = z.infer<typeof stripeCheckoutSchema>;
export type StripePortalInput = z.infer<typeof stripePortalSchema>;

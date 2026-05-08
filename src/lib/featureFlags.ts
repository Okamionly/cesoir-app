/**
 * Feature flags — single source of truth for toggling product surfaces.
 *
 * Free-first launch (Wave 13, 2026-04-20) : the founder decided the app ships
 * 100% free — no paywall, no paid roses, no Premium subscription. Stripe code
 * remains wired (routes, plans, webhooks) but inert behind `MONETIZATION_ENABLED`.
 * When Wave N+1 introduces pricing we just flip this flag (and set
 * `STRIPE_ENABLED=true` on the server).
 *
 * Import rules:
 *   - Client components: read via `FEATURE_FLAGS.monetizationEnabled`
 *   - Server API routes: cross-check with `process.env.STRIPE_ENABLED === "true"`
 *     (never trust the client flag alone for paywall decisions)
 *
 * Do NOT delete the Stripe files — reactivation has to be a one-line change.
 */

export const FEATURE_FLAGS = {
  /**
   * Master switch for monetization surfaces (paywall UI, premium CTAs,
   * rose shop, "upgrade" banners, boosts store, subscription settings).
   *
   * When false :
   *   - /premium, /shop, /wallet are not advertised in nav/CTAs
   *   - "Roses" wallet badge is hidden from browse/chat
   *   - FlashNote + super like + undo + boost behave as if every user is premium
   *   - CGU/Privacy surface the "free forever" disclaimer
   *
   * When true (future) :
   *   - All of the above re-surface; premium-gate.ts regains its teeth
   *   - Must be paired with `STRIPE_ENABLED=true` on the server
   */
  monetizationEnabled: process.env.MONETIZATION_ENABLED === "true" || process.env.STRIPE_ENABLED === "true",
} as const;

/** Convenience alias — exported for grep-ability in gating sites. */
export const MONETIZATION_ENABLED = FEATURE_FLAGS.monetizationEnabled;

// Wave 2 revenue activation: set STRIPE_ENABLED=true in Vercel to flip the
// paywall. MONETIZATION_ENABLED reads from env at module load — no rebuild needed.

/**
 * Server-side guard — combines the client flag with the explicit env flag.
 * API routes should call this (not just `MONETIZATION_ENABLED`) so staging
 * can flip STRIPE_ENABLED without a rebuild.
 */
export function isMonetizationEnabledServer(): boolean {
  if (!MONETIZATION_ENABLED) return false;
  return process.env.STRIPE_ENABLED === "true";
}

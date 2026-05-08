/**
 * Stripe plans & products catalog.
 *
 * Single source of truth — never hardcode a price ID in a page.
 *
 * ─── Price ID source ──────────────────────────────────────────────────────
 * `priceId` is resolved from env vars at module load time. The convention is:
 *
 *     STRIPE_PRICE_<UPPERCASE_INTERNAL_ID>
 *
 * e.g. internal id `premium_monthly` → env `STRIPE_PRICE_PREMIUM_MONTHLY`.
 *
 * Provision the products + prices in Stripe and obtain real `price_xxx`
 * IDs by running:
 *
 *     STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/setup-stripe-products.ts
 *
 * The script prints an env-var block ready to paste into Vercel. See
 * `scripts/README.md` for the full walkthrough.
 *
 * ─── Why env-driven, not hardcoded? ───────────────────────────────────────
 * Price IDs differ per Stripe environment (test vs live, dev vs prod), and
 * regenerating products gives new ids. Reading from env avoids committing
 * environment-specific values into source. Security against `price_<rogue>`
 * is preserved by the whitelist functions (`getPlanByPriceId`,
 * `getShopProductByPriceId`) — they only return a known plan/product if the
 * resolved id matches one we know about.
 *
 * Missing/empty env vars resolve to `""`, which means the corresponding
 * plan/product is effectively disabled (`getPlanByPriceId("")` → undefined,
 * checkout returns 400).
 */

export type PlanInterval = "month" | "year";

export interface SubscriptionPlan {
  /** Stable internal id, used in DB as `plan_id` */
  id: string;
  /** Display name (FR) */
  name: string;
  /** Stripe price ID (price_xxx) — resolved from STRIPE_PRICE_<ID_UPPER> env */
  priceId: string;
  /** Price per billing cycle, in cents */
  amountCents: number;
  /** Currency (lowercase) */
  currency: string;
  /** month or year */
  interval: PlanInterval;
  /** Free trial in days (0 = no trial) */
  trialDays: number;
  /** Tier — used for feature gating */
  tier: "free" | "premium";
  /** Savings vs monthly (for annual) — shown on UI */
  savePercent?: number;
  /** Short tagline for card */
  tagline: string;
  /** Full list of features */
  features: string[];
  /** True if this is the recommended plan */
  recommended?: boolean;
}

/**
 * Resolve a Stripe price ID from the env using the convention
 * `STRIPE_PRICE_<UPPERCASE_INTERNAL_ID>`. Returns "" if missing — the
 * checkout whitelist will then refuse it with a 400 instead of forwarding
 * a placeholder to Stripe.
 */
function resolvePriceId(internalId: string): string {
  const key = `STRIPE_PRICE_${internalId.toUpperCase()}`;
  return process.env[key] ?? "";
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    priceId: "",
    amountCents: 0,
    currency: "eur",
    interval: "month",
    trialDays: 0,
    tier: "free",
    tagline: "Pour commencer",
    features: [
      "Matching de base",
      "10 likes / jour",
      "1 rose / semaine",
      "Chat avec tes matchs",
    ],
  },
  {
    id: "premium_monthly",
    name: "Premium Mensuel",
    priceId: resolvePriceId("premium_monthly"),
    amountCents: 1299,
    currency: "eur",
    interval: "month",
    trialDays: 7,
    tier: "premium",
    tagline: "Flexibilité maximale",
    features: [
      "Likes illimités",
      "Voir qui t'a like",
      "Mode Invisible",
      "Retour en arrière",
      "Boost 1x/semaine",
      "5 roses / semaine",
      "Badge Premium doré",
    ],
  },
  {
    id: "premium_annual",
    name: "Premium Annuel",
    priceId: resolvePriceId("premium_annual"),
    amountCents: 7999,
    currency: "eur",
    interval: "year",
    trialDays: 7,
    tier: "premium",
    savePercent: 49,
    recommended: true,
    tagline: "Le meilleur rapport qualité / prix",
    features: [
      "Tout le Premium Mensuel",
      "2 mois offerts (vs mensuel)",
      "Badge exclusif annuel",
    ],
  },
] as const;

// ─────────────────────────────────────────
// One-time products (roses packs, boosts)
// ─────────────────────────────────────────

export interface ShopProduct {
  id: string;
  name: string;
  priceId: string;
  amountCents: number;
  currency: string;
  /** 'roses' | 'boosts' */
  productType: "roses" | "boosts";
  /** Amount of the virtual item delivered (e.g. 5 roses) */
  quantity: number;
  icon: string;
  popular?: boolean;
  bestValue?: boolean;
}

export const SHOP_PRODUCTS: readonly ShopProduct[] = [
  // Roses
  {
    id: "roses_5",
    name: "Bouquet",
    priceId: resolvePriceId("roses_5"),
    amountCents: 299,
    currency: "eur",
    productType: "roses",
    quantity: 5,
    icon: "🌹",
  },
  {
    id: "roses_15",
    name: "Jardin",
    priceId: resolvePriceId("roses_15"),
    amountCents: 699,
    currency: "eur",
    productType: "roses",
    quantity: 15,
    icon: "🌺",
    popular: true,
  },
  {
    id: "roses_30",
    name: "Roseraie",
    priceId: resolvePriceId("roses_30"),
    amountCents: 999,
    currency: "eur",
    productType: "roses",
    quantity: 30,
    icon: "🌷",
    bestValue: true,
  },
  // Boosts
  {
    id: "boosts_3",
    name: "Pack Starter",
    priceId: resolvePriceId("boosts_3"),
    amountCents: 399,
    currency: "eur",
    productType: "boosts",
    quantity: 3,
    icon: "⚡",
  },
  {
    id: "boosts_10",
    name: "Pack Pro",
    priceId: resolvePriceId("boosts_10"),
    amountCents: 999,
    currency: "eur",
    productType: "boosts",
    quantity: 10,
    icon: "⚡⚡",
    bestValue: true,
  },
] as const;

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Return a plan by its internal id. */
export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}

/**
 * Return a plan from its Stripe price id.
 *
 * Acts as a whitelist: an empty `priceId` (when env var is missing) won't
 * accidentally match an empty input — we explicitly refuse the empty case
 * so an unconfigured plan can never be checked-out.
 */
export function getPlanByPriceId(priceId: string): SubscriptionPlan | undefined {
  if (!priceId) return undefined;
  return SUBSCRIPTION_PLANS.find((p) => p.priceId === priceId);
}

/** Return a one-time product by id. */
export function getShopProductById(id: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.id === id);
}

/**
 * Return a one-time product by Stripe price id. Empty input refused —
 * see `getPlanByPriceId` for rationale.
 */
export function getShopProductByPriceId(priceId: string): ShopProduct | undefined {
  if (!priceId) return undefined;
  return SHOP_PRODUCTS.find((p) => p.priceId === priceId);
}

/** Format a price in cents to a localized string. */
export function formatPrice(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Stripe plans & products catalog.
 *
 * Les price IDs sont des placeholders — il faut :
 *   1) Créer les produits dans Stripe Dashboard (Test mode)
 *   2) Remplacer les `priceId` ici par les vrais `price_xxx`
 *   3) Voir STRIPE_SETUP.md
 *
 * Single source of truth : on ne hardcode jamais un price ID dans une page.
 */

export type PlanInterval = "month" | "year";

export interface SubscriptionPlan {
  /** Stable internal id, used in DB as `plan_id` */
  id: string;
  /** Display name (FR) */
  name: string;
  /** Stripe price ID (price_xxx) — replace when Stripe products are created */
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
    priceId: "price_REPLACE_ME_monthly",
    amountCents: 999,
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
    priceId: "price_REPLACE_ME_annual",
    amountCents: 5999,
    currency: "eur",
    interval: "year",
    trialDays: 7,
    tier: "premium",
    savePercent: 50,
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
    priceId: "price_REPLACE_ME_roses_5",
    amountCents: 299,
    currency: "eur",
    productType: "roses",
    quantity: 5,
    icon: "🌹",
  },
  {
    id: "roses_15",
    name: "Jardin",
    priceId: "price_REPLACE_ME_roses_15",
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
    priceId: "price_REPLACE_ME_roses_30",
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
    priceId: "price_REPLACE_ME_boosts_3",
    amountCents: 399,
    currency: "eur",
    productType: "boosts",
    quantity: 3,
    icon: "⚡",
  },
  {
    id: "boosts_10",
    name: "Pack Pro",
    priceId: "price_REPLACE_ME_boosts_10",
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

/** Return a plan from its Stripe price id. */
export function getPlanByPriceId(priceId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.priceId === priceId);
}

/** Return a one-time product by id. */
export function getShopProductById(id: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.id === id);
}

/** Return a one-time product by Stripe price id. */
export function getShopProductByPriceId(priceId: string): ShopProduct | undefined {
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

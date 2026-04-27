#!/usr/bin/env tsx
/**
 * setup-stripe-products.ts
 *
 * Provisions the 7 CeSoir products + prices in your Stripe account
 * (test mode by default) so the placeholders in `src/lib/stripe/plans.ts`
 * can be replaced with real `price_xxx` IDs.
 *
 * USAGE
 * ─────
 *   STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/setup-stripe-products.ts
 *
 * To run against LIVE mode (real money — KYC required):
 *   STRIPE_SECRET_KEY=sk_live_xxx npx tsx scripts/setup-stripe-products.ts --confirm-prod
 *
 * IDEMPOTENCY
 * ───────────
 * The script tags every product with `metadata.cesoir_product_id` (= the
 * stable internal id from `plans.ts`). On re-run it looks up products by
 * that metadata and re-uses them instead of creating duplicates.
 *
 * For prices: Stripe doesn't allow updating amount/currency on an existing
 * price. So if a matching active price is found (same amount/currency/
 * recurring) we re-use it; otherwise we create a new one and archive the
 * older active prices on the product.
 *
 * OUTPUT
 * ──────
 * The script prints, at the end, an env-var block ready to paste into
 * Vercel (or `.env.local`). See `scripts/README.md` for wiring instructions.
 */

import Stripe from "stripe";
import {
  SUBSCRIPTION_PLANS,
  SHOP_PRODUCTS,
  type SubscriptionPlan,
  type ShopProduct,
} from "../src/lib/stripe/plans";

// ─────────────────────────────────────────────────────────────────────────────
// Safety checks
// ─────────────────────────────────────────────────────────────────────────────

const SECRET = process.env.STRIPE_SECRET_KEY;
const ARGS = new Set(process.argv.slice(2));
const CONFIRM_PROD = ARGS.has("--confirm-prod");

if (!SECRET) {
  console.error("\n❌ STRIPE_SECRET_KEY is missing.");
  console.error(
    "   Run: STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/setup-stripe-products.ts\n",
  );
  process.exit(1);
}

const isLive = SECRET.startsWith("sk_live_");
const isTest = SECRET.startsWith("sk_test_");

if (!isLive && !isTest) {
  console.error(
    "\n❌ STRIPE_SECRET_KEY does not look like a Stripe key (must start with sk_test_ or sk_live_).\n",
  );
  process.exit(1);
}

if (isLive && !CONFIRM_PROD) {
  console.error("\n⛔ You passed a LIVE secret key (sk_live_).");
  console.error(
    "   Refusing to run without --confirm-prod. This script will create real products in your live Stripe account.",
  );
  console.error("   If you really mean it, re-run with: --confirm-prod\n");
  process.exit(2);
}

if (isLive && CONFIRM_PROD) {
  console.warn(
    "\n⚠️  LIVE MODE — products will be created in your real Stripe account.\n",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe client (pinned to the same API version as the app)
// ─────────────────────────────────────────────────────────────────────────────

const stripe = new Stripe(SECRET, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
  appInfo: {
    name: "cesoir-app/setup-stripe-products",
    version: "1.0.0",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Catalog spec — derived from `src/lib/stripe/plans.ts` so this script and
// the runtime always agree on amount/currency/recurrence.
// ─────────────────────────────────────────────────────────────────────────────

interface ProductSpec {
  /** Stable internal id (also stored as `metadata.cesoir_product_id`). */
  id: string;
  /** Stripe product display name. */
  name: string;
  /** Optional product description shown on Checkout. */
  description?: string;
  /** Price in cents (Stripe `unit_amount`). */
  amountCents: number;
  /** Lowercase currency (eur, usd, …). */
  currency: string;
  /** undefined = one-time, otherwise recurring. */
  recurring?: { interval: "month" | "year" };
  /** Mirrored on Stripe metadata for traceability. */
  metadata: Record<string, string>;
  /** Convenience: env var name for the resulting price id. */
  envVar: string;
}

function specFromPlan(plan: SubscriptionPlan): ProductSpec {
  return {
    id: plan.id,
    name: `CeSoir ${plan.name}`,
    description: plan.tagline,
    amountCents: plan.amountCents,
    currency: plan.currency,
    recurring: { interval: plan.interval },
    metadata: {
      cesoir_product_id: plan.id,
      cesoir_kind: "subscription",
      cesoir_tier: plan.tier,
    },
    envVar: `STRIPE_PRICE_${plan.id.toUpperCase()}`,
  };
}

function specFromShop(p: ShopProduct): ProductSpec {
  return {
    id: p.id,
    name: `CeSoir ${p.name}`,
    description: `${p.quantity} ${p.productType}`,
    amountCents: p.amountCents,
    currency: p.currency,
    metadata: {
      cesoir_product_id: p.id,
      cesoir_kind: "one_time",
      cesoir_product_type: p.productType,
      cesoir_quantity: String(p.quantity),
    },
    envVar: `STRIPE_PRICE_${p.id.toUpperCase()}`,
  };
}

const CATALOG: ProductSpec[] = [
  ...SUBSCRIPTION_PLANS.filter((p) => p.tier !== "free").map(specFromPlan),
  ...SHOP_PRODUCTS.map(specFromShop),
];

// ─────────────────────────────────────────────────────────────────────────────
// Idempotent provisioning
// ─────────────────────────────────────────────────────────────────────────────

async function findProductByCesoirId(
  cesoirId: string,
): Promise<Stripe.Product | null> {
  // Stripe search supports metadata equality.
  const query = `active:'true' AND metadata['cesoir_product_id']:'${cesoirId}'`;
  const res = await stripe.products.search({ query, limit: 1 });
  return res.data[0] ?? null;
}

async function ensureProduct(spec: ProductSpec): Promise<Stripe.Product> {
  const existing = await findProductByCesoirId(spec.id);
  if (existing) {
    // Update name/description/metadata if drift is detected — cheap.
    const needsUpdate =
      existing.name !== spec.name ||
      existing.description !== spec.description ||
      Object.entries(spec.metadata).some(
        ([k, v]) => existing.metadata?.[k] !== v,
      );
    if (needsUpdate) {
      const updated = await stripe.products.update(existing.id, {
        name: spec.name,
        description: spec.description,
        metadata: { ...existing.metadata, ...spec.metadata },
      });
      console.log(`  ↻ updated product   ${spec.id.padEnd(20)} ${updated.id}`);
      return updated;
    }
    console.log(`  ✓ product exists    ${spec.id.padEnd(20)} ${existing.id}`);
    return existing;
  }

  const created = await stripe.products.create({
    name: spec.name,
    description: spec.description,
    metadata: spec.metadata,
  });
  console.log(`  + created product   ${spec.id.padEnd(20)} ${created.id}`);
  return created;
}

function priceMatchesSpec(price: Stripe.Price, spec: ProductSpec): boolean {
  if (price.currency !== spec.currency) return false;
  if (price.unit_amount !== spec.amountCents) return false;
  if (spec.recurring) {
    if (!price.recurring) return false;
    if (price.recurring.interval !== spec.recurring.interval) return false;
  } else {
    if (price.recurring) return false;
  }
  return true;
}

async function ensurePrice(
  product: Stripe.Product,
  spec: ProductSpec,
): Promise<Stripe.Price> {
  const list = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });

  const match = list.data.find((p) => priceMatchesSpec(p, spec));
  if (match) {
    console.log(`  ✓ price exists      ${spec.id.padEnd(20)} ${match.id}`);
    return match;
  }

  // Create a new price.
  const created = await stripe.prices.create({
    product: product.id,
    unit_amount: spec.amountCents,
    currency: spec.currency,
    ...(spec.recurring
      ? { recurring: { interval: spec.recurring.interval } }
      : {}),
    metadata: { cesoir_product_id: spec.id },
  });
  console.log(`  + created price     ${spec.id.padEnd(20)} ${created.id}`);

  // Archive any other active prices on this product to keep things tidy.
  // (Stripe doesn't let you delete prices used on a sub; archiving is fine.)
  for (const old of list.data) {
    if (old.id === created.id) continue;
    try {
      await stripe.prices.update(old.id, { active: false });
      console.log(`  ⌫ archived old price ${old.id}`);
    } catch (err) {
      console.warn(
        `  ! could not archive price ${old.id}: ${(err as Error).message}`,
      );
    }
  }

  return created;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n──────────────────────────────────────────────────────────");
  console.log(` CeSoir · Stripe products provisioning (${isLive ? "LIVE" : "TEST"})`);
  console.log("──────────────────────────────────────────────────────────\n");

  const results: Array<{ spec: ProductSpec; priceId: string }> = [];

  for (const spec of CATALOG) {
    console.log(`▶ ${spec.name} — ${(spec.amountCents / 100).toFixed(2)} ${spec.currency.toUpperCase()}${spec.recurring ? `/${spec.recurring.interval}` : " one-time"}`);
    const product = await ensureProduct(spec);
    const price = await ensurePrice(product, spec);
    results.push({ spec, priceId: price.id });
    console.log();
  }

  // ── Output env-var block ─────────────────────────────────────────────────
  console.log("──────────────────────────────────────────────────────────");
  console.log(" Done. Paste these into Vercel env vars (or .env.local):");
  console.log("──────────────────────────────────────────────────────────\n");

  const envBlock =
    `# Generated by scripts/setup-stripe-products.ts (${isLive ? "LIVE" : "TEST"} mode)\n` +
    `# Date: ${new Date().toISOString()}\n` +
    results.map((r) => `${r.spec.envVar}=${r.priceId}`).join("\n") +
    "\n";

  console.log(envBlock);

  console.log("Next steps:");
  console.log("  1) Add the vars above to Vercel (Settings → Environment Variables)");
  console.log("  2) Add STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_ENABLED=true");
  console.log("  3) Register the webhook on Stripe Dashboard — see scripts/README.md §Webhook");
  console.log("  4) Activate the Customer Portal — https://dashboard.stripe.com/" + (isLive ? "" : "test/") + "settings/billing/portal");
  console.log("  5) Trigger a Vercel redeploy so the new env vars take effect\n");
}

main().catch((err) => {
  console.error("\n❌ Failed:", err instanceof Error ? err.message : err);
  if (err instanceof Stripe.errors.StripeError) {
    console.error("   Stripe code:", err.code);
    console.error("   Stripe type:", err.type);
  }
  process.exit(1);
});

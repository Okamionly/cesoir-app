import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, isStripeConfigured } from "@/lib/stripe/server";
import {
  getPlanByPriceId,
  getShopProductByPriceId,
  SUBSCRIPTION_PLANS,
  SHOP_PRODUCTS,
} from "@/lib/stripe/plans";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { stripeCheckoutSchema } from "@/lib/validation";

/**
 * POST /api/stripe/checkout
 * Body : { priceId: string, mode: 'subscription' | 'payment', successUrl?, cancelUrl? }
 * Auth : Bearer <access_token>
 *
 * Crée une Stripe Checkout Session et retourne l'URL de redirection.
 *
 * La source de vérité des price IDs est `src/lib/stripe/plans.ts` — on
 * refuse tout price ID qui n'y figure pas (sécurité : évite qu'un client
 * malicieux crée une session avec un price à 0.01€).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function resolveBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré. Contacte l'admin." },
      { status: 503 },
    );
  }

  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  // Rate limit 10/min per user (prevent spam customer creation).
  const rl = await checkRateLimit(`stripe-checkout:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // --- Parse + validate body ---
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = stripeCheckoutSchema.safeParse(rawBody);
  if (!parsed.success) {
    logger.warn("api_stripe_checkout_validation_failed", { fields: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      {
        error: "validation_failed",
        code: "validation_failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const { priceId, mode, successUrl, cancelUrl } = parsed.data;

  // --- Validate priceId against our whitelist ---
  const plan = getPlanByPriceId(priceId);
  const product = getShopProductByPriceId(priceId);

  if (mode === "subscription" && !plan) {
    return NextResponse.json(
      { error: "priceId inconnu (subscription)" },
      { status: 400 },
    );
  }
  if (mode === "payment" && !product) {
    return NextResponse.json(
      { error: "priceId inconnu (payment)" },
      { status: 400 },
    );
  }

  // --- Fetch or create Stripe customer ---
  // On cherche d'abord une subscription existante pour réutiliser le customer
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  // --- Build redirect URLs ---
  const baseUrl = resolveBaseUrl(request);
  const defaultSuccess =
    mode === "subscription"
      ? `${baseUrl}/premium?session_id={CHECKOUT_SESSION_ID}&status=success`
      : `${baseUrl}/shop?session_id={CHECKOUT_SESSION_ID}&status=success`;
  const defaultCancel =
    mode === "subscription" ? `${baseUrl}/premium` : `${baseUrl}/shop`;

  // --- Create Checkout Session ---
  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? defaultSuccess,
      cancel_url: cancelUrl ?? defaultCancel,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan?.id ?? "",
        product_id: product?.id ?? "",
        product_type: product?.productType ?? "",
        quantity: product?.quantity?.toString() ?? "",
      },
      // Trial for subscriptions
      ...(mode === "subscription" && plan?.trialDays
        ? {
            subscription_data: {
              trial_period_days: plan.trialDays,
              metadata: {
                supabase_user_id: user.id,
                plan_id: plan.id,
              },
            },
          }
        : {}),
      // Enable customer to update billing address
      billing_address_collection: "auto",
      // Allow promo codes
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a session URL");
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Stripe";
    logger.error("api_stripe_checkout_failed", { err: message });
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement" },
      { status: 500 },
    );
  }
}

// Avoid dead-code warnings for unused imports of plan list constants
void SUBSCRIPTION_PLANS;
void SHOP_PRODUCTS;

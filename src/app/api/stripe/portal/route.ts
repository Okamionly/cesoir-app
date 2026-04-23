import { NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { stripePortalSchema, type StripePortalInput } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { isMonetizationEnabledServer } from "@/lib/featureFlags";
import { requireUser, AuthError } from "@/lib/api/auth";

/**
 * POST /api/stripe/portal
 * Auth : unified `requireUser` (Bearer or SSR cookie).
 * Body : { returnUrl?: string } (optional)
 *
 * Crée une Billing Portal Session Stripe et retourne l'URL. Permet à
 * l'utilisateur de gérer sa subscription (annuler, mettre à jour CB,
 * voir factures, etc.).
 */

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
  // Free-first launch: portal is inert while monetization is off.
  if (!isMonetizationEnabledServer()) {
    logger.warn("api_stripe_portal_blocked_monetization_disabled");
    return NextResponse.json({ error: "monetization_disabled" }, { status: 503 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré." },
      { status: 503 },
    );
  }

  // --- Auth (unified helper, Wave 15) ---
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user, supabase } = ctx;

  // Rate limit 10/min per user.
  const rl = await checkRateLimit(`stripe-portal:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // --- Body (optional) ---
  let body: StripePortalInput = {};
  try {
    const raw = await request.json();
    const parsed = stripePortalSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn("api_stripe_portal_validation_failed", { fields: parsed.error.flatten().fieldErrors });
      return NextResponse.json(
        {
          error: "validation_failed",
          code: "validation_failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    // body is optional — tolerate empty / malformed (no body at all is OK)
  }

  // --- Find customer ID ---
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (subError) {
    logger.error("api_stripe_portal_db_error", { err: subError.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucune subscription trouvée — fais d'abord un abonnement." },
      { status: 404 },
    );
  }

  // --- Build return URL ---
  const baseUrl = resolveBaseUrl(request);
  const returnUrl = body.returnUrl ?? `${baseUrl}/premium`;

  // --- Create portal session ---
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Stripe";
    logger.error("api_stripe_portal_failed", { err: message });
    return NextResponse.json(
      { error: "Impossible d'ouvrir le portail de facturation" },
      { status: 500 },
    );
  }
}

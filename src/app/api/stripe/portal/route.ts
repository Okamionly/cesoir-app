import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, isStripeConfigured } from "@/lib/stripe/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/stripe/portal
 * Auth : Bearer <access_token>
 * Body : { returnUrl?: string } (optional)
 *
 * Crée une Billing Portal Session Stripe et retourne l'URL. Permet à
 * l'utilisateur de gérer sa subscription (annuler, mettre à jour CB,
 * voir factures, etc.).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface PortalBody {
  returnUrl?: string;
}

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
      { error: "Stripe n'est pas configuré." },
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

  // Rate limit 10/min per user.
  const rl = checkRateLimit(`stripe-portal:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // --- Body ---
  let body: PortalBody = {};
  try {
    body = (await request.json()) as PortalBody;
  } catch {
    // body is optional — tolerate empty
  }

  // --- Find customer ID ---
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (subError) {
    console.error("[/api/stripe/portal] db error:", subError.message);
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
    console.error("[/api/stripe/portal] failed:", message);
    return NextResponse.json(
      { error: "Impossible d'ouvrir le portail de facturation" },
      { status: 500 },
    );
  }
}

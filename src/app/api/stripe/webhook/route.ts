import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { getPlanByPriceId, getShopProductById } from "@/lib/stripe/plans";

/**
 * POST /api/stripe/webhook
 *
 * Reçoit les événements Stripe. La signature est vérifiée via
 * STRIPE_WEBHOOK_SECRET. On utilise le service_role Supabase client pour
 * bypass RLS et écrire dans `subscriptions` et `purchases`.
 *
 * Events gérés :
 *   - checkout.session.completed       → créer sub ou purchase selon le mode
 *   - customer.subscription.updated    → maj status / dates
 *   - customer.subscription.deleted    → status = canceled
 *   - invoice.paid                     → confirmer la sub (redondant avec above mais safe)
 *   - invoice.payment_failed           → status = past_due
 *   - payment_intent.succeeded         → confirmer une purchase one-time
 *
 * Retourne 200 rapidement : Stripe retry si pas 2xx.
 */

// Next.js App Router : désactive le body parser pour accéder au raw body
// nécessaire à la vérification de signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Admin Supabase client — bypass RLS. JAMAIS utilisé en dehors du webhook. */
function getServiceRoleClient() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─────────────────────────────────────────
// Handlers per event type
// ─────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
  if (!userId) {
    console.warn("[webhook] checkout.session.completed without user id");
    return;
  }
  const db = getServiceRoleClient();

  if (session.mode === "subscription" && session.subscription) {
    // Sub sera gérée via customer.subscription.updated ; ici on ne fait rien
    // de plus que s'assurer qu'on a la ligne. On récupère l'objet complet.
    const subId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
    const sub = await stripe.subscriptions.retrieve(subId);
    await upsertSubscription(db, userId, sub);
    return;
  }

  if (session.mode === "payment" && session.payment_intent) {
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent.id;

    const productId = session.metadata?.product_id ?? "unknown";
    const productType = session.metadata?.product_type ?? "unknown";
    const product = getShopProductById(productId);

    const { error } = await db.from("purchases").upsert(
      {
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        product_type: productType,
        product_id: productId,
        amount_cents: session.amount_total ?? product?.amountCents ?? 0,
        currency: session.currency ?? product?.currency ?? "eur",
        status: "succeeded",
        metadata: {
          checkout_session_id: session.id,
          quantity: product?.quantity ?? null,
        },
      },
      { onConflict: "stripe_payment_intent_id" },
    );
    if (error) {
      console.error("[webhook] purchase insert failed:", error.message);
    }
  }
}

async function upsertSubscription(
  db: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  sub: Stripe.Subscription,
) {
  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan = getPlanByPriceId(priceId);
  const planId = plan?.id ?? sub.metadata?.plan_id ?? priceId;

  // Stripe types can return these as numbers (epoch seconds) on certain events
  const item = sub.items.data[0];
  const currentStart = item?.current_period_start;
  const currentEnd = item?.current_period_end;

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      status: sub.status,
      plan_id: planId,
      current_period_start: currentStart
        ? new Date(currentStart * 1000).toISOString()
        : null,
      current_period_end: currentEnd
        ? new Date(currentEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    console.error("[webhook] subscription upsert failed:", error.message);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) {
    // Fallback : try to find via customer
    const db = getServiceRoleClient();
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { data: existing } = await db
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .limit(1)
      .maybeSingle();
    if (!existing?.user_id) {
      console.warn("[webhook] subscription update: no user mapping for", sub.id);
      return;
    }
    await upsertSubscription(db, existing.user_id, sub);
    return;
  }
  await upsertSubscription(getServiceRoleClient(), userId, sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const db = getServiceRoleClient();
  const { error } = await db
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: false })
    .eq("stripe_subscription_id", sub.id);
  if (error) {
    console.error("[webhook] sub delete failed:", error.message);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = (invoice as unknown as { subscription?: string | Stripe.Subscription })
    .subscription;
  if (!subId) return;
  const subscriptionId = typeof subId === "string" ? subId : subId.id;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(sub);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = (invoice as unknown as { subscription?: string | Stripe.Subscription })
    .subscription;
  if (!subId) return;
  const subscriptionId = typeof subId === "string" ? subId : subId.id;
  const db = getServiceRoleClient();
  const { error } = await db
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) {
    console.error("[webhook] invoice fail update:", error.message);
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  // Pour les one-time charges. On ne crée PAS de purchase ici si elle n'existe
  // pas déjà — la source de vérité est checkout.session.completed (qui a le
  // metadata). Ici on fait juste un update si la ligne existe.
  const db = getServiceRoleClient();
  const { error } = await db
    .from("purchases")
    .update({ status: "succeeded" })
    .eq("stripe_payment_intent_id", pi.id);
  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found, which is fine (first event was checkout.session.completed)
    console.error("[webhook] pi succeed update:", error.message);
  }
}

// ─────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Raw body nécessaire pour la vérif de signature
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[webhook] signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.trial_will_end":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      default:
        // Events we don't care about yet — 200 ack so Stripe stops retrying
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error(`[webhook] ${event.type} handler failed:`, message);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

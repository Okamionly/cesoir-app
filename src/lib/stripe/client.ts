"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { logger } from "@/lib/logger";

/**
 * Client-side Stripe singleton.
 *
 * Usage (client components only) :
 *   const stripe = await getStripe();
 *   await stripe?.redirectToCheckout({ sessionId });
 *
 * NOTE : la plupart du temps on utilise plutôt `window.location.href = url`
 * retourné par l'API `/api/stripe/checkout`. Ce helper est là pour les
 * cas où on voudrait utiliser Stripe Elements directement.
 */

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      logger.warn("stripe_client_publishable_key_missing");
      stripePromise = Promise.resolve(null);
      return stripePromise;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

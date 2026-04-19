"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

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
      console.warn(
        "[stripe/client] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing — checkout disabled.",
      );
      stripePromise = Promise.resolve(null);
      return stripePromise;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

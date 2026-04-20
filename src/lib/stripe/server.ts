import Stripe from "stripe";
import { logger } from "@/lib/logger";

/**
 * Server-side Stripe client.
 *
 * ⚠ NE JAMAIS importer ce fichier côté client — contient STRIPE_SECRET_KEY.
 * Usage uniquement dans les API routes et Server Actions.
 *
 * La version d'API est pinnée pour éviter les breaking changes silencieux.
 * Mettre à jour consciemment quand on migre.
 */

const key = process.env.STRIPE_SECRET_KEY;

if (!key && process.env.NODE_ENV === "production") {
  // En prod on veut savoir tout de suite que la clé manque
  logger.error("stripe_secret_key_missing_in_production");
}

export const stripe = new Stripe(key ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
  appInfo: {
    name: "cesoir-app",
    version: "0.1.0",
  },
});

/** Guard to check whether Stripe is actually configured (vs placeholder). */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_");
}

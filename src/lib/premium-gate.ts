import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { isMonetizationEnabledServer } from "@/lib/featureFlags";

/**
 * Premium gate helpers.
 *
 * Usage côté serveur :
 *   const premium = await isPremium(userId);
 *   if (!premium) { // apply free tier limits }
 *
 * Les limites (ex: nb de likes / jour) sont définies dans les routes
 * qui consomment ce helper — pas ici. Ce module ne fait qu'exposer
 * le fait "l'utilisateur a-t-il une subscription active ?".
 *
 * Free-first launch (Wave 13, 2026-04-20): when monetization is OFF, every
 * user is treated as premium (unlimited likes, no gates). The table query
 * is skipped entirely to save a DB round-trip on every swipe.
 */

const ACTIVE_STATUSES = ["active", "trialing"] as const;

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

/**
 * Returns true if the user has an active or trialing subscription.
 * Meant to be called from server code (API routes, Server Components).
 *
 * Returns `true` unconditionally while monetization is disabled — every
 * feature that was previously premium-gated is now universally free.
 */
export async function isPremium(userId: string): Promise<boolean> {
  if (!isMonetizationEnabledServer()) return true;
  if (!userId) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .in("status", ACTIVE_STATUSES as unknown as string[])
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("premium_gate_is_premium_failed", { err: error.message });
    return false;
  }
  return !!data;
}

/**
 * Free tier daily swipe/like limit.
 * Premium users get unlimited (Infinity).
 *
 * 100 is the cap used by /api/swipe before premium-gate wiring —
 * keeping parity so existing free users don't see a regression. Adjust
 * if product wants a tighter free tier to encourage upgrades.
 */
export const FREE_TIER_DAILY_LIKES = 100;
export const PREMIUM_TIER_DAILY_LIKES = Infinity;

/**
 * Return the daily like cap for a user based on their tier.
 *
 * Free-first launch: returns Infinity for everyone when monetization is
 * disabled — no user-visible cap, no DB call. Flip the flag to reintroduce
 * tiers.
 */
export async function getDailyLikeCap(userId: string): Promise<number> {
  if (!isMonetizationEnabledServer()) return PREMIUM_TIER_DAILY_LIKES;
  const premium = await isPremium(userId);
  return premium ? PREMIUM_TIER_DAILY_LIKES : FREE_TIER_DAILY_LIKES;
}

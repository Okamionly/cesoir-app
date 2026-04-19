import { createClient } from "@/lib/supabase/server";

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
 */
export async function isPremium(userId: string): Promise<boolean> {
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
    console.error("[premium-gate] isPremium query failed:", error.message);
    return false;
  }
  return !!data;
}

/**
 * Free tier daily swipe/like limit.
 * Premium users get unlimited (Infinity).
 */
export const FREE_TIER_DAILY_LIKES = 20;
export const PREMIUM_TIER_DAILY_LIKES = Infinity;

/** Return the daily like cap for a user based on their tier. */
export async function getDailyLikeCap(userId: string): Promise<number> {
  const premium = await isPremium(userId);
  return premium ? PREMIUM_TIER_DAILY_LIKES : FREE_TIER_DAILY_LIKES;
}

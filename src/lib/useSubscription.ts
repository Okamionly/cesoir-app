"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

/**
 * Subscription hook — fetches the current user's Stripe subscription state
 * from the `subscriptions` table (RLS : self only).
 *
 * Exposes `isPremium` boolean + raw row + helpers to open checkout/portal.
 */

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  plan_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseSubscriptionReturn {
  subscription: SubscriptionRow | null;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  /** Redirects to Stripe Checkout for a given priceId (subscription mode). */
  startCheckout: (priceId: string) => Promise<void>;
  /** Opens the Stripe billing portal (user must already have a sub). */
  openPortal: () => Promise<void>;
  /** Refresh the subscription state from the DB. */
  refresh: () => Promise<void>;
}

const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SubscriptionRow>();

    if (err) {
      // Table peut ne pas exister encore si migration pas appliquée
      setError(err.message);
      setSubscription(null);
    } else {
      setSubscription(data ?? null);
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isPremium = useMemo(() => {
    if (!subscription) return false;
    return ACTIVE_STATUSES.includes(subscription.status);
  }, [subscription]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const startCheckout = useCallback(
    async (priceId: string) => {
      const token = await getAccessToken();
      if (!token) {
        setError("Session expirée. Reconnecte-toi.");
        return;
      }
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId, mode: "subscription" }),
        });
        const payload = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !payload.url) {
          throw new Error(payload.error ?? "Checkout failed");
        }
        window.location.href = payload.url;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Checkout error";
        setError(message);
      }
    },
    [getAccessToken],
  );

  const openPortal = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setError("Session expirée. Reconnecte-toi.");
      return;
    }
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !payload.url) {
        throw new Error(payload.error ?? "Portal failed");
      }
      window.location.href = payload.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Portal error";
      setError(message);
    }
  }, [getAccessToken]);

  return useMemo(
    () => ({ subscription, isPremium, isLoading, error, startCheckout, openPortal, refresh }),
    [subscription, isPremium, isLoading, error, startCheckout, openPortal, refresh],
  );
}

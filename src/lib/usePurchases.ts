"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getShopProductById } from "@/lib/stripe/plans";

/**
 * Purchases hook — reads the `purchases` table for the current user
 * and derives totals (ex: nb de roses achetées).
 *
 * Côté client seulement. Pas d'INSERT — c'est le webhook Stripe qui
 * écrit (via service_role).
 */

export type PurchaseStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface PurchaseRow {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  product_type: string;
  product_id: string;
  amount_cents: number;
  currency: string;
  status: PurchaseStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UsePurchasesReturn {
  purchases: PurchaseRow[];
  isLoading: boolean;
  error: string | null;
  /** Total lifetime roses purchased (from product catalog quantity × count). */
  rosesPurchased: number;
  /** Total lifetime boosts purchased. */
  boostsPurchased: number;
  /** Total amount spent in the user's currency (cents). */
  totalSpentCents: number;
  /** Refresh from the DB. */
  refresh: () => Promise<void>;
  /** Start a one-time checkout for a given price ID. */
  buy: (priceId: string) => Promise<void>;
}

export function usePurchases(): UsePurchasesReturn {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPurchases([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (err) {
      setError(err.message);
      setPurchases([]);
    } else {
      setPurchases((data ?? []) as PurchaseRow[]);
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Derived totals (only successful purchases)
  const { rosesPurchased, boostsPurchased, totalSpentCents } = useMemo(() => {
    let roses = 0;
    let boosts = 0;
    let totalCents = 0;
    for (const p of purchases) {
      if (p.status !== "succeeded") continue;
      totalCents += p.amount_cents;
      const product = getShopProductById(p.product_id);
      const qty = product?.quantity ?? 0;
      if (p.product_type === "roses") roses += qty;
      if (p.product_type === "boosts") boosts += qty;
    }
    return { rosesPurchased: roses, boostsPurchased: boosts, totalSpentCents: totalCents };
  }, [purchases]);

  const buy = useCallback(async (priceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
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
        body: JSON.stringify({ priceId, mode: "payment" }),
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
  }, []);

  return useMemo(
    () => ({
      purchases,
      isLoading,
      error,
      rosesPurchased,
      boostsPurchased,
      totalSpentCents,
      refresh,
      buy,
    }),
    [purchases, isLoading, error, rosesPurchased, boostsPurchased, totalSpentCents, refresh, buy],
  );
}

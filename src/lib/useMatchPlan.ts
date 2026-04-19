"use client";

import { useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";

// ---------- Types ----------

export interface Plan {
  id: string;
  userA: string;
  userB: string;
  whenDate: string;
  what: string;
  whereText: string;
  status: "proposed" | "confirmed" | "done" | "cancelled";
  proposedBy: string | null;
  createdAt: string;
}

interface PlanRow {
  id: string;
  user_a: string;
  user_b: string;
  when_date: string;
  what: string | null;
  where_text: string | null;
  status: "proposed" | "confirmed" | "done" | "cancelled" | null;
  proposed_by: string | null;
  created_at: string | null;
}

export interface CreatePlanPayload {
  partnerId: string;
  whenDate: string; // ISO
  what: string;
  whereText: string;
}

function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    userA: row.user_a,
    userB: row.user_b,
    whenDate: row.when_date,
    what: row.what ?? "",
    whereText: row.where_text ?? "",
    status: row.status ?? "proposed",
    proposedBy: row.proposed_by,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// ---------- Hook ----------

interface UsePlansReturn {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  proposePlan: (payload: CreatePlanPayload) => Promise<string | null>;
  respondPlan: (planId: string, status: "confirmed" | "cancelled") => Promise<boolean>;
}

export function usePlans(): UsePlansReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, loading, error, refetch } = useAsyncResource<Plan[]>(
    async (signal) => {
      if (!userId) return [];

      const { data, error: err } = await supabase
        .from("plans")
        .select("*")
        .or(`user_a.eq.${userId},user_b.eq.${userId}`)
        .order("when_date", { ascending: true })
        .abortSignal(signal);

      if (err) {
        console.error("[usePlans] fetch failed:", err.message);
        throw new Error(err.message);
      }

      return ((data ?? []) as PlanRow[]).map(toPlan);
    },
    [userId],
  );

  const proposePlan = useCallback(
    async (payload: CreatePlanPayload): Promise<string | null> => {
      if (!user) return null;

      const userA = user.id < payload.partnerId ? user.id : payload.partnerId;
      const userB = user.id < payload.partnerId ? payload.partnerId : user.id;

      const { data: inserted, error: err } = await supabase
        .from("plans")
        .insert({
          user_a: userA,
          user_b: userB,
          when_date: payload.whenDate,
          what: payload.what,
          where_text: payload.whereText,
          status: "proposed",
          proposed_by: user.id,
        })
        .select("id")
        .single();

      if (err) {
        console.error("[usePlans] proposePlan failed:", err.message);
        return null;
      }
      void refetch();
      return inserted?.id ?? null;
    },
    [user, refetch],
  );

  const respondPlan = useCallback(
    async (planId: string, status: "confirmed" | "cancelled"): Promise<boolean> => {
      if (!user) return false;
      const { error: err } = await supabase
        .from("plans")
        .update({ status })
        .eq("id", planId);
      if (err) {
        console.error("[usePlans] respondPlan failed:", err.message);
        return false;
      }
      void refetch();
      return true;
    },
    [user, refetch],
  );

  return {
    plans: data ?? [],
    loading,
    error: error?.message ?? null,
    refresh: async () => {
      await refetch();
    },
    proposePlan,
    respondPlan,
  };
}

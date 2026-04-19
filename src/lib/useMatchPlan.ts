"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("plans")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("when_date", { ascending: true });

    if (err) {
      console.error("[usePlans] fetch failed:", err.message);
      setError(err.message);
      setLoading(false);
      return;
    }

    setPlans(((data ?? []) as PlanRow[]).map(toPlan));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const proposePlan = useCallback(
    async (payload: CreatePlanPayload): Promise<string | null> => {
      if (!user) return null;

      const userA = user.id < payload.partnerId ? user.id : payload.partnerId;
      const userB = user.id < payload.partnerId ? payload.partnerId : user.id;

      const { data, error: err } = await supabase
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
      void fetchPlans();
      return data?.id ?? null;
    },
    [user, fetchPlans],
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
      void fetchPlans();
      return true;
    },
    [user, fetchPlans],
  );

  return { plans, loading, error, refresh: fetchPlans, proposePlan, respondPlan };
}

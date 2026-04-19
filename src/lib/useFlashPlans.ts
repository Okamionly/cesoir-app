"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";

// ---------- Types ----------

export interface FlashPlanParticipant {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  status: "candidate" | "accepted" | "rejected";
  joinedAt: string;
}

export interface FlashPlanDb {
  id: string;
  creatorId: string;
  title: string;
  what: string;
  whereText: string;
  whenAt: string;
  deadline: string;
  maxParticipants: number;
  mode: string | null;
  status: "open" | "closed" | "done";
  createdAt: string;
  participants: FlashPlanParticipant[];
}

interface FlashPlanRow {
  id: string;
  creator_id: string;
  title: string;
  what: string | null;
  where_text: string | null;
  when_at: string;
  deadline: string;
  max_participants: number | null;
  mode: string | null;
  status: "open" | "closed" | "done" | null;
  created_at: string | null;
}

interface ParticipantRow {
  id: string;
  flash_plan_id: string;
  user_id: string;
  status: "candidate" | "accepted" | "rejected" | null;
  joined_at: string | null;
}

interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface CreateFlashPlanPayload {
  title: string;
  what?: string;
  whereText?: string;
  whenAt: string; // ISO
  deadline: string; // ISO
  maxParticipants?: number;
  mode?: string;
}

// ---------- Hook ----------

interface UseFlashPlansReturn {
  flashPlans: FlashPlanDb[];
  loading: boolean;
  error: string | null;
  myInterest: Set<string>;
  refresh: () => Promise<void>;
  createFlashPlan: (payload: CreateFlashPlanPayload) => Promise<string | null>;
  toggleInterest: (flashPlanId: string) => Promise<void>;
}

export function useFlashPlans(): UseFlashPlansReturn {
  const { user } = useAuth();
  const [flashPlans, setFlashPlans] = useState<FlashPlanDb[]>([]);
  const [myInterest, setMyInterest] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: rows, error: err } = await supabase
      .from("flash_plans")
      .select("*")
      .eq("status", "open")
      .order("deadline", { ascending: true });

    if (err) {
      console.error("[useFlashPlans] fetch failed:", err.message);
      setError(err.message);
      setFlashPlans([]);
      setLoading(false);
      return;
    }

    const planRows = (rows ?? []) as FlashPlanRow[];
    if (planRows.length === 0) {
      setFlashPlans([]);
      setLoading(false);
      return;
    }

    const planIds = planRows.map((p) => p.id);
    const { data: participants } = await supabase
      .from("flash_plan_participants")
      .select("*")
      .in("flash_plan_id", planIds);

    const participantRows = (participants ?? []) as ParticipantRow[];
    const userIds = Array.from(new Set(participantRows.map((p) => p.user_id)));

    let profileMap = new Map<string, ProfileRow>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);
      profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));
    }

    const byPlan = new Map<string, FlashPlanParticipant[]>();
    for (const p of participantRows) {
      const profile = profileMap.get(p.user_id);
      const entry: FlashPlanParticipant = {
        id: p.id,
        userId: p.user_id,
        name: profile?.name ?? "?",
        avatar: profile?.avatar_url ?? null,
        status: p.status ?? "candidate",
        joinedAt: p.joined_at ?? new Date().toISOString(),
      };
      if (!byPlan.has(p.flash_plan_id)) byPlan.set(p.flash_plan_id, []);
      byPlan.get(p.flash_plan_id)!.push(entry);
    }

    const mapped: FlashPlanDb[] = planRows.map((row) => ({
      id: row.id,
      creatorId: row.creator_id,
      title: row.title,
      what: row.what ?? "",
      whereText: row.where_text ?? "",
      whenAt: row.when_at,
      deadline: row.deadline,
      maxParticipants: row.max_participants ?? 4,
      mode: row.mode,
      status: row.status ?? "open",
      createdAt: row.created_at ?? new Date().toISOString(),
      participants: byPlan.get(row.id) ?? [],
    }));

    setFlashPlans(mapped);

    if (user) {
      setMyInterest(
        new Set(
          participantRows.filter((p) => p.user_id === user.id).map((p) => p.flash_plan_id),
        ),
      );
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const createFlashPlan = useCallback(
    async (payload: CreateFlashPlanPayload): Promise<string | null> => {
      if (!user) return null;

      const { data, error: err } = await supabase
        .from("flash_plans")
        .insert({
          creator_id: user.id,
          title: payload.title,
          what: payload.what ?? "",
          where_text: payload.whereText ?? "",
          when_at: payload.whenAt,
          deadline: payload.deadline,
          max_participants: payload.maxParticipants ?? 4,
          mode: payload.mode ?? null,
          status: "open",
        })
        .select("id")
        .single();

      if (err) {
        console.error("[useFlashPlans] create failed:", err.message);
        return null;
      }

      if (data?.id) {
        await supabase.from("flash_plan_participants").insert({
          flash_plan_id: data.id,
          user_id: user.id,
          status: "accepted",
        });
      }

      void fetchPlans();
      return data?.id ?? null;
    },
    [user, fetchPlans],
  );

  const toggleInterest = useCallback(
    async (flashPlanId: string) => {
      if (!user) return;
      const isInterested = myInterest.has(flashPlanId);

      // Optimistic
      setMyInterest((prev) => {
        const next = new Set(prev);
        if (isInterested) next.delete(flashPlanId);
        else next.add(flashPlanId);
        return next;
      });

      if (isInterested) {
        await supabase
          .from("flash_plan_participants")
          .delete()
          .eq("flash_plan_id", flashPlanId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("flash_plan_participants").insert({
          flash_plan_id: flashPlanId,
          user_id: user.id,
          status: "candidate",
        });
      }

      void fetchPlans();
    },
    [user, myInterest, fetchPlans],
  );

  return {
    flashPlans,
    loading,
    error,
    myInterest,
    refresh: fetchPlans,
    createFlashPlan,
    toggleInterest,
  };
}

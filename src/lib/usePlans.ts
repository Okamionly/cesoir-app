"use client";

import { useCallback, useMemo } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";

// ---------- Types ----------

export type PlanType = "flash" | "soiree" | "popup" | "match";

export interface PlanParticipant {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  status: "candidate" | "accepted" | "rejected";
  joinedAt: string;
}

export interface PlanDb {
  id: string;
  type: PlanType;
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
  description: string | null;
  lat: number | null;
  lng: number | null;
  venue: string | null;
  tags: string[];
  ambiance: string | null;
  dressCode: string | null;
  budget: string | null;
  participants: PlanParticipant[];
}

interface PlanRow {
  id: string;
  type: PlanType | null;
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
  description: string | null;
  lat: number | null;
  lng: number | null;
  venue: string | null;
  tags: string[] | null;
  ambiance: string | null;
  dress_code: string | null;
  budget: string | null;
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

export interface CreatePlanPayload {
  type: PlanType;
  title: string;
  what?: string;
  whereText?: string;
  whenAt: string; // ISO
  deadline?: string; // ISO; defaults to whenAt if omitted
  maxParticipants?: number;
  mode?: string;
  description?: string;
  lat?: number;
  lng?: number;
  venue?: string;
  tags?: string[];
  ambiance?: string;
  dressCode?: string;
  budget?: string;
}

interface PlansPayload {
  plans: PlanDb[];
  myInterest: Set<string>;
}

// ---------- Hook ----------

interface UsePlansOptions {
  /** Filter by type. Omit to fetch all types (flash, soiree, popup). */
  type?: PlanType;
}

interface UsePlansReturn {
  plans: PlanDb[];
  loading: boolean;
  error: string | null;
  myInterest: Set<string>;
  refresh: () => Promise<void>;
  createPlan: (payload: CreatePlanPayload) => Promise<string | null>;
  toggleInterest: (planId: string) => Promise<void>;
}

export function usePlans(options: UsePlansOptions = {}): UsePlansReturn {
  const { user } = useAuth();
  const userId = user?.id;
  const typeFilter = options.type;

  const { data, loading, error, refetch } = useAsyncResource<PlansPayload>(
    async (signal) => {
      let query = supabase.from("flash_plans").select("*").eq("status", "open");

      if (typeFilter) {
        query = query.eq("type", typeFilter);
      } else {
        query = query.in("type", ["flash", "soiree", "popup"]);
      }

      const { data: rows, error: err } = await query
        .order("when_at", { ascending: true })
        .abortSignal(signal);

      if (err) {
        // Abort errors come from React strict-mode double-mount or deps change
        // re-run in useAsyncResource — they're not real failures. Throw silently
        // so useAsyncResource can swallow; don't spam the console.
        if (err.message?.toLowerCase().includes("abort")) {
          throw new Error(err.message);
        }
        console.error("[usePlans] fetch failed:", err.message);
        throw new Error(err.message);
      }

      const planRows = (rows ?? []) as PlanRow[];
      if (planRows.length === 0) {
        return { plans: [], myInterest: new Set<string>() };
      }

      const planIds = planRows.map((p) => p.id);
      const { data: participants } = await supabase
        .from("flash_plan_participants")
        .select("*")
        .in("flash_plan_id", planIds)
        .abortSignal(signal);

      const participantRows = (participants ?? []) as ParticipantRow[];
      const userIds = Array.from(new Set(participantRows.map((p) => p.user_id)));

      let profileMap = new Map<string, ProfileRow>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds)
          .abortSignal(signal);
        profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      }

      const byPlan = new Map<string, PlanParticipant[]>();
      for (const p of participantRows) {
        const profile = profileMap.get(p.user_id);
        const entry: PlanParticipant = {
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

      const mapped: PlanDb[] = planRows.map((row) => ({
        id: row.id,
        type: (row.type ?? "flash") as PlanType,
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
        description: row.description,
        lat: row.lat,
        lng: row.lng,
        venue: row.venue,
        tags: row.tags ?? [],
        ambiance: row.ambiance,
        dressCode: row.dress_code,
        budget: row.budget,
        participants: byPlan.get(row.id) ?? [],
      }));

      const interest = userId
        ? new Set(
            participantRows
              .filter((p) => p.user_id === userId)
              .map((p) => p.flash_plan_id),
          )
        : new Set<string>();

      return { plans: mapped, myInterest: interest };
    },
    [userId, typeFilter],
  );

  const createPlan = useCallback(
    async (payload: CreatePlanPayload): Promise<string | null> => {
      if (!user) return null;

      const deadline = payload.deadline ?? payload.whenAt;

      const { data: inserted, error: err } = await supabase
        .from("flash_plans")
        .insert({
          creator_id: user.id,
          type: payload.type,
          title: payload.title,
          what: payload.what ?? "",
          where_text: payload.whereText ?? "",
          when_at: payload.whenAt,
          deadline,
          max_participants: payload.maxParticipants ?? 4,
          mode: payload.mode ?? null,
          status: "open",
          description: payload.description ?? null,
          lat: payload.lat ?? null,
          lng: payload.lng ?? null,
          venue: payload.venue ?? null,
          tags: payload.tags ?? [],
          ambiance: payload.ambiance ?? null,
          dress_code: payload.dressCode ?? null,
          budget: payload.budget ?? null,
        })
        .select("id")
        .single();

      if (err) {
        console.error("[usePlans] create failed:", err.message);
        return null;
      }

      if (inserted?.id) {
        await supabase.from("flash_plan_participants").insert({
          flash_plan_id: inserted.id,
          user_id: user.id,
          status: "accepted",
        });
      }

      void refetch();
      return inserted?.id ?? null;
    },
    [user, refetch],
  );

  const toggleInterest = useCallback(
    async (planId: string) => {
      if (!user) return;
      const current = data?.myInterest ?? new Set<string>();
      const isInterested = current.has(planId);

      if (isInterested) {
        await supabase
          .from("flash_plan_participants")
          .delete()
          .eq("flash_plan_id", planId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("flash_plan_participants").insert({
          flash_plan_id: planId,
          user_id: user.id,
          status: "candidate",
        });
      }

      void refetch();
    },
    [user, data, refetch],
  );

  return {
    plans: data?.plans ?? [],
    loading,
    error: error?.message ?? null,
    myInterest: data?.myInterest ?? new Set<string>(),
    refresh: async () => {
      await refetch();
    },
    createPlan,
    toggleInterest,
  };
}

// ---------- Single plan hook ----------

export function usePlan(planId: string | undefined): {
  plan: PlanDb | null;
  loading: boolean;
  error: string | null;
  isInterested: boolean;
  refresh: () => Promise<void>;
  toggleInterest: () => Promise<void>;
} {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, loading, error, refetch } = useAsyncResource<{
    plan: PlanDb | null;
    isInterested: boolean;
  }>(
    async (signal) => {
      if (!planId) return { plan: null, isInterested: false };

      const { data: row, error: err } = await supabase
        .from("flash_plans")
        .select("*")
        .eq("id", planId)
        .abortSignal(signal)
        .maybeSingle();

      if (err || !row) {
        throw new Error(err?.message ?? "Plan introuvable");
      }

      const p = row as PlanRow;

      const { data: partRows } = await supabase
        .from("flash_plan_participants")
        .select("*")
        .eq("flash_plan_id", planId)
        .abortSignal(signal);

      const participantRows = (partRows ?? []) as ParticipantRow[];
      const userIds = Array.from(new Set(participantRows.map((x) => x.user_id)));

      let profileMap = new Map<string, ProfileRow>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds)
          .abortSignal(signal);
        profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((x) => [x.id, x]));
      }

      const participants: PlanParticipant[] = participantRows.map((pr) => {
        const profile = profileMap.get(pr.user_id);
        return {
          id: pr.id,
          userId: pr.user_id,
          name: profile?.name ?? "?",
          avatar: profile?.avatar_url ?? null,
          status: pr.status ?? "candidate",
          joinedAt: pr.joined_at ?? new Date().toISOString(),
        };
      });

      const plan: PlanDb = {
        id: p.id,
        type: (p.type ?? "flash") as PlanType,
        creatorId: p.creator_id,
        title: p.title,
        what: p.what ?? "",
        whereText: p.where_text ?? "",
        whenAt: p.when_at,
        deadline: p.deadline,
        maxParticipants: p.max_participants ?? 4,
        mode: p.mode,
        status: p.status ?? "open",
        createdAt: p.created_at ?? new Date().toISOString(),
        description: p.description,
        lat: p.lat,
        lng: p.lng,
        venue: p.venue,
        tags: p.tags ?? [],
        ambiance: p.ambiance,
        dressCode: p.dress_code,
        budget: p.budget,
        participants,
      };

      const isInterested = userId
        ? participantRows.some((x) => x.user_id === userId)
        : false;

      return { plan, isInterested };
    },
    [planId, userId],
  );

  const toggleInterest = useCallback(async () => {
    if (!planId || !user) return;
    const wasInterested = data?.isInterested ?? false;

    if (wasInterested) {
      await supabase
        .from("flash_plan_participants")
        .delete()
        .eq("flash_plan_id", planId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("flash_plan_participants").insert({
        flash_plan_id: planId,
        user_id: user.id,
        status: "candidate",
      });
    }

    void refetch();
  }, [planId, user, data, refetch]);

  return {
    plan: data?.plan ?? null,
    loading,
    error: error?.message ?? null,
    isInterested: data?.isInterested ?? false,
    refresh: async () => {
      await refetch();
    },
    toggleInterest,
  };
}

// ---------- Helpers ----------

export const PLAN_TYPE_META: Record<
  PlanType,
  { label: string; emoji: string; description: string }
> = {
  flash: { label: "Flash", emoji: "\u26A1", description: "Plan urgent ce soir" },
  soiree: { label: "Soiree", emoji: "\uD83C\uDF7B", description: "Soiree thematique" },
  popup: { label: "Event", emoji: "\uD83C\uDF89", description: "Pop-up event public" },
  match: { label: "Match", emoji: "\uD83D\uDC95", description: "Plan prive 1:1" },
};

export function usePlansByType(type: PlanType | undefined): UsePlansReturn {
  const options = useMemo(() => ({ type }), [type]);
  return usePlans(options);
}

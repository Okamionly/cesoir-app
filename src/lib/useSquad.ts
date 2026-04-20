"use client";

import { useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { logger } from "./logger";

// ---------- Types ----------

export interface SquadMember {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Squad {
  id: string;
  name: string;
  creatorId: string;
  members: SquadMember[];
  mode: string | null;
  status: "active" | "full" | "closed";
  createdAt: string;
}

export interface SquadInvite {
  id: string;
  squadId: string;
  code: string;
  inviterId: string;
  createdAt: string;
}

interface SquadRow {
  id: string;
  name: string;
  creator_id: string;
  members: string[] | null;
  mode: string | null;
  status: "active" | "full" | "closed" | null;
  created_at: string | null;
}

interface InviteRow {
  id: string;
  squad_id: string;
  inviter_id: string;
  code: string;
  used_by: string | null;
  created_at: string | null;
}

interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface SquadPayload {
  mySquad: Squad | null;
  activeSquads: Squad[];
  myInvite: SquadInvite | null;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ---------- Hook ----------

interface UseSquadReturn {
  mySquad: Squad | null;
  activeSquads: Squad[];
  myInvite: SquadInvite | null;
  loading: boolean;
  error: string | null;
  createSquad: (name: string, mode?: string) => Promise<string | null>;
  generateInvite: (squadId: string) => Promise<string | null>;
  joinByCode: (code: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useSquad(): UseSquadReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, loading, error, refetch } = useAsyncResource<SquadPayload>(
    async (signal) => {
      const { data: rows, error: err } = await supabase
        .from("squads")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .abortSignal(signal);

      if (err) {
        logger.error("use_squad_fetch_failed", { err: err.message });
        throw new Error(err.message);
      }

      const squadRows = (rows ?? []) as SquadRow[];
      const allMemberIds = Array.from(
        new Set(squadRows.flatMap((s) => [...(s.members ?? []), s.creator_id])),
      );

      let profileMap = new Map<string, ProfileRow>();
      if (allMemberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", allMemberIds)
          .abortSignal(signal);
        profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      }

      const mapped: Squad[] = squadRows.map((s) => {
        const memberIds = Array.from(new Set([...(s.members ?? []), s.creator_id]));
        const members: SquadMember[] = memberIds.map((id) => {
          const p = profileMap.get(id);
          return p
            ? { id: p.id, name: p.name, avatar: p.avatar_url }
            : { id, name: "?", avatar: null };
        });
        return {
          id: s.id,
          name: s.name,
          creatorId: s.creator_id,
          members,
          mode: s.mode,
          status: s.status ?? "active",
          createdAt: s.created_at ?? new Date().toISOString(),
        };
      });

      let mine: Squad | null = null;
      let myInvite: SquadInvite | null = null;

      if (userId) {
        mine =
          mapped.find(
            (s) => s.creatorId === userId || s.members.some((m) => m.id === userId),
          ) ?? null;

        if (mine) {
          const { data: invites } = await supabase
            .from("squad_invites")
            .select("*")
            .eq("squad_id", mine.id)
            .is("used_by", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .abortSignal(signal);
          const inviteRow = ((invites ?? []) as InviteRow[])[0];
          if (inviteRow) {
            myInvite = {
              id: inviteRow.id,
              squadId: inviteRow.squad_id,
              code: inviteRow.code,
              inviterId: inviteRow.inviter_id,
              createdAt: inviteRow.created_at ?? new Date().toISOString(),
            };
          }
        }
      }

      return { mySquad: mine, activeSquads: mapped, myInvite };
    },
    [userId],
  );

  const createSquad = useCallback(
    async (name: string, mode?: string): Promise<string | null> => {
      if (!user) return null;
      const { data: inserted, error: err } = await supabase
        .from("squads")
        .insert({
          name: name.trim() || "Mon squad",
          creator_id: user.id,
          members: [user.id],
          mode: mode ?? null,
          status: "active",
        })
        .select("id")
        .single();
      if (err) {
        logger.error("use_squad_create_failed", { err: err.message });
        return null;
      }
      void refetch();
      return inserted?.id ?? null;
    },
    [user, refetch],
  );

  const generateInvite = useCallback(
    async (squadId: string): Promise<string | null> => {
      if (!user) return null;
      const code = generateInviteCode();
      const { data: inserted, error: err } = await supabase
        .from("squad_invites")
        .insert({
          squad_id: squadId,
          inviter_id: user.id,
          code,
        })
        .select("code")
        .single();
      if (err) {
        logger.error("use_squad_generate_invite_failed", { err: err.message });
        return null;
      }
      void refetch();
      return inserted?.code ?? code;
    },
    [user, refetch],
  );

  const joinByCode = useCallback(
    async (code: string): Promise<boolean> => {
      if (!user) return false;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return false;

      const res = await fetch("/api/squad/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invite_code: code.toUpperCase() }),
      });

      if (!res.ok) return false;
      void refetch();
      return true;
    },
    [user, refetch],
  );

  return {
    mySquad: data?.mySquad ?? null,
    activeSquads: data?.activeSquads ?? [],
    myInvite: data?.myInvite ?? null,
    loading,
    error: error?.message ?? null,
    createSquad,
    generateInvite,
    joinByCode,
    refresh: async () => {
      await refetch();
    },
  };
}

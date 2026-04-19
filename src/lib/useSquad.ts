"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";

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
  const [mySquad, setMySquad] = useState<Squad | null>(null);
  const [activeSquads, setActiveSquads] = useState<Squad[]>([]);
  const [myInvite, setMyInvite] = useState<SquadInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSquads = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: rows, error: err } = await supabase
      .from("squads")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (err) {
      console.error("[useSquad] fetch failed:", err.message);
      setError(err.message);
      setLoading(false);
      return;
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
        .in("id", allMemberIds);
      profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]));
    }

    const mapped: Squad[] = squadRows.map((s) => {
      const memberIds = Array.from(new Set([...(s.members ?? []), s.creator_id]));
      const members: SquadMember[] = memberIds
        .map((id) => {
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

    setActiveSquads(mapped);

    if (user) {
      const mine = mapped.find(
        (s) => s.creatorId === user.id || s.members.some((m) => m.id === user.id),
      );
      setMySquad(mine ?? null);

      if (mine) {
        const { data: invites } = await supabase
          .from("squad_invites")
          .select("*")
          .eq("squad_id", mine.id)
          .is("used_by", null)
          .order("created_at", { ascending: false })
          .limit(1);
        const inviteRow = ((invites ?? []) as InviteRow[])[0];
        if (inviteRow) {
          setMyInvite({
            id: inviteRow.id,
            squadId: inviteRow.squad_id,
            code: inviteRow.code,
            inviterId: inviteRow.inviter_id,
            createdAt: inviteRow.created_at ?? new Date().toISOString(),
          });
        } else {
          setMyInvite(null);
        }
      } else {
        setMyInvite(null);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchSquads();
  }, [fetchSquads]);

  const createSquad = useCallback(
    async (name: string, mode?: string): Promise<string | null> => {
      if (!user) return null;
      const { data, error: err } = await supabase
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
        console.error("[useSquad] createSquad failed:", err.message);
        return null;
      }
      void fetchSquads();
      return data?.id ?? null;
    },
    [user, fetchSquads],
  );

  const generateInvite = useCallback(
    async (squadId: string): Promise<string | null> => {
      if (!user) return null;
      const code = generateInviteCode();
      const { data, error: err } = await supabase
        .from("squad_invites")
        .insert({
          squad_id: squadId,
          inviter_id: user.id,
          code,
        })
        .select("code")
        .single();
      if (err) {
        console.error("[useSquad] generateInvite failed:", err.message);
        return null;
      }
      void fetchSquads();
      return data?.code ?? code;
    },
    [user, fetchSquads],
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
      void fetchSquads();
      return true;
    },
    [user, fetchSquads],
  );

  return {
    mySquad,
    activeSquads,
    myInvite,
    loading,
    error,
    createSquad,
    generateInvite,
    joinByCode,
    refresh: fetchSquads,
  };
}

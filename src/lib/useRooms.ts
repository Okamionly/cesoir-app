"use client";

import { useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { logger } from "./logger";
import { useRealtimeChannel } from "@/lib/hooks/useSupabaseQuery";

// ---------- Types ----------

export interface Room {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  hostAvatar: string | null;
  mode: string | null;
  maxSpeakers: number;
  currentSpeakers: number;
  currentListeners: number;
  status: "live" | "ended";
  startedAt: string;
}

interface RoomRow {
  id: string;
  host_id: string;
  title: string;
  mode: string | null;
  max_speakers: number | null;
  current_speakers: number | null;
  current_listeners: number | null;
  status: "live" | "ended" | null;
  started_at: string;
  ended_at: string | null;
  created_at: string | null;
}

interface ProfileRow {
  id: string;
  name: string;
  avatar_url: string | null;
}

function toRoom(row: RoomRow, host: ProfileRow | undefined): Room {
  return {
    id: row.id,
    title: row.title,
    hostId: row.host_id,
    hostName: host?.name ?? "Hote",
    hostAvatar: host?.avatar_url ?? null,
    mode: row.mode,
    maxSpeakers: row.max_speakers ?? 5,
    currentSpeakers: row.current_speakers ?? 0,
    currentListeners: row.current_listeners ?? 0,
    status: row.status ?? "live",
    startedAt: row.started_at,
  };
}

// ---------- Hook (list) ----------

interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRoom: (title: string, mode?: string, maxSpeakers?: number) => Promise<string | null>;
}

export function useRooms(): UseRoomsReturn {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useAsyncResource<Room[]>(
    async (signal) => {
      const { data: rows, error: err } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "live")
        .order("started_at", { ascending: false })
        .abortSignal(signal);

      if (err) {
        logger.error("use_rooms_fetch_failed", { err: err.message });
        throw new Error(err.message);
      }

      const roomRows = (rows ?? []) as RoomRow[];
      const hostIds = Array.from(new Set(roomRows.map((r) => r.host_id)));

      let hostMap = new Map<string, ProfileRow>();
      if (hostIds.length > 0) {
        const { data: hosts } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", hostIds)
          .abortSignal(signal);
        hostMap = new Map(((hosts ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      }

      return roomRows.map((r) => toRoom(r, hostMap.get(r.host_id)));
    },
    [],
  );

  // Realtime: listen for any rooms-table change and refetch
  useRealtimeChannel(
    (client) =>
      client.channel("rooms-live").on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          void refetch();
        },
      ),
    [refetch],
  );

  const createRoom = useCallback(
    async (title: string, mode?: string, maxSpeakers = 5): Promise<string | null> => {
      if (!user) return null;
      const { data, error: err } = await supabase
        .from("rooms")
        .insert({
          host_id: user.id,
          title: title.trim() || "Salon",
          mode: mode ?? null,
          max_speakers: maxSpeakers,
          current_speakers: 1,
          current_listeners: 0,
          status: "live",
        })
        .select("id")
        .single();
      if (err) {
        logger.error("use_rooms_create_failed", { err: err.message });
        return null;
      }
      void refetch();
      return data?.id ?? null;
    },
    [user, refetch],
  );

  return {
    rooms: data ?? [],
    loading,
    error: error?.message ?? null,
    refresh: async () => {
      await refetch();
    },
    createRoom,
  };
}

// ---------- Hook (single room) ----------

interface UseRoomReturn {
  room: Room | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  endRoom: () => Promise<void>;
}

export function useRoom(roomId: string | undefined): UseRoomReturn {
  const { data, loading, error, refetch } = useAsyncResource<Room | null>(
    async (signal) => {
      if (!roomId) return null;

      const { data: row, error: err } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .abortSignal(signal)
        .maybeSingle();

      if (err || !row) {
        throw new Error(err?.message ?? "Salon introuvable");
      }

      const roomRow = row as RoomRow;
      const { data: host } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .eq("id", roomRow.host_id)
        .abortSignal(signal)
        .maybeSingle();

      return toRoom(roomRow, host as ProfileRow | undefined);
    },
    [roomId],
  );

  useRealtimeChannel(
    (client) =>
      roomId
        ? client.channel(`room-${roomId}`).on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "rooms",
              filter: `id=eq.${roomId}`,
            },
            () => {
              void refetch();
            },
          )
        : null,
    [roomId, refetch],
  );

  const endRoom = useCallback(async () => {
    if (!roomId) return;
    await supabase
      .from("rooms")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", roomId);
    void refetch();
  }, [roomId, refetch]);

  return {
    room: data ?? null,
    loading,
    error: error?.message ?? null,
    refresh: async () => {
      await refetch();
    },
    endRoom,
  };
}

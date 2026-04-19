"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "@/context/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: rows, error: err } = await supabase
      .from("rooms")
      .select("*")
      .eq("status", "live")
      .order("started_at", { ascending: false });

    if (err) {
      console.error("[useRooms] fetch failed:", err.message);
      setError(err.message);
      setRooms([]);
      setLoading(false);
      return;
    }

    const roomRows = (rows ?? []) as RoomRow[];
    const hostIds = Array.from(new Set(roomRows.map((r) => r.host_id)));

    let hostMap = new Map<string, ProfileRow>();
    if (hostIds.length > 0) {
      const { data: hosts } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", hostIds);
      hostMap = new Map(((hosts ?? []) as ProfileRow[]).map((p) => [p.id, p]));
    }

    setRooms(roomRows.map((r) => toRoom(r, hostMap.get(r.host_id))));
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRooms();

    // Realtime: listen for new rooms
    const channel: RealtimeChannel = supabase
      .channel("rooms-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          void fetchRooms();
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [fetchRooms]);

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
        console.error("[useRooms] createRoom failed:", err.message);
        return null;
      }
      void fetchRooms();
      return data?.id ?? null;
    },
    [user, fetchRooms],
  );

  return { rooms, loading, error, refresh: fetchRooms, createRoom };
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
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data: row, error: err } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (err || !row) {
      setError(err?.message ?? "Salon introuvable");
      setRoom(null);
      setLoading(false);
      return;
    }

    const roomRow = row as RoomRow;
    const { data: host } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("id", roomRow.host_id)
      .maybeSingle();

    setRoom(toRoom(roomRow, host as ProfileRow | undefined));
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    void fetchOne();

    if (!roomId) return;

    const channel: RealtimeChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => {
          void fetchOne();
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [roomId, fetchOne]);

  const endRoom = useCallback(async () => {
    if (!roomId) return;
    await supabase
      .from("rooms")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", roomId);
    void fetchOne();
  }, [roomId, fetchOne]);

  return { room, loading, error, refresh: fetchOne, endRoom };
}

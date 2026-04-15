"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface PresenceUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  last_seen: string;
}

interface PresencePayload {
  /** Supabase adds a presence_ref per connection */
  presence_ref: string;
  /** Our custom payload */
  user_id: string;
  name: string;
  avatar_url: string | null;
  mode: string | null;
  lat: number | null;
  lng: number | null;
  last_seen: string;
}

export interface UsePresenceResult {
  /** Array of users currently online (deduplicated by user_id) */
  onlineUsers: PresenceUser[];
  /** Shortcut count */
  onlineCount: number;
  /** Whether the local user is actively broadcasting presence */
  isTracking: boolean;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/** Deduplicate presence entries by user_id (keep latest) */
function dedupePresences(entries: PresencePayload[]): PresenceUser[] {
  const map = new Map<string, PresenceUser>();
  for (const p of entries) {
    map.set(p.user_id, {
      user_id: p.user_id,
      name: p.name,
      avatar_url: p.avatar_url,
      mode: p.mode,
      lat: p.lat,
      lng: p.lng,
      last_seen: p.last_seen,
    });
  }
  return Array.from(map.values());
}

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------

const CHANNEL_NAME = "online-users";
const HEARTBEAT_MS = 30_000; // 30 seconds

/**
 * usePresence -- real-time presence for CeSoir.
 *
 * Tracks the current user as online via Supabase Realtime Presence
 * on the "online-users" channel.  Broadcasts user metadata every
 * 30 s (heartbeat) so the server keeps the entry alive.
 *
 * @param mode   - active dating mode (e.g. "solo-diner")
 * @param lat    - current latitude (pass from useGeolocation)
 * @param lng    - current longitude
 */
export function usePresence(
  mode: string | null = null,
  lat: number | null = null,
  lng: number | null = null,
): UsePresenceResult {
  const { user } = useAuth();

  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  // Refs that survive re-renders without retriggering the effect
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep latest values accessible inside the heartbeat without re-running effect
  const latestRef = useRef({ mode, lat, lng });
  latestRef.current = { mode, lat, lng };

  // -------------------------------------------------------
  // Sync handler -- called on join, leave, sync
  // -------------------------------------------------------
  const handleSync = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const state = channel.presenceState<PresencePayload>();
    // state is Record<string, PresencePayload[]>
    const all: PresencePayload[] = Object.values(state).flat();
    setOnlineUsers(dedupePresences(all));
  }, []);

  // -------------------------------------------------------
  // Main subscription effect
  // -------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const profile = user.user_metadata ?? {};

    const buildPayload = () => ({
      user_id: user.id,
      name: (profile.name as string) ?? "Anonyme",
      avatar_url: (profile.avatar_url as string) ?? null,
      mode: latestRef.current.mode,
      lat: latestRef.current.lat,
      lng: latestRef.current.lng,
      last_seen: new Date().toISOString(),
    });

    // Create the channel
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    // Wire up presence events
    channel
      .on("presence", { event: "sync" }, handleSync)
      .on("presence", { event: "join" }, handleSync)
      .on("presence", { event: "leave" }, handleSync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Initial track
          await channel.track(buildPayload());
          setIsTracking(true);

          // Heartbeat: re-track every 30s to keep alive + refresh payload
          heartbeatRef.current = setInterval(async () => {
            await channel.track(buildPayload());
          }, HEARTBEAT_MS);
        }
      });

    // Cleanup on unmount or user change
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      channel.untrack().then(() => {
        supabase.removeChannel(channel);
      });
      channelRef.current = null;
      setIsTracking(false);
    };
    // Only re-run when the user identity changes (not on every lat/lng twitch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, handleSync]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isTracking,
  };
}

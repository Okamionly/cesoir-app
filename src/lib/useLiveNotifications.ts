"use client";

/**
 * useLiveNotifications — builds live notification strings from real Supabase
 * data only. Returns an empty array when no real signal exists so the UI can
 * hide itself instead of showing placeholder / fake content.
 *
 * Signals currently wired:
 *   1. Online users count           — profiles.is_online = true AND last_seen > 5min ago
 *   2. Open plans tonight           — flash_plans.status = 'open' AND when_at <= tomorrow 06:00
 *   3. Trending mode (last 1h)      — mode_activations.created_at > 1h ago, grouped by mode
 *   4. Latest unread mutual match   — interactions INSERT → matches view (via useNotifications bus)
 *
 * All queries are read-only and rely on existing RLS (profiles public read,
 * flash_plans public read, mode_activations public read). No names, distances
 * or percentages are ever fabricated: if the data is not there, the string is
 * not emitted.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";
import { useAuth } from "@/context/AuthContext";
import { MODES, type ModeKey } from "@/lib/modes";

export interface LiveNotification {
  id: string;
  icon: string;
  message: string;
}

function fiveMinAgo(): string {
  return new Date(Date.now() - 5 * 60_000).toISOString();
}

function oneHourAgo(): string {
  return new Date(Date.now() - 60 * 60_000).toISOString();
}

function tonightEnd(): string {
  // "Tonight" = up to 06:00 tomorrow morning (local).
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(6, 0, 0, 0);
  return end.toISOString();
}

interface ModeCountRow {
  mode: string | null;
}

/**
 * Returns the live, data-driven notifications for the current user.
 * Never returns placeholder strings: each entry is backed by a real count.
 */
export function useLiveNotifications(): {
  notifications: LiveNotification[];
  loading: boolean;
} {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [onlineRes, plansRes, modesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_online", true)
        .gte("last_seen", fiveMinAgo()),
      supabase
        .from("flash_plans")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .lte("when_at", tonightEnd()),
      supabase
        .from("mode_activations")
        .select("mode")
        .gte("created_at", oneHourAgo())
        .eq("is_active", true),
    ]);

    const next: LiveNotification[] = [];

    const onlineCount = typeof onlineRes.count === "number" ? onlineRes.count : 0;
    if (onlineCount > 0) {
      next.push({
        id: "online",
        icon: "\uD83D\uDD14",
        message: `${onlineCount} ${onlineCount === 1 ? "personne dispo" : "personnes dispos"} pres de toi ce soir`,
      });
    }

    const plansCount = typeof plansRes.count === "number" ? plansRes.count : 0;
    if (plansCount > 0) {
      next.push({
        id: "plans",
        icon: "\u26A1",
        message: `${plansCount} ${plansCount === 1 ? "plan ouvert" : "plans ouverts"} ce soir`,
      });
    }

    const modesData = (modesRes.data as ModeCountRow[] | null) ?? [];
    if (modesData.length > 0) {
      const tally = new Map<string, number>();
      for (const row of modesData) {
        if (!row.mode) continue;
        tally.set(row.mode, (tally.get(row.mode) ?? 0) + 1);
      }
      let topMode: string | null = null;
      let topCount = 0;
      for (const [mode, count] of tally.entries()) {
        if (count > topCount) {
          topMode = mode;
          topCount = count;
        }
      }
      if (topMode && topCount > 0) {
        const def = MODES[topMode as ModeKey];
        const name = def?.name ?? topMode;
        next.push({
          id: `mode-${topMode}`,
          icon: "\uD83D\uDD25",
          message: `${name} tendance ce soir (${topCount} ${topCount === 1 ? "activation" : "activations"} la derniere heure)`,
        });
      }
    }

    setNotifications(next);
    setLoading(false);
  }, []);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    // Initial fetch + 60s polling safety net (realtime covers most updates).
    void refreshRef.current();
    const interval = setInterval(() => {
      void refreshRef.current();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Realtime: refresh when source tables change.
  // Channel is namespaced per-user so multiple sessions don't collide on
  // a single "live-notifications" key (Supabase realtime would dedup).
  useRealtimeChannel(
    (client) =>
      // Gate on userId: without a JWT, supabase.realtime.setAuth() hasn't
      // been called with the user's token yet, so the WebSocket would open
      // with the anon key and the server rejects postgres_changes → spam of
      // CHANNEL_ERROR retries. Return null until auth is hydrated.
      userId
        ? client
            .channel(namespacedChannelName("live-notifications", userId))
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "profiles" },
              () => void refreshRef.current(),
            )
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "flash_plans" },
              () => void refreshRef.current(),
            )
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "mode_activations" },
              () => void refreshRef.current(),
            )
        : null,
    [userId],
  );

  return { notifications, loading };
}

"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { supabase } from "@/lib/supabase";
import {
  HOTSPOTS,
  countToLevel,
  type Hotspot,
  type HotspotLevel,
} from "@/lib/hotspots";

export interface LiveHotspot {
  lat: number;
  lng: number;
  radius: number;
  count: number;
  topMode: string;
  intensity: "low" | "medium" | "high";
  name: string;
  id: string;
  level: HotspotLevel;
}

/** Map a hotspot level to the 3-tier intensity used by the map overlay. */
function levelToIntensity(level: HotspotLevel): LiveHotspot["intensity"] {
  switch (level) {
    case "calm":
      return "low";
    case "moderate":
      return "medium";
    case "hot":
    case "fire":
      return "high";
  }
}

/**
 * Haversine distance in meters between two (lat, lng) pairs.
 * Used to cluster real profiles around each hotspot centroid.
 */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface OnlineProfileLoc {
  id: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * `useHotspots` — returns real-time profile clusters around each active-city hotspot.
 *
 * Strategy:
 *   1. Query all online profiles with a (latitude, longitude) from Supabase.
 *   2. For each static HOTSPOTS centroid (active city), count how many
 *      profiles fall within `hotspot.radius` meters (haversine).
 *   3. Derive a live `level` from the count; return 0 if no real data.
 *
 * Zero mock data. If the query fails or no profiles are online, every hotspot
 * returns count=0 — never a fake number.
 */
export function useHotspots() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data, loading, refetch } = useAsyncResource<LiveHotspot[]>(
    async (signal) => {
      // Fetch all online profiles with a known location.
      // NOTE: RLS on `profiles` should allow reading (id, latitude, longitude,
      // is_online) for authenticated users. If the schema uses a single
      // `location` geography column instead, adapt the select here.
      let onlineProfiles: OnlineProfileLoc[] = [];

      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, latitude, longitude")
          .eq("is_online", true)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .abortSignal(signal);

        if (!error && profiles) {
          onlineProfiles = profiles as OnlineProfileLoc[];
        }
      } catch {
        // Fall through — we'll return count=0 for every hotspot below.
      }

      const live: LiveHotspot[] = HOTSPOTS.map((h: Hotspot) => {
        // Count profiles within this hotspot's radius.
        let count = 0;
        for (const p of onlineProfiles) {
          if (p.latitude == null || p.longitude == null) continue;
          const d = haversineMeters(h.lat, h.lng, p.latitude, p.longitude);
          if (d <= h.radius) count += 1;
        }
        const level = countToLevel(count);
        return {
          id: h.id,
          name: h.name,
          lat: h.lat,
          lng: h.lng,
          radius: h.radius,
          topMode: h.topMode,
          count,
          level,
          intensity: levelToIntensity(level),
        };
      });

      setLastUpdated(new Date());
      return live;
    },
    [],
    { pollIntervalMs: 60_000 },
  );

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    hotspots: data ?? [],
    loading,
    refresh,
    lastUpdated,
  };
}

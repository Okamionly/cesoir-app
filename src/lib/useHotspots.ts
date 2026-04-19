"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { PARIS_HOTSPOTS, type Hotspot } from "@/lib/hotspots";

export interface LiveHotspot {
  lat: number;
  lng: number;
  radius: number;
  count: number;
  topMode: string;
  intensity: "low" | "medium" | "high";
  name: string;
  id: string;
}

function hotspotToLive(h: Hotspot): LiveHotspot {
  const intensityMap: Record<Hotspot["level"], LiveHotspot["intensity"]> = {
    calm: "low",
    moderate: "medium",
    hot: "high",
    fire: "high",
  };

  return {
    lat: h.lat,
    lng: h.lng,
    radius: h.radius,
    count: h.activeUsers,
    topMode: h.topMode,
    intensity: intensityMap[h.level],
    name: h.name,
    id: h.id,
  };
}

// Simulate live fluctuations in user counts
function jitterCount(base: number): number {
  const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
  return Math.max(1, base + delta);
}

// Extra mock hotspots to reach 12 total
const EXTRA_HOTSPOTS: Hotspot[] = [
  {
    id: "11",
    name: "Republique",
    lat: 48.8675,
    lng: 2.3637,
    radius: 380,
    level: "hot",
    activeUsers: 22,
    topMode: "Plus-One",
    description: "Place animee ce soir",
  },
  {
    id: "12",
    name: "Grands Boulevards",
    lat: 48.8717,
    lng: 2.3445,
    radius: 320,
    level: "moderate",
    activeUsers: 14,
    topMode: "Culture Club",
    description: "Theatres et cinemas",
  },
];

const ALL_HOTSPOTS = [...PARIS_HOTSPOTS, ...EXTRA_HOTSPOTS];

export function useHotspots() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data, loading, refetch } = useAsyncResource<LiveHotspot[]>(
    async () => {
      // In production this would be a Supabase query:
      // const { data } = await supabase.rpc('get_hotspot_counts')
      // For now, use mock data with jittered counts
      const live = ALL_HOTSPOTS.map((h) => {
        const base = hotspotToLive(h);
        const count = jitterCount(h.activeUsers);
        return {
          ...base,
          count,
          intensity: (count > 25 ? "high" : count > 12 ? "medium" : "low") as LiveHotspot["intensity"],
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

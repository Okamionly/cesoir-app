"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  // Map the existing level to our intensity scale
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
  const [hotspots, setHotspots] = useState<LiveHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHotspots = useCallback(() => {
    // In production this would be a Supabase query:
    // const { data } = await supabase.rpc('get_hotspot_counts')
    // For now, use mock data with jittered counts
    const live = ALL_HOTSPOTS.map((h) => {
      const base = hotspotToLive(h);
      return {
        ...base,
        count: jitterCount(h.activeUsers),
        // Recalculate intensity based on jittered count
        intensity: (base.count > 25 ? "high" : base.count > 12 ? "medium" : "low") as LiveHotspot["intensity"],
      };
    });

    setHotspots(live);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      fetchHotspots();
    }, 300);
  }, [fetchHotspots]);

  useEffect(() => {
    fetchHotspots();

    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(fetchHotspots, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchHotspots]);

  return { hotspots, loading, refresh, lastUpdated };
}

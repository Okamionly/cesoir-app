"use client";

import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { MOCK_PROFILES, Profile } from "./mock-profiles";

export function useProfiles(lat?: number, lng?: number, mode?: string) {
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);

  useEffect(() => {
    async function fetchReal() {
      if (!lat || !lng) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("nearby_profiles", {
          user_lat: lat,
          user_lng: lng,
          radius_km: 10,
          mode_filter: mode || null,
          gender_filter: null,
          limit_count: 50,
        });

        if (!error && data && data.length > 0) {
          const realProfiles: Profile[] = data.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            age: p.age as number,
            mode: (p.mode as string) || "solo-diner",
            bio: (p.bio as string) || "",
            distance: Math.round((p.distance_km as number) * 10) / 10,
            time: (p.available_time as string) || "Dispo maintenant",
            color: "#8B5CF6",
            photo: (p.avatar_url as string) || `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`,
          }));
          setProfiles(realProfiles);
          setIsReal(true);
        }
        // If no real profiles, keep mock data as fallback
      } catch {
        // Silently fall back to mock data
      }
      setLoading(false);
    }

    fetchReal();
  }, [lat, lng, mode]);

  return { profiles, loading, isReal };
}

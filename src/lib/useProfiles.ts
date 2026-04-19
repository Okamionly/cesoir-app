"use client";

import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { supabase } from "./supabase";
import { type Profile } from "./mock-profiles";
import { app } from "./design-tokens";

export function useProfiles(lat?: number, lng?: number, mode?: string) {
  const { data, loading } = useAsyncResource<{ profiles: Profile[]; isReal: boolean }>(
    async (signal) => {
      if (!lat || !lng) {
        return { profiles: [], isReal: false };
      }

      try {
        const { data, error } = await supabase
          .rpc("nearby_profiles", {
            user_lat: lat,
            user_lng: lng,
            radius_km: 10,
            mode_filter: mode || null,
            gender_filter: null,
            limit_count: 50,
          })
          .abortSignal(signal);

        if (!error && data && data.length > 0) {
          const realProfiles: Profile[] = data.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            age: p.age as number,
            mode: (p.mode as string) || "solo-diner",
            bio: (p.bio as string) || "",
            distance: Math.round((p.distance_km as number) * 10) / 10,
            time: (p.available_time as string) || "Dispo maintenant",
            color: app.violet,
            photo:
              (p.avatar_url as string) ||
              `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`,
          }));
          return { profiles: realProfiles, isReal: true };
        }
        return { profiles: [], isReal: false };
      } catch {
        // Silently fall back
        return { profiles: [], isReal: false };
      }
    },
    [lat, lng, mode],
  );

  return {
    profiles: data?.profiles ?? [],
    loading,
    isReal: data?.isReal ?? false,
  };
}

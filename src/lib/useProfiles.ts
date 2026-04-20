"use client";

import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { supabase } from "./supabase";
import { type Profile } from "./mock-profiles";
import { app } from "./design-tokens";

export interface ProfilesFilters {
  mode?: string;
  /** Max radius in km forwarded to `nearby_profiles.radius_km`. */
  maxDistance?: number;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  limit?: number;
}

/**
 * `useProfiles` — fetches nearby profiles via the `nearby_profiles` RPC.
 *
 * Backwards-compatible: the legacy `(lat, lng, mode)` signature still works,
 * but you can now pass a full `ProfilesFilters` object as the 4th arg to
 * forward distance/age/gender filters to the RPC. All filter fields are
 * optional — the server applies them only when non-null.
 */
export function useProfiles(
  lat?: number,
  lng?: number,
  mode?: string,
  filters?: ProfilesFilters,
) {
  const radius = filters?.maxDistance ?? 10;
  const minAge = filters?.minAge ?? null;
  const maxAge = filters?.maxAge ?? null;
  const gender = filters?.gender ?? null;
  const effectiveMode = filters?.mode ?? mode ?? null;
  const limit = filters?.limit ?? 50;

  const { data, loading } = useAsyncResource<{
    profiles: Profile[];
    isReal: boolean;
  }>(
    async (signal) => {
      if (!lat || !lng) {
        return { profiles: [], isReal: false };
      }

      try {
        const { data, error } = await supabase
          .rpc("nearby_profiles", {
            user_lat: lat,
            user_lng: lng,
            radius_km: radius,
            mode_filter: effectiveMode,
            gender_filter: gender,
            age_min: minAge ?? undefined,
            age_max: maxAge ?? undefined,
            limit_count: limit,
          })
          .abortSignal(signal);

        if (!error && data && data.length > 0) {
          const realProfiles: Profile[] = data.map(
            (p: Record<string, unknown>) => ({
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
                `https://ui-avatars.com/api/?name=${encodeURIComponent((p.name as string) || "?")}&background=8B5CF6&color=fff&bold=true&size=256&format=svg`,
            }),
          );
          return { profiles: realProfiles, isReal: true };
        }
        return { profiles: [], isReal: false };
      } catch {
        // Silently fall back
        return { profiles: [], isReal: false };
      }
    },
    [lat, lng, effectiveMode, radius, minAge, maxAge, gender, limit],
  );

  return {
    profiles: data?.profiles ?? [],
    loading,
    isReal: data?.isReal ?? false,
  };
}

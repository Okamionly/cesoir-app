"use client";

import { useAsyncResource } from "@/lib/hooks/useAsyncResource";
import { supabase } from "./supabase";
import { type Profile } from "./mock-profiles";
import { app } from "./design-tokens";
import { logger } from "./logger";

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
          // 2026-04-26 fix: dedupe by id. The nearby_profiles RPC LEFT JOINs
          // mode_activations, so a profile with N active modes appears N
          // times in the result set. /map's React keys collide, /browse
          // shows duplicates in the swipe deck. Keep the FIRST occurrence
          // (which contains the user's primary mode per the LEFT JOIN
          // ordering); drop the rest.
          const seen = new Set<string>();
          const realProfiles: Profile[] = (data as Array<Record<string, unknown>>)
            .filter((p) => {
              const id = p.id as string;
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            })
            .map((p) => ({
              id: p.id as string,
              name: p.name as string,
              age: p.age as number,
              mode: ((p.mode as string) || "solo-diner") as Profile["mode"],
              bio: (p.bio as string) || "",
              distance: Math.round((p.distance_km as number) * 10) / 10,
              time: (p.available_time as string) || "Dispo maintenant",
              color: app.violet,
              photo:
                (p.avatar_url as string) ||
                // 2026-04-26 fix: format=svg returned 400 through next/image
                // because dangerouslyAllowSVG defaults to false. Use format=png.
                `https://ui-avatars.com/api/?name=${encodeURIComponent((p.name as string) || "?")}&background=8B5CF6&color=fff&bold=true&size=256&format=png`,
            }));
          return { profiles: realProfiles, isReal: true };
        }
        return { profiles: [], isReal: false };
      } catch (err) {
        logger.error("nearby_profiles_rpc_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
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

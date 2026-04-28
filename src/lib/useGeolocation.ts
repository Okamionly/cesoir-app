"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface UseGeolocationResult {
  /** Current latitude or null while loading / denied */
  latitude: number | null;
  /** Current longitude or null while loading / denied */
  longitude: number | null;
  /** GPS accuracy in meters */
  accuracy: number | null;
  /** True while the initial position is being acquired */
  loading: boolean;
  /** Human-readable error message (null when OK) */
  error: string | null;
}

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------

/** Max one Supabase location write per 30 seconds */
const DEBOUNCE_MS = 30_000;

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 60_000, // accept cached position up to 1 min old
};

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------

/**
 * useGeolocation -- continuous position watcher for CeSoir.
 *
 * Uses `navigator.geolocation.watchPosition` to stream updates.
 * Debounces writes to Supabase's `update_location` RPC so we
 * never call it more than once per 30 seconds.
 *
 * Falls back gracefully:
 * - No navigator.geolocation -> returns error, no crash
 * - Permission denied -> returns user-friendly message
 * - Position unavailable / timeout -> returns error
 */
export function useGeolocation(): UseGeolocationResult {
  const { user } = useAuth();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the last time we pushed to Supabase to enforce debounce
  const lastPushRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  // -------------------------------------------------------
  // Push to Supabase (debounced)
  // -------------------------------------------------------
  const pushLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!user) return;

      const now = Date.now();
      if (now - lastPushRef.current < DEBOUNCE_MS) return;
      lastPushRef.current = now;

      try {
        await supabase.rpc("update_location", {
          lat,
          lng,
        });
      } catch {
        // Non-critical -- location still works locally even if RPC fails
        logger.warn("use_geolocation_update_location_rpc_failed");
      }
    },
    [user],
  );

  // -------------------------------------------------------
  // Watch effect
  // -------------------------------------------------------
  useEffect(() => {
    // Guard: SSR or unsupported browser
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocalisation non supportee par ce navigateur");
      setLoading(false);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
      setLatitude(lat);
      setLongitude(lng);
      setAccuracy(acc);
      setError(null);
      setLoading(false);

      // Debounced push
      pushLocation(lat, lng);
    };

    const onError = (err: GeolocationPositionError) => {
      setLoading(false);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError("Active la géolocalisation pour voir les gens près de toi");
          break;
        case err.POSITION_UNAVAILABLE:
          setError("Position indisponible");
          break;
        case err.TIMEOUT:
          setError("Delai depasse pour la geolocalisation");
          break;
        default:
          setError("Erreur de geolocalisation");
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      GEO_OPTIONS,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [pushLocation]);

  return { latitude, longitude, accuracy, loading, error };
}

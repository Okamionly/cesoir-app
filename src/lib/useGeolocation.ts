"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface UseGeolocationResult {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useGeolocation(userId?: string): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalisation non supportee");
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setPosition(newPos);
        setError(null);
        setLoading(false);

        // Save to Supabase if user is authenticated
        if (userId) {
          await supabase.rpc("update_location", {
            user_id: userId,
            lat: newPos.lat,
            lng: newPos.lng,
          });
        }
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Active la geolocalisation pour voir les gens pres de toi");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Position indisponible");
            break;
          case err.TIMEOUT:
            setError("Delai depasse");
            break;
          default:
            setError("Erreur de geolocalisation");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [userId]);

  useEffect(() => {
    getPosition();

    // Update position every 5 minutes
    const interval = setInterval(getPosition, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getPosition]);

  return { position, error, loading, refresh: getPosition };
}

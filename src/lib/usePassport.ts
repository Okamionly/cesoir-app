/**
 * usePassport — read/set/clear the user's travel passport (Wave 17, mig 040).
 *
 * The passport sets a future location for matching: while the window
 * (`activeFrom <= now() <= activeUntil`) is open, `nearby_profiles` swaps
 * the caller's GPS for the passport coords and (reciprocally) the peer's
 * `location` for the peer's passport coords. Real device GPS is never
 * touched — `/map` continues to read `useGeolocation`.
 *
 * Backed by 5 columns on `public.profiles`:
 *   passport_lat, passport_lng         DOUBLE PRECISION
 *   passport_city                      TEXT
 *   passport_active_from               TIMESTAMPTZ
 *   passport_active_until              TIMESTAMPTZ
 *
 * Constraints (enforced server-side via CHECK constraint on profiles):
 *   - Either all 5 columns set or all NULL.
 *   - Window length capped at 30 days.
 *   - lat/lng in valid geo range.
 *
 * The hook keeps a small client-side mirror so the UI updates instantly
 * after `setPassport` / `clearPassport` without waiting for a refetch.
 */
"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/lib/hooks/useSupabaseQuery";
import { logger } from "@/lib/logger";

/** Max passport window length, mirrors the SQL CHECK constraint. */
export const PASSPORT_MAX_DAYS = 30;

interface PassportRow {
  passport_lat: number | null;
  passport_lng: number | null;
  passport_city: string | null;
  passport_active_from: string | null;
  passport_active_until: string | null;
}

export interface PassportState {
  /** Display name of the target city, e.g. "Lyon". `null` when no passport. */
  city: string | null;
  /** Target latitude. `null` when no passport. */
  lat: number | null;
  /** Target longitude. `null` when no passport. */
  lng: number | null;
  /** ISO timestamptz string for the window start, or `null`. */
  activeFrom: string | null;
  /** ISO timestamptz string for the window end, or `null`. */
  activeUntil: string | null;
  /** True iff `now()` is between activeFrom and activeUntil. */
  isActive: boolean;
  /** True iff a passport row is set but the window is in the future. */
  isUpcoming: boolean;
}

const EMPTY: PassportState = {
  city: null,
  lat: null,
  lng: null,
  activeFrom: null,
  activeUntil: null,
  isActive: false,
  isUpcoming: false,
};

export interface SetPassportArgs {
  city: string;
  lat: number;
  lng: number;
  /** Window start (Date or ISO string). Defaults to "now" if omitted. */
  activeFrom?: Date | string;
  /** Window end (Date or ISO string). Required. */
  activeUntil: Date | string;
}

export interface UsePassportReturn {
  /** Resolved state — never `null`, defaults to all-fields-null shape. */
  passport: PassportState;
  /** True while the initial fetch is in flight. */
  loading: boolean;
  error: Error | null;
  /** Re-fetch the row (rarely needed — the mutators auto-refetch). */
  refetch: () => Promise<void>;
  /** Set or replace the passport. Throws if window > 30 days. */
  setPassport: (args: SetPassportArgs) => Promise<void>;
  /** Clear all 5 passport columns (no-op if already null). */
  clearPassport: () => Promise<void>;
}

function deriveState(row: PassportRow | null): PassportState {
  if (!row) return EMPTY;
  const { passport_lat, passport_lng, passport_city, passport_active_from, passport_active_until } = row;
  if (
    passport_lat === null ||
    passport_lng === null ||
    !passport_city ||
    !passport_active_from ||
    !passport_active_until
  ) {
    return EMPTY;
  }
  const now = Date.now();
  const fromMs = new Date(passport_active_from).getTime();
  const untilMs = new Date(passport_active_until).getTime();
  const isActive = now >= fromMs && now <= untilMs;
  const isUpcoming = !isActive && now < fromMs;
  return {
    city: passport_city,
    lat: passport_lat,
    lng: passport_lng,
    activeFrom: passport_active_from,
    activeUntil: passport_active_until,
    isActive,
    isUpcoming,
  };
}

export function usePassport(): UsePassportReturn {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, loading, error, refetch } = useSupabaseQuery<PassportRow>(
    async (client) => {
      if (!userId) return { data: null, error: null };
      const result = await client
        .from("profiles")
        .select(
          "passport_lat, passport_lng, passport_city, passport_active_from, passport_active_until",
        )
        .eq("id", userId)
        .maybeSingle();
      return result as { data: PassportRow | null; error: typeof result.error };
    },
    [userId],
    { enabled: Boolean(userId) },
  );

  const passport = useMemo(() => deriveState(data ?? null), [data]);

  const setPassport = useCallback(
    async ({ city, lat, lng, activeFrom, activeUntil }: SetPassportArgs) => {
      if (!userId) throw new Error("usePassport.setPassport: not authenticated");

      const fromIso = activeFrom
        ? typeof activeFrom === "string"
          ? activeFrom
          : activeFrom.toISOString()
        : new Date().toISOString();
      const untilIso =
        typeof activeUntil === "string" ? activeUntil : activeUntil.toISOString();

      // Defensive: enforce the same 30-day cap client-side so the user
      // gets a clear error rather than a Postgres CHECK violation.
      const windowMs = new Date(untilIso).getTime() - new Date(fromIso).getTime();
      if (windowMs <= 0) {
        throw new Error("Passport: activeUntil must be after activeFrom");
      }
      if (windowMs > PASSPORT_MAX_DAYS * 24 * 60 * 60 * 1000) {
        throw new Error(`Passport: window cannot exceed ${PASSPORT_MAX_DAYS} days`);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          passport_lat: lat,
          passport_lng: lng,
          passport_city: city,
          passport_active_from: fromIso,
          passport_active_until: untilIso,
        })
        .eq("id", userId);

      if (updateError) {
        logger.error("passport_set_failed", { err: updateError.message });
        throw new Error(updateError.message);
      }
      await refetch();
    },
    [userId, refetch],
  );

  const clearPassport = useCallback(async () => {
    if (!userId) throw new Error("usePassport.clearPassport: not authenticated");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        passport_lat: null,
        passport_lng: null,
        passport_city: null,
        passport_active_from: null,
        passport_active_until: null,
      })
      .eq("id", userId);
    if (updateError) {
      logger.error("passport_clear_failed", { err: updateError.message });
      throw new Error(updateError.message);
    }
    await refetch();
  }, [userId, refetch]);

  return {
    passport,
    loading,
    error: (error as Error | null) ?? null,
    refetch,
    setPassport,
    clearPassport,
  };
}

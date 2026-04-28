/**
 * useVibe — read & write the current user's nightly vibe (mig 039).
 *
 * The vibe expires at UTC midnight; we read through the get_vibe_today
 * RPC so a stale value (set the previous day) is automatically returned
 * as null without any cleanup job.
 *
 * Writes are optimistic — the UI flips instantly, and we roll back if
 * the upsert fails. This is the same pattern used by AvailabilityBroadcast.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { VibeId } from "@/lib/vibes";

interface UseVibeReturn {
  /** Current vibe (today only — null if cleared or stale). */
  vibe: VibeId | null;
  /** True while a network mutation is in flight. */
  saving: boolean;
  /** True while the initial fetch is running. */
  loading: boolean;
  /** Set the vibe (or pass null to clear it). */
  setVibe: (next: VibeId | null) => Promise<void>;
}

export function useVibe(): UseVibeReturn {
  const { user } = useAuth();
  const [vibe, setLocalVibe] = useState<VibeId | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Hydrate from RPC on mount ──
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    supabase
      .rpc("get_vibe_today", { uid: user.id })
      .then(({ data, error }: { data: string | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          logger.error("use_vibe_rpc_failed", { err: error.message });
          setLocalVibe(null);
        } else {
          setLocalVibe((data as VibeId | null) ?? null);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setVibe = useCallback(
    async (next: VibeId | null) => {
      if (!user || saving) return;

      const previous = vibe;
      setLocalVibe(next); // optimistic
      setSaving(true);

      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            vibe_today: next,
            // Clear vibe_set_at when the vibe is cleared so the row stays
            // consistent (NULL/NULL rather than NULL/timestamp).
            vibe_set_at: next ? new Date().toISOString() : null,
          })
          .eq("id", user.id);

        if (error) {
          setLocalVibe(previous); // rollback
          logger.error("use_vibe_update_failed", { err: error.message });
          throw new Error(error.message);
        }
      } catch (err) {
        setLocalVibe(previous);
        logger.error("use_vibe_network_failed", {
          err: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setSaving(false);
      }
    },
    [user, vibe, saving],
  );

  return { vibe, saving, loading, setVibe };
}

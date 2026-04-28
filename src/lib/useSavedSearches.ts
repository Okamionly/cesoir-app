"use client";

/**
 * useSavedSearches — Wave 17 saved search bookmarks hook.
 *
 * Lets a power user bookmark a filter combo on a given surface
 * ("events" | "map" | "browse") under a short name and recall it
 * later as a quick-access chip.
 *
 * Surface design
 * ──────────────
 * Each surface (EventFilters / MapFiltersSheet / future browse) has
 * its own filter shape. We keep this hook surface-agnostic by storing
 * the filters as an opaque JSON object — the caller is responsible
 * for serializing/deserializing into its own state type.
 *
 * Sort order
 * ──────────
 * The list is ordered by `last_used_at DESC NULLS LAST, created_at DESC`
 * so the chip the user just tapped jumps to the front.
 *
 * Caps + validation
 * ─────────────────
 * The 10-per-surface cap is enforced server-side via a trigger. The
 * client-side validation here only covers the name length (1..30
 * trimmed) — every other invariant is the DB's job. If the cap is hit
 * the insert returns an error with a recognisable message.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type SavedSearchSurface = "events" | "map" | "browse";

export interface SavedSearch<TFilters = Record<string, unknown>> {
  id: string;
  name: string;
  surface: SavedSearchSurface;
  filters: TFilters;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface UseSavedSearchesResult<TFilters = Record<string, unknown>> {
  searches: SavedSearch<TFilters>[];
  loading: boolean;
  error: Error | null;
  /**
   * Persist `filters` under `name` for the active surface. Returns the
   * inserted row, or throws if validation / cap fails.
   */
  saveCurrentAs: (name: string, filters: TFilters) => Promise<SavedSearch<TFilters>>;
  /**
   * Stamp `last_used_at = now()` on the row and return its filters
   * payload so the caller can apply it to its own filter state.
   */
  apply: (id: string) => Promise<TFilters | null>;
  /**
   * Rename an existing saved search. Same 1..30 char rule.
   */
  rename: (id: string, name: string) => Promise<void>;
  /**
   * Delete a saved search by id.
   */
  remove: (id: string) => Promise<void>;
  /** Force a re-fetch — useful after external writes. */
  refetch: () => Promise<void>;
}

// ─────────────────────────────────────────
// DB row shape (matches migration 048)
// ─────────────────────────────────────────

interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  surface: SavedSearchSurface;
  filters: Record<string, unknown>;
  created_at: string;
  last_used_at: string | null;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Trim + length-validate the name (matches DB CHECK). */
function validateName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    throw new Error("Le nom doit faire entre 1 et 30 caracteres.");
  }
  return trimmed;
}

function rowToSavedSearch<TFilters>(row: SavedSearchRow): SavedSearch<TFilters> {
  return {
    id: row.id,
    name: row.name,
    surface: row.surface,
    filters: row.filters as TFilters,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useSavedSearches<TFilters = Record<string, unknown>>(
  surface: SavedSearchSurface,
): UseSavedSearchesResult<TFilters> {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [searches, setSearches] = useState<SavedSearch<TFilters>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the latest in-flight request so a fast surface switch
  // does not let a stale resolution overwrite the new state.
  const reqIdRef = useRef(0);

  const fetchSearches = useCallback(async () => {
    if (!userId) {
      setSearches([]);
      setLoading(false);
      return;
    }

    const myReq = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    // Cast through unknown — the saved_searches table is not yet in the
    // generated types file (added by migration 048). Once `npm run db:types`
    // is re-run we can drop this cast.
    const { data, error: fetchError } = await (supabase as unknown as {
      from: (t: "saved_searches") => {
        select: (q: string) => {
          eq: (col: string, v: string) => {
            eq: (col: string, v: string) => {
              order: (
                col: string,
                opts: { ascending: boolean; nullsFirst?: boolean },
              ) => {
                order: (
                  col: string,
                  opts: { ascending: boolean },
                ) => Promise<{ data: SavedSearchRow[] | null; error: Error | null }>;
              };
            };
          };
        };
      };
    })
      .from("saved_searches")
      .select("id, user_id, name, surface, filters, created_at, last_used_at")
      .eq("user_id", userId)
      .eq("surface", surface)
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (myReq !== reqIdRef.current) return; // stale

    if (fetchError) {
      setError(fetchError);
      setSearches([]);
      setLoading(false);
      return;
    }

    setSearches((data ?? []).map(rowToSavedSearch<TFilters>));
    setLoading(false);
  }, [userId, surface]);

  useEffect(() => {
    void fetchSearches();
  }, [fetchSearches]);

  // ── saveCurrentAs ──────────────────────────────────────
  const saveCurrentAs = useCallback(
    async (rawName: string, filters: TFilters): Promise<SavedSearch<TFilters>> => {
      if (!userId) throw new Error("Connecte-toi pour enregistrer une recherche.");
      const name = validateName(rawName);

      const insertPayload = {
        user_id: userId,
        name,
        surface,
        filters: filters as unknown as Record<string, unknown>,
      };

      const { data, error: insertError } = await (supabase as unknown as {
        from: (t: "saved_searches") => {
          insert: (row: typeof insertPayload) => {
            select: (q: string) => {
              single: () => Promise<{ data: SavedSearchRow | null; error: Error | null }>;
            };
          };
        };
      })
        .from("saved_searches")
        .insert(insertPayload)
        .select("id, user_id, name, surface, filters, created_at, last_used_at")
        .single();

      if (insertError) {
        // Surface the cap error in plain French so the UI can show it.
        const msg = insertError.message ?? "";
        if (msg.includes("cap reached")) {
          throw new Error("Tu as atteint la limite de 10 recherches enregistrees. Supprime-en une avant.");
        }
        throw insertError;
      }
      if (!data) throw new Error("Impossible d enregistrer la recherche.");

      const inserted = rowToSavedSearch<TFilters>(data);
      // Optimistic prepend — the new row has no last_used_at yet so the
      // sort order would put it after recently-used ones, but the user
      // just created it so we float it to the top until next fetch.
      setSearches((prev) => [inserted, ...prev]);
      return inserted;
    },
    [userId, surface],
  );

  // ── apply (stamp last_used_at + return filters) ────────
  const apply = useCallback(
    async (id: string): Promise<TFilters | null> => {
      if (!userId) return null;
      const target = searches.find((s) => s.id === id);
      if (!target) return null;

      const now = new Date().toISOString();

      // Optimistic: bump local last_used_at so the chip jumps to the front
      // immediately. If the write fails we leave the optimistic state — a
      // reload will reconcile from server truth.
      setSearches((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? { ...s, lastUsedAt: now } : s,
        );
        // Re-sort by lastUsedAt DESC nulls last, then createdAt DESC.
        updated.sort((a, b) => {
          const aT = a.lastUsedAt ? Date.parse(a.lastUsedAt) : -Infinity;
          const bT = b.lastUsedAt ? Date.parse(b.lastUsedAt) : -Infinity;
          if (aT !== bT) return bT - aT;
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        });
        return updated;
      });

      // Best-effort write — failure is non-fatal (chip still applied).
      void (supabase as unknown as {
        from: (t: "saved_searches") => {
          update: (row: { last_used_at: string }) => {
            eq: (col: string, v: string) => Promise<{ error: Error | null }>;
          };
        };
      })
        .from("saved_searches")
        .update({ last_used_at: now })
        .eq("id", id);

      return target.filters;
    },
    [userId, searches],
  );

  // ── rename ──────────────────────────────────────────────
  const rename = useCallback(
    async (id: string, rawName: string): Promise<void> => {
      if (!userId) throw new Error("Connecte-toi.");
      const name = validateName(rawName);

      const { error: updateError } = await (supabase as unknown as {
        from: (t: "saved_searches") => {
          update: (row: { name: string }) => {
            eq: (col: string, v: string) => Promise<{ error: Error | null }>;
          };
        };
      })
        .from("saved_searches")
        .update({ name })
        .eq("id", id);

      if (updateError) throw updateError;

      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name } : s)),
      );
    },
    [userId],
  );

  // ── remove ──────────────────────────────────────────────
  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!userId) return;

      // Optimistic
      const snapshot = searches;
      setSearches((prev) => prev.filter((s) => s.id !== id));

      const { error: deleteError } = await (supabase as unknown as {
        from: (t: "saved_searches") => {
          delete: () => {
            eq: (col: string, v: string) => Promise<{ error: Error | null }>;
          };
        };
      })
        .from("saved_searches")
        .delete()
        .eq("id", id);

      if (deleteError) {
        // Roll back
        setSearches(snapshot);
        throw deleteError;
      }
    },
    [userId, searches],
  );

  return {
    searches,
    loading,
    error,
    saveCurrentAs,
    apply,
    rename,
    remove,
    refetch: fetchSearches,
  };
}

export default useSavedSearches;

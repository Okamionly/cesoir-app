"use client";

/**
 * usePlanSuggestions — React hook for the auto-generated "make a plan
 * together" prompts (Wave 17).
 *
 * Flow
 * ────
 * 1. Migration 043 installs an AFTER INSERT/UPDATE trigger on
 *    `event_rsvps`. When user A RSVPs an event in an attending state
 *    and a mutual match B has also already RSVP'd, the trigger writes
 *    a row to `plan_suggestions` (event_id, user_a, user_b — pair
 *    ordered).
 * 2. This hook reads `plan_suggestions` for the current user (either
 *    side of the pair) AND joins on profiles + events to surface the
 *    peer name/avatar + event title for the card. RLS scopes the read
 *    to participants only.
 * 3. Realtime subscribes to INSERTs filtered to the current user (we
 *    listen on both `user_a=uid` and `user_b=uid`). On a new row the
 *    hook merges it into the local cache and refetches the joined
 *    profile/event payload so the card has everything it needs.
 * 4. `dismiss(id)` writes `dismissed_at` + `dismissed_by` for either
 *    side. The trigger guard backs us up: only the caller can be the
 *    dismisser, and only the dismissal columns can move.
 * 5. `accept(id)` POSTs to `/api/plans` (existing route via supabase
 *    insert into flash_plans pattern — see usePlans.createPlan) with
 *    the event details prefilled, then writes `accepted_plan_id` on
 *    the suggestion. Both fields are mutated in one round-trip — if
 *    the plan creation fails the suggestion is left untouched.
 *
 * Filtering
 * ─────────
 * - Drops dismissed rows (dismissed_at NOT NULL).
 * - Drops accepted rows (accepted_plan_id NOT NULL).
 * - Drops rows whose event has STARTED more than 48h ago
 *   (auto-expiry; the trigger doesn't sweep, the hook just hides).
 *
 * Surface
 * ───────
 * Returns `{ suggestions, loading, error, dismiss, accept, refresh }`.
 * Consumers (Feed page) render the first active suggestion at the top.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  namespacedChannelName,
  useRealtimeChannel,
} from "@/lib/hooks/useSupabaseQuery";
import { logger } from "@/lib/logger";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PlanSuggestionEvent {
  id: string;
  title: string;
  startsAt: string;
  venueName: string;
  flyerUrl: string | null;
}

export interface PlanSuggestionPeer {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PlanSuggestion {
  /** Row id — used as the stable key + URL param when accepting. */
  id: string;
  /** Lower-uuid side of the pair. */
  userA: string;
  /** Higher-uuid side of the pair. */
  userB: string;
  /** When the trigger fired. */
  suggestedAt: string;
  /** True if the caller is `user_a` (lower uuid). */
  isUserA: boolean;
  /** The other user (joined). */
  peer: PlanSuggestionPeer;
  /** The event the trigger fired on (joined). */
  event: PlanSuggestionEvent;
}

interface UsePlanSuggestionsResult {
  suggestions: PlanSuggestion[];
  loading: boolean;
  error: string | null;
  dismiss: (id: string) => Promise<void>;
  accept: (id: string) => Promise<{ planId: string | null; error: string | null }>;
  refresh: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Internal row shapes (what the joined query returns)
// ─────────────────────────────────────────────────────────────

interface SuggestionRow {
  id: string;
  event_id: string;
  user_a: string;
  user_b: string;
  suggested_at: string;
  dismissed_at: string | null;
  accepted_plan_id: string | null;
}

interface ProfileRow {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface EventRow {
  id: string;
  title: string;
  starts_at: string;
  venue_name: string;
  flyer_url: string | null;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** A suggestion is hidden 48h after the event has started. */
const EXPIRY_AFTER_EVENT_START_MS = 48 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function isExpired(eventStartIso: string): boolean {
  const start = new Date(eventStartIso).getTime();
  if (Number.isNaN(start)) return false;
  return Date.now() - start > EXPIRY_AFTER_EVENT_START_MS;
}

function rowsToSuggestions(
  rows: SuggestionRow[],
  callerId: string,
  profiles: Map<string, ProfileRow>,
  events: Map<string, EventRow>,
): PlanSuggestion[] {
  const out: PlanSuggestion[] = [];
  for (const row of rows) {
    // Filter dismissed / accepted defensively (RLS lets the caller
    // see their own dismissed rows too).
    if (row.dismissed_at) continue;
    if (row.accepted_plan_id) continue;

    const ev = events.get(row.event_id);
    if (!ev) continue;
    if (isExpired(ev.starts_at)) continue;

    const isUserA = row.user_a === callerId;
    const peerId = isUserA ? row.user_b : row.user_a;
    const peer = profiles.get(peerId);
    if (!peer) continue;

    out.push({
      id: row.id,
      userA: row.user_a,
      userB: row.user_b,
      suggestedAt: row.suggested_at,
      isUserA,
      peer: {
        id: peer.id,
        name: peer.name ?? "?",
        avatarUrl: peer.avatar_url,
      },
      event: {
        id: ev.id,
        title: ev.title,
        startsAt: ev.starts_at,
        venueName: ev.venue_name,
        flyerUrl: ev.flyer_url,
      },
    });
  }
  // Newest first.
  return out.sort(
    (a, b) =>
      new Date(b.suggestedAt).getTime() - new Date(a.suggestedAt).getTime(),
  );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function usePlanSuggestions(): UsePlanSuggestionsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [rawRows, setRawRows] = useState<SuggestionRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(
    () => new Map(),
  );
  const [events, setEvents] = useState<Map<string, EventRow>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the caller id so realtime callbacks always see the
  // latest value without forcing a resubscribe on auth refresh.
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  // ----------------------------------------------------------------
  // Hydrate joined profile + event rows for a given suggestion set.
  // ----------------------------------------------------------------
  const hydrateJoins = useCallback(
    async (rows: SuggestionRow[], callerId: string) => {
      if (rows.length === 0) {
        setProfiles(new Map());
        setEvents(new Map());
        return;
      }

      const peerIds = Array.from(
        new Set(
          rows.map((r) => (r.user_a === callerId ? r.user_b : r.user_a)),
        ),
      );
      const eventIds = Array.from(new Set(rows.map((r) => r.event_id)));

      const [{ data: profileRows }, { data: eventRows }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", peerIds),
        supabase
          .from("events")
          .select("id, title, starts_at, venue_name, flyer_url")
          .in("id", eventIds),
      ]);

      setProfiles(
        new Map(
          ((profileRows ?? []) as ProfileRow[]).map((p) => [p.id, p]),
        ),
      );
      setEvents(
        new Map(((eventRows ?? []) as EventRow[]).map((e) => [e.id, e])),
      );
    },
    [],
  );

  // ----------------------------------------------------------------
  // Initial fetch + manual refresh
  // ----------------------------------------------------------------
  const fetchAll = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) {
      setRawRows([]);
      setProfiles(new Map());
      setEvents(new Map());
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // RLS scopes us to rows where caller is user_a OR user_b. We
      // still pass the OR filter explicitly so PostgREST can use the
      // partial indexes (idx_plan_suggestions_user_a / _user_b).
      const { data, error: fetchErr } = await supabase
        .from("plan_suggestions")
        .select("*")
        .or(`user_a.eq.${uid},user_b.eq.${uid}`)
        .is("dismissed_at", null)
        .is("accepted_plan_id", null)
        .order("suggested_at", { ascending: false })
        .limit(20);

      if (fetchErr) {
        setError(fetchErr.message);
        logger.error("plan_suggestions_fetch_failed", {
          err: fetchErr.message,
        });
        return;
      }

      const rows = (data ?? []) as SuggestionRow[];
      setRawRows(rows);
      await hydrateJoins(rows, uid);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Plan suggestions fetch error";
      setError(message);
      logger.error("plan_suggestions_fetch_failed", { err: String(err) });
    } finally {
      setLoading(false);
    }
  }, [hydrateJoins]);

  useEffect(() => {
    if (!userId) {
      setRawRows([]);
      setProfiles(new Map());
      setEvents(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchAll();
  }, [userId, fetchAll]);

  // ----------------------------------------------------------------
  // Realtime subscription — INSERTs scoped to either side of the pair
  // ----------------------------------------------------------------
  // Postgres changes filters can only target ONE column at a time,
  // so we open two channels (user_a=uid + user_b=uid) and merge.
  useRealtimeChannel(
    (client) =>
      userId
        ? client
            .channel(namespacedChannelName("plan-suggestions-a", userId))
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "plan_suggestions",
                filter: `user_a=eq.${userId}`,
              },
              async () => {
                // Re-fetch — joins are needed and the row count is small.
                await fetchAll();
              },
            )
        : null,
    [userId, fetchAll],
  );

  useRealtimeChannel(
    (client) =>
      userId
        ? client
            .channel(namespacedChannelName("plan-suggestions-b", userId))
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "plan_suggestions",
                filter: `user_b=eq.${userId}`,
              },
              async () => {
                await fetchAll();
              },
            )
        : null,
    [userId, fetchAll],
  );

  // ----------------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------------

  /** Dismiss a suggestion — writes dismissed_by + dismissed_at. */
  const dismiss = useCallback(
    async (id: string) => {
      const uid = userIdRef.current;
      if (!uid) return;

      // Optimistic remove from local cache.
      setRawRows((prev) => prev.filter((r) => r.id !== id));

      const { error: updErr } = await supabase
        .from("plan_suggestions")
        .update({
          dismissed_by: uid,
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updErr) {
        logger.error("plan_suggestions_dismiss_failed", {
          id,
          err: updErr.message,
        });
        // Re-fetch to roll back the optimistic update.
        await fetchAll();
        setError(updErr.message);
      }
    },
    [fetchAll],
  );

  /**
   * Accept a suggestion — creates a flash_plan around the event and
   * stamps `accepted_plan_id` on the suggestion. Returns the new plan
   * id so the caller can navigate to it.
   *
   * Mirrors `usePlans.createPlan` but adds the event link via the
   * `event:<uuid>` tag (so `has_pair_event_plan` finds it next time).
   */
  const accept = useCallback(
    async (
      id: string,
    ): Promise<{ planId: string | null; error: string | null }> => {
      const uid = userIdRef.current;
      if (!uid) return { planId: null, error: "not_authenticated" };

      const suggestion = rawRows.find((r) => r.id === id);
      const eventRow = suggestion ? events.get(suggestion.event_id) : undefined;

      if (!suggestion || !eventRow) {
        return { planId: null, error: "suggestion_not_found" };
      }

      const peerId =
        suggestion.user_a === uid ? suggestion.user_b : suggestion.user_a;

      // Default plan: starts at the event time, deadline at the event
      // time too (flash plans use deadline as the "RSVP cut-off"). The
      // creator is the caller; the peer is added as a candidate so they
      // see the plan immediately and can accept.
      const whenIso = eventRow.starts_at;
      const deadlineIso = eventRow.starts_at;

      const { data: inserted, error: planErr } = await supabase
        .from("flash_plans")
        .insert({
          creator_id: uid,
          type: "match",
          title: `On y va ensemble — ${eventRow.title}`,
          what: `RSVP commun à ${eventRow.title}`,
          where_text: eventRow.venue_name,
          venue: eventRow.venue_name,
          when_at: whenIso,
          deadline: deadlineIso,
          max_participants: 2,
          mode: null,
          status: "open",
          tags: [`event:${eventRow.id}`],
          description: `Plan généré automatiquement après que vous avez tous les deux RSVP "${eventRow.title}".`,
        })
        .select("id")
        .single();

      if (planErr || !inserted?.id) {
        const msg = planErr?.message ?? "plan_create_failed";
        logger.error("plan_suggestions_accept_failed", {
          id,
          err: msg,
        });
        return { planId: null, error: msg };
      }

      // Add the creator as accepted, the peer as candidate.
      const { error: partErr } = await supabase
        .from("flash_plan_participants")
        .insert([
          {
            flash_plan_id: inserted.id,
            user_id: uid,
            status: "accepted",
          },
          {
            flash_plan_id: inserted.id,
            user_id: peerId,
            status: "candidate",
          },
        ]);

      if (partErr) {
        logger.error("plan_suggestions_accept_participants_failed", {
          id,
          err: partErr.message,
        });
        // Don't unwind — the plan still exists, the creator can re-add
        // the peer manually. Surface the error to the caller though.
      }

      // Stamp the suggestion as accepted.
      const { error: updErr } = await supabase
        .from("plan_suggestions")
        .update({ accepted_plan_id: inserted.id })
        .eq("id", id);

      if (updErr) {
        // Suggestion not flagged accepted but the plan exists — don't
        // surface as a hard error to the user, the visible feed will
        // re-derive on next refresh anyway. Log + continue.
        logger.warn("plan_suggestions_stamp_accept_failed", {
          id,
          plan_id: inserted.id,
          err: updErr.message,
        });
      }

      // Optimistic remove from local cache.
      setRawRows((prev) => prev.filter((r) => r.id !== id));

      return { planId: inserted.id, error: null };
    },
    [rawRows, events],
  );

  // ----------------------------------------------------------------
  // Derived suggestions list (joined + filtered)
  // ----------------------------------------------------------------
  const suggestions = useMemo(() => {
    if (!userId) return [];
    return rowsToSuggestions(rawRows, userId, profiles, events);
  }, [rawRows, userId, profiles, events]);

  return {
    suggestions,
    loading,
    error,
    dismiss,
    accept,
    refresh: fetchAll,
  };
}

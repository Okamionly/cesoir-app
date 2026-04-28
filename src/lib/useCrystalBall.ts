"use client";

/**
 * useCrystalBall — React hook for the daily blind match (Wave 17).
 *
 * Surface
 * ───────
 * - Fetches the caller's Crystal Ball row for today via the
 *   `get_my_crystal_ball(target_day)` RPC. Returns the peer profile
 *   snapshot (name/age/avatar/bio) which the UI keeps blurred + name
 *   hidden until `revealedAt` is non-null.
 * - `like()` flips the caller's own bool flag (a_liked or b_liked
 *   depending on which side of the pair they are). The DB trigger
 *   stamps `revealed_at` automatically the first time both sides are
 *   true within the 24h window.
 * - `pass()` doesn't write anything (matches the IRLConfirm "no
 *   penalty" pattern). The 24h auto-expiry handles the abandon case.
 * - `available` is the smart "should the badge ping?" boolean used
 *   by the BottomNav: there is a row for today AND I haven't
 *   decided AND the window is still open.
 *
 * The hook is used by:
 *   * `/crystal` page — full reveal card
 *   * `BottomNav` — sparkle badge ping
 *
 * Realtime is intentionally NOT subscribed here: the reveal moment
 * is dramatic enough that the card itself re-fetches when the user
 * taps "Je tente". A hard refresh after a like is the cleanest UX
 * (the cinematic reveal is gated by `revealed_at` which only flips
 * after BOTH sides post a like — the second liker's tap already
 * re-fetches via `like()`).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface CrystalBallMatch {
  /** Row id (used as a stable key for animations) */
  id: string;
  /** Local day the row belongs to (YYYY-MM-DD) */
  day: string;
  /** True if the caller is `user_a` (lower uuid) — drives like-flag plumbing */
  isUserA: boolean;
  /** Has the caller liked yet? */
  iLiked: boolean;
  /** Has the peer liked yet? */
  peerLiked: boolean;
  /** Set the moment both sides flip to true within window */
  revealedAt: string | null;
  /** Local day + 24h — after this the row is considered passed both sides */
  expiresAt: string;
  /** Peer profile snapshot — kept blurred until revealedAt is set */
  peer: {
    id: string;
    name: string;
    age: number;
    avatarUrl: string | null;
    bio: string;
  };
}

interface UseCrystalBallResult {
  /** Today's match — null if none generated for the user yet */
  match: CrystalBallMatch | null;
  /** True while the initial fetch is in flight */
  loading: boolean;
  /** Most recent error from a fetch / mutation */
  error: string | null;
  /** True iff there is a today's match the user has not decided on yet */
  available: boolean;
  /** True iff the window has elapsed (or revealed_at non-null) */
  resolved: boolean;
  /** "Je tente" — flip the caller's like flag, refetches the row */
  like: () => Promise<void>;
  /** "Pas pour moi" — local dismiss, no DB write (24h auto-pass handles it) */
  pass: () => void;
  /** Manual refetch — used after the like() call to surface revealed state */
  refresh: () => Promise<void>;
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/** Today as YYYY-MM-DD in the browser's local timezone. */
function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface CrystalBallRpcRow {
  id: string;
  day: string;
  is_user_a: boolean;
  i_liked: boolean;
  peer_liked: boolean;
  revealed_at: string | null;
  expires_at: string;
  peer_id: string;
  peer_name: string;
  peer_age: number;
  peer_avatar_url: string | null;
  peer_bio: string | null;
}

function rowToMatch(row: CrystalBallRpcRow): CrystalBallMatch {
  return {
    id: row.id,
    day: row.day,
    isUserA: row.is_user_a,
    iLiked: row.i_liked,
    peerLiked: row.peer_liked,
    revealedAt: row.revealed_at,
    expiresAt: row.expires_at,
    peer: {
      id: row.peer_id,
      name: row.peer_name,
      age: row.peer_age,
      avatarUrl: row.peer_avatar_url,
      bio: row.peer_bio ?? "",
    },
  };
}

// ────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────

export function useCrystalBall(): UseCrystalBallResult {
  const { user } = useAuth();

  const [match, setMatch] = useState<CrystalBallMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Local-only "I dismissed it this session" flag — does NOT persist */
  const [locallyPassed, setLocallyPassed] = useState(false);

  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  // ----------------------------------------------------------------
  // Fetch today's match
  // ----------------------------------------------------------------
  const fetchMatch = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) {
      setMatch(null);
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const { data, error: rpcErr } = await supabase
        .rpc("get_my_crystal_ball", { target_day: todayLocal() });

      if (rpcErr) {
        setError(rpcErr.message);
        logger.error("crystal_ball_fetch_failed", { err: rpcErr.message });
        setMatch(null);
        return;
      }

      const rows = (data ?? []) as CrystalBallRpcRow[];
      if (rows.length === 0) {
        setMatch(null);
        return;
      }

      setMatch(rowToMatch(rows[0]));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crystal Ball fetch error";
      setError(message);
      logger.error("crystal_ball_fetch_failed", { err: String(err) });
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount + on auth change.
  useEffect(() => {
    if (!user?.id) {
      setMatch(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchMatch();
  }, [user?.id, fetchMatch]);

  // ----------------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------------

  /**
   * "Je tente" — flip the caller's like flag.
   *
   * The DB trigger `crystal_ball_guard_update_trg` will:
   *   * reject any attempt to flip the *other* side's flag
   *   * stamp revealed_at if both sides are now true and we're in window
   *
   * After the update we refetch — that surfaces the new revealed_at to
   * the UI which then plays the cinematic reveal animation.
   */
  const like = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid || !match) return;

    setError(null);

    try {
      const update = match.isUserA ? { a_liked: true } : { b_liked: true };

      const { error: updErr } = await supabase
        .from("crystal_ball_matches")
        .update(update)
        .eq("id", match.id);

      if (updErr) {
        setError(updErr.message);
        logger.error("crystal_ball_like_failed", { err: updErr.message });
        return;
      }

      // Re-fetch to pull revealed_at + the peer's flag (which may have
      // landed in parallel if the peer also just liked).
      await fetchMatch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crystal Ball like error";
      setError(message);
      logger.error("crystal_ball_like_failed", { err: String(err) });
    }
  }, [match, fetchMatch]);

  /**
   * "Pas pour moi" — local-only dismiss, no DB write. The 24h auto-pass
   * (default FALSE on like flag + expires_at) handles abandon. This
   * matches the privacy-first pattern from IRLConfirm.
   */
  const pass = useCallback(() => {
    setLocallyPassed(true);
  }, []);

  // ----------------------------------------------------------------
  // Derived state
  // ----------------------------------------------------------------

  const now = Date.now();
  const expired =
    match !== null && new Date(match.expiresAt).getTime() <= now;

  const resolved =
    match === null
      || expired
      || match.revealedAt !== null
      || locallyPassed;

  /** Badge ping logic for BottomNav */
  const available = match !== null
    && !match.iLiked
    && !expired
    && !locallyPassed;

  return {
    match,
    loading,
    error,
    available,
    resolved,
    like,
    pass,
    refresh: fetchMatch,
  };
}

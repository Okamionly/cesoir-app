"use client";

/**
 * useMoments — React hook for the 24h disappearing photos (Wave 17).
 *
 * Surface
 * ───────
 * - Fetches the caller's moment feed via `GET /api/moments/feed`. Each
 *   row carries a 1h signed URL ready to render. Grouped by user so
 *   the chat page can render one ring per matched user (instead of
 *   one ring per moment) — taps cycle through the user's moments in
 *   the viewer.
 * - `post(blob, caption)` calls `POST /api/moments/post` and returns
 *   the inserted row (also re-fetches the feed so the caller's own
 *   moment surfaces immediately if `includeOwn` is true).
 * - `myMoment` is the caller's currently-active moment (if any) — the
 *   composer UI uses this to show "Tu as déjà publié un moment" and
 *   offer a delete affordance.
 *
 * The hook is used by:
 *   * `/chat` page — rings of matched users + own ring
 *   * `MomentComposer` — post + delete flow
 *   * `MomentViewer` — feed + navigation
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

export interface MomentItem {
  /** Row id */
  id: string;
  /** Owner user id */
  userId: string;
  /** Storage path inside the `moments` bucket */
  mediaPath: string;
  /** 1h signed URL ready for <img> rendering. May be null if signing failed. */
  mediaUrl: string | null;
  /** Optional caption — capped at 50 chars */
  caption: string | null;
  /** ISO timestamp the moment was posted */
  postedAt: string;
  /** ISO timestamp the moment expires (postedAt + 24h) */
  expiresAt: string;
  /** Public profile snapshot of the owner */
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

/**
 * One per matched user — collects every moment they have posted in the
 * last 24h. The chat page renders one ring per group; tapping the ring
 * opens a viewer that auto-advances through `moments`.
 */
export interface MomentGroup {
  userId: string;
  user: MomentItem["user"];
  moments: MomentItem[];
  /** Most recent posted_at across the group — used to sort rings */
  latestPostedAt: string;
}

interface UseMomentsResult {
  /** Feed of moments from matched users, grouped by user */
  groups: MomentGroup[];
  /** The caller's own active moment (or null) */
  myMoment: MomentItem | null;
  /** True while the initial fetch is in flight */
  loading: boolean;
  /** Most recent error from a fetch / mutation */
  error: string | null;
  /** Publish a new moment. Returns the inserted item or null on failure. */
  post: (blob: Blob, caption?: string) => Promise<MomentItem | null>;
  /** Delete the caller's own moment by id. Returns true on success. */
  remove: (momentId: string) => Promise<boolean>;
  /** Manual refresh */
  refresh: () => Promise<void>;
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  userId: string;
  mediaPath: string;
  mediaUrl: string | null;
  caption: string | null;
  postedAt: string;
  expiresAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

/** Group a flat list of moments by `userId`, preserving DESC time order. */
function groupByUser(items: MomentItem[]): MomentGroup[] {
  const map = new Map<string, MomentGroup>();
  for (const m of items) {
    const existing = map.get(m.userId);
    if (existing) {
      existing.moments.push(m);
      if (m.postedAt > existing.latestPostedAt) {
        existing.latestPostedAt = m.postedAt;
      }
    } else {
      map.set(m.userId, {
        userId: m.userId,
        user: m.user,
        moments: [m],
        latestPostedAt: m.postedAt,
      });
    }
  }
  // Newest group first.
  return Array.from(map.values()).sort((a, b) =>
    a.latestPostedAt < b.latestPostedAt ? 1 : -1,
  );
}

/**
 * Fetch the caller's session token. We send it as a Bearer header so
 * the API route can use the unified `requireUser` helper without
 * touching cookies (the chat page is a client component and we'd
 * rather not depend on @supabase/ssr cookie sync there).
 */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────

export function useMoments(): UseMomentsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [feed, setFeed] = useState<MomentItem[]>([]);
  const [myMoment, setMyMoment] = useState<MomentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ────────────────────────────────────────────────────────────────
  // Fetch feed
  // ────────────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async () => {
    if (!userId) {
      setFeed([]);
      setMyMoment(null);
      setLoading(false);
      return;
    }

    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("missing_session");
        setFeed([]);
        setMyMoment(null);
        return;
      }

      // Feed: matched users' moments
      const feedRes = await fetch("/api/moments/feed", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!feedRes.ok) {
        const payload = (await feedRes.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? `feed_status_${feedRes.status}`);
        setFeed([]);
      } else {
        const json = (await feedRes.json()) as { moments: FeedItem[] };
        setFeed(json.moments ?? []);
      }

      // Caller's own active moment — query directly. RLS allows owner
      // to read their own row regardless of expiry; we filter to the
      // unexpired set here so the composer UI accurately reflects
      // "you have an active moment".
      const nowIso = new Date().toISOString();
      const { data: ownRows, error: ownErr } = await supabase
        .from("moments")
        .select("id, user_id, media_path, caption, posted_at, expires_at")
        .eq("user_id", userId)
        .gt("expires_at", nowIso)
        .order("posted_at", { ascending: false })
        .limit(1);

      if (ownErr) {
        logger.warn("use_moments_own_query_failed", { err: ownErr.message });
        setMyMoment(null);
      } else if (!ownRows || ownRows.length === 0) {
        setMyMoment(null);
      } else {
        const row = ownRows[0] as {
          id: string;
          user_id: string;
          media_path: string;
          caption: string | null;
          posted_at: string;
          expires_at: string;
        };
        const { data: signed, error: signErr } = await supabase.storage
          .from("moments")
          .createSignedUrl(row.media_path, 3600);
        if (signErr) {
          logger.warn("use_moments_own_sign_failed", { err: signErr.message });
        }
        // Pull the user's profile snapshot for the ring (consistent
        // with the feed shape).
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        setMyMoment({
          id: row.id,
          userId: row.user_id,
          mediaPath: row.media_path,
          mediaUrl: signed?.signedUrl ?? null,
          caption: row.caption,
          postedAt: row.posted_at,
          expiresAt: row.expires_at,
          user: {
            id: row.user_id,
            name: (profile as { name: string | null } | null)?.name ?? null,
            avatarUrl: (profile as { avatar_url: string | null } | null)
              ?.avatar_url ?? null,
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "moments fetch error";
      setError(message);
      logger.error("use_moments_fetch_failed", { err: String(err) });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch on mount + when auth changes
  useEffect(() => {
    if (!userId) {
      setFeed([]);
      setMyMoment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchFeed();
  }, [userId, fetchFeed]);

  // ────────────────────────────────────────────────────────────────
  // Mutations
  // ────────────────────────────────────────────────────────────────

  const post = useCallback(
    async (blob: Blob, caption?: string): Promise<MomentItem | null> => {
      if (!userId) return null;
      setError(null);

      try {
        const token = await getAccessToken();
        if (!token) {
          setError("missing_session");
          return null;
        }

        const form = new FormData();
        form.append("photo", blob);
        if (caption && caption.trim().length > 0) {
          form.append("caption", caption.trim());
        }

        const res = await fetch("/api/moments/post", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
            message?: string;
          };
          setError(payload.message ?? payload.error ?? `post_status_${res.status}`);
          return null;
        }

        const json = (await res.json()) as { moment: FeedItem };
        const inserted: MomentItem = {
          ...json.moment,
          user: {
            id: json.moment.userId,
            name: user?.user_metadata?.name ?? null,
            avatarUrl: null,
          },
        };

        // Refresh the feed so own-moment ring updates with the proper
        // profile snapshot (matches the feed projection shape).
        void fetchFeed();
        return inserted;
      } catch (err) {
        const message = err instanceof Error ? err.message : "moments post error";
        setError(message);
        logger.error("use_moments_post_failed", { err: String(err) });
        return null;
      }
    },
    [userId, user?.user_metadata?.name, fetchFeed],
  );

  const remove = useCallback(
    async (momentId: string): Promise<boolean> => {
      if (!userId) return false;
      setError(null);

      try {
        // Read the row to learn the storage path BEFORE deleting it
        // (the row is the only place the path lives).
        const { data: existing, error: readErr } = await supabase
          .from("moments")
          .select("media_path")
          .eq("id", momentId)
          .eq("user_id", userId)
          .maybeSingle();

        if (readErr) {
          setError(readErr.message);
          return false;
        }

        const { error: delErr } = await supabase
          .from("moments")
          .delete()
          .eq("id", momentId)
          .eq("user_id", userId);

        if (delErr) {
          setError(delErr.message);
          logger.error("use_moments_delete_failed", { err: delErr.message });
          return false;
        }

        // Best-effort storage cleanup (the row is gone either way).
        const path = (existing as { media_path: string } | null)?.media_path;
        if (path) {
          void supabase.storage
            .from("moments")
            .remove([path])
            .catch(() => {});
        }

        // Optimistic local update
        setMyMoment((prev) => (prev?.id === momentId ? null : prev));
        setFeed((prev) => prev.filter((m) => m.id !== momentId));
        void fetchFeed();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "moments delete error";
        setError(message);
        logger.error("use_moments_delete_failed", { err: String(err) });
        return false;
      }
    },
    [userId, fetchFeed],
  );

  // ────────────────────────────────────────────────────────────────
  // Derived: groups
  // ────────────────────────────────────────────────────────────────
  const groups = useMemo(() => groupByUser(feed), [feed]);

  return {
    groups,
    myMoment,
    loading,
    error,
    post,
    remove,
    refresh: fetchFeed,
  };
}

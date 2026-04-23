/**
 * Supabase query wrapper with standardized state + realtime cleanup helper.
 *
 * Audit ARCH_BACKEND HK-3 : realtime cleanup was inconsistent across hooks
 * (some forgot to set `channelRef.current = null`, leak on remount).
 *
 * `useSupabaseQuery` : runs a builder function against supabase and returns
 * { data, loading, error, refetch }. Safe for strict-mode double-mount.
 *
 * `useRealtimeChannel` : wraps a RealtimeChannel subscription with guaranteed
 * cleanup (unsubscribe + ref reset) on unmount or dep change. Wave 12: adds
 * exponential backoff on CHANNEL_ERROR/TIMED_OUT/CLOSED, immediate reconnect
 * on `window.online`, and per-user channel namespacing helper.
 */
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type {
  PostgrestError,
  RealtimeChannel,
} from "@supabase/supabase-js";

export interface SupabaseQueryState<T> {
  data: T | null;
  loading: boolean;
  error: PostgrestError | Error | null;
  refetch: () => Promise<void>;
}

export type SupabaseQueryBuilder<T> = (
  client: typeof supabase,
) => PromiseLike<{ data: T | null; error: PostgrestError | null }>;

export function useSupabaseQuery<T>(
  builder: SupabaseQueryBuilder<T>,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): SupabaseQueryState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const cancelledRef = useRef(false);
  const builderRef = useRef(builder);
  useEffect(() => {
    builderRef.current = builder;
  }, [builder]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: qErr } = await builderRef.current(supabase);
      if (cancelledRef.current) return;
      if (qErr) {
        setError(qErr);
      } else {
        setData(result);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled) {
      setLoading(false);
      return;
    }
    run();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { data, loading, error, refetch: run };
}

/**
 * Namespaces a realtime channel name with the current user id.
 *
 * Supabase caches channels internally by topic string — if two components
 * (or a component + its StrictMode double-mount) ask for the same topic
 * while the previous instance is still in `joining` / `joined` state,
 * supabase-js hands back the cached instance. Any `.on()` call on a
 * subscribed channel then throws:
 *   "cannot add postgres_changes callbacks … after subscribe()"
 *
 * Wave 14 patch: `namespacedChannelName(base, userId)` now also mixes in a
 * caller-supplied instance nonce (typically `useId()` or a stable uuid
 * ref) so each mount gets a globally unique channel name. `nonce` is
 * optional to preserve Wave 12 call sites; when omitted we fall back to
 * `Math.random()` on first call for non-React callers (tests, utilities).
 *
 * Falls back to `"anon"` for unauthenticated visitors. Consumers should
 * still gate subscriptions on `userId` (return `null` from the factory)
 * to avoid opening WebSockets with the anon key before AuthContext has
 * pushed the user's JWT into `supabase.realtime.setAuth()`.
 */
export function namespacedChannelName(
  base: string,
  userId: string | null | undefined,
  nonce?: string,
): string {
  const n = nonce ?? Math.random().toString(36).slice(2, 10);
  return `${base}:${userId ?? "anon"}:${n}`;
}

/**
 * Subscribe to a Supabase realtime channel with guaranteed cleanup and
 * auto-reconnect.
 *
 * `factory` receives the supabase client and must return an unsubscribed
 * RealtimeChannel (or null to skip). The hook calls `.subscribe()` with a
 * status callback that retries on CHANNEL_ERROR/TIMED_OUT/CLOSED with
 * exponential backoff (1s → 30s cap). Reconnect is forced immediately when
 * the browser fires `window.online`.
 *
 * Consumer factories may still attach their own `.subscribe()` callback
 * (e.g. for presence tracking). supabase-js dedupes subscribe calls when
 * the channel is already joining/joined, so the inner user-callback +
 * our retry wrapper coexist safely.
 *
 * Returns `{ channelRef }` — a stable React ref pointing to the active
 * channel (or `null` when unsubscribed/pending). Consumers that need to
 * `.send()` broadcast events or track presence state can read the ref
 * inside callbacks without re-subscribing.
 */
export interface RealtimeChannelHandle {
  channelRef: RefObject<RealtimeChannel | null>;
}

export interface UseRealtimeChannelOptions {
  enabled?: boolean;
  /** Initial retry delay, doubles each failure. Defaults to 1000ms. */
  initialBackoffMs?: number;
  /** Ceiling for exponential backoff. Defaults to 30000ms. */
  maxBackoffMs?: number;
  /** Called for each non-success status — useful for telemetry. */
  onStatus?: (
    status:
      | "SUBSCRIBED"
      | "CHANNEL_ERROR"
      | "TIMED_OUT"
      | "CLOSED",
    err?: Error,
  ) => void;
}

export function useRealtimeChannel(
  factory: (client: typeof supabase) => RealtimeChannel | null,
  deps: readonly unknown[],
  options: UseRealtimeChannelOptions = {},
): RealtimeChannelHandle {
  const {
    enabled = true,
    initialBackoffMs = 1000,
    maxBackoffMs = 30_000,
    onStatus,
  } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const factoryRef = useRef(factory);
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    factoryRef.current = factory;
  }, [factory]);
  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = initialBackoffMs;
    let currentChannel: RealtimeChannel | null = null;

    const cleanupChannel = (ch: RealtimeChannel | null) => {
      if (!ch) return;
      try {
        ch.unsubscribe();
      } catch {
        // ignore double-unsubscribe
      }
      try {
        supabase.removeChannel(ch);
      } catch {
        // ignore removeChannel errors (channel may already be gone)
      }
    };

    const connect = () => {
      if (cancelled) return;
      const built = factoryRef.current(supabase);
      if (!built) {
        channelRef.current = null;
        return;
      }
      currentChannel = built;
      channelRef.current = built;

      // We wrap .subscribe() so we own the status callback. If the factory
      // also called .subscribe() internally (rare — only presence tracking
      // does this), supabase-js treats the second call as a no-op when the
      // channel is already joining/joined.
      built.subscribe((status, err) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          backoffMs = initialBackoffMs; // reset on healthy connect
          onStatusRef.current?.(status);
          return;
        }
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          const asError =
            err instanceof Error
              ? err
              : new Error(`realtime channel status=${status}`);
          onStatusRef.current?.(status, asError);
          // Only log genuine failures, not the expected CLOSED on cleanup.
          logger.warn("realtime_channel_retry", {
            backoffMs,
            status,
            err: asError.message,
          });
          // Tear down the dead channel, then schedule a retry.
          const dead = currentChannel;
          currentChannel = null;
          channelRef.current = null;
          cleanupChannel(dead);
          if (cancelled) return;
          retryTimer = setTimeout(() => {
            retryTimer = null;
            backoffMs = Math.min(maxBackoffMs, backoffMs * 2);
            connect();
          }, backoffMs);
        }
      });
    };

    const forceReconnect = () => {
      if (cancelled) return;
      // Network came back — cancel any pending backoff and retry immediately.
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      backoffMs = initialBackoffMs;
      const dead = currentChannel;
      currentChannel = null;
      channelRef.current = null;
      cleanupChannel(dead);
      connect();
    };

    connect();

    if (typeof window !== "undefined") {
      window.addEventListener("online", forceReconnect);
    }

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("online", forceReconnect);
      }
      const toClean = currentChannel;
      currentChannel = null;
      channelRef.current = null;
      cleanupChannel(toClean);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initialBackoffMs, maxBackoffMs, ...deps]);

  return { channelRef };
}

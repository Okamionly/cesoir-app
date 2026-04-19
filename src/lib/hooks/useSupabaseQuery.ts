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
 * cleanup (unsubscribe + ref reset) on unmount or dep change.
 */
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
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
 * Subscribe to a Supabase realtime channel with guaranteed cleanup.
 *
 * `factory` receives the supabase client and must return an unsubscribed
 * RealtimeChannel. The hook calls `.subscribe()` and handles cleanup:
 * channel.unsubscribe() + ref nulled on unmount/dep-change.
 *
 * Returns `{ channelRef }` — a stable React ref pointing to the active
 * channel (or `null` when unsubscribed/pending). Consumers that need to
 * `.send()` broadcast events or track presence state can read the ref
 * inside callbacks without re-subscribing.
 *
 * Note: the legacy signature returned the ref directly. Existing callers
 * that ignored the return value remain compatible.
 */
export interface RealtimeChannelHandle {
  channelRef: RefObject<RealtimeChannel | null>;
}

export function useRealtimeChannel(
  factory: (client: typeof supabase) => RealtimeChannel | null,
  deps: readonly unknown[],
  options: { enabled?: boolean } = {},
): RealtimeChannelHandle {
  const { enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const factoryRef = useRef(factory);
  useEffect(() => {
    factoryRef.current = factory;
  }, [factory]);

  useEffect(() => {
    if (!enabled) return;
    const channel = factoryRef.current(supabase);
    if (!channel) return;
    channelRef.current = channel;
    channel.subscribe();
    return () => {
      try {
        channel.unsubscribe();
      } catch {
        // ignore double-unsubscribe
      }
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { channelRef };
}

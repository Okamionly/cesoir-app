/**
 * Unified async state hook.
 *
 * Audit ARCH_BACKEND HK-1/HK-4 : loading/error/data shape was divergent across
 * hooks (some had `error`, some didn't, some had 8 states). This hook provides
 * the canonical shape:
 *
 *   { data, loading, error, refetch }
 *
 * with built-in AbortSignal handling for race-condition-free updates.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAsyncResource(
 *     async (signal) => {
 *       const res = await fetch('/api/foo', { signal });
 *       return res.json();
 *     },
 *     [userId],
 *   );
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export type AsyncResourceFetcher<T> = (signal: AbortSignal) => Promise<T>;

export interface AsyncResourceOptions {
  /** Skip the initial fetch (useful for lazy queries). */
  enabled?: boolean;
  /** Poll interval in ms. 0 disables polling. */
  pollIntervalMs?: number;
}

export function useAsyncResource<T>(
  fetcher: AsyncResourceFetcher<T>,
  deps: readonly unknown[],
  options: AsyncResourceOptions = {},
): AsyncResourceState<T> {
  const { enabled = true, pollIntervalMs = 0 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const run = useCallback(async () => {
    // Abort previous request if still pending
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(controller.signal);
      if (!controller.signal.aborted && mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!controller.signal.aborted && mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return;
    }
    run();

    let poll: ReturnType<typeof setInterval> | undefined;
    if (pollIntervalMs > 0) {
      poll = setInterval(run, pollIntervalMs);
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (poll) clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollIntervalMs, ...deps]);

  return { data, loading, error, refetch: run };
}

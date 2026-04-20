import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

/**
 * Both hooks use the singleton `supabase` from `@/lib/supabase`. We mock it
 * with a builder/channel surface controllable per-test.
 */
const { mockChannelInstance, mockChannelFactory } = vi.hoisted(() => {
  const mockChannelInstance = {
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };
  const mockChannelFactory = vi.fn(() => mockChannelInstance);
  return { mockChannelInstance, mockChannelFactory };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: mockChannelFactory,
    from: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import { useSupabaseQuery, useRealtimeChannel } from "./useSupabaseQuery";

beforeEach(() => {
  mockChannelInstance.subscribe.mockClear();
  mockChannelInstance.unsubscribe.mockClear();
  mockChannelFactory.mockClear();
});

describe("useSupabaseQuery", () => {
  it("transitions loading -> data when builder resolves", async () => {
    const builder = vi.fn(async () => ({ data: { foo: 1 }, error: null }));
    const { result } = renderHook(() => useSupabaseQuery(builder, []));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ foo: 1 });
    expect(result.current.error).toBeNull();
    expect(builder).toHaveBeenCalledTimes(1);
  });

  it("captures Postgrest-style errors into `error` field", async () => {
    const builder = vi.fn(async () => ({
      data: null,
      error: { message: "row not found", code: "PGRST116" } as never,
    }));
    const { result } = renderHook(() => useSupabaseQuery(builder, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("captures thrown exceptions into `error` field", async () => {
    const builder = vi.fn(async () => {
      throw new Error("network down");
    });
    const { result } = renderHook(() => useSupabaseQuery(builder, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("network down");
  });

  it("skips fetch when enabled=false", async () => {
    const builder = vi.fn(async () => ({ data: "x", error: null }));
    const { result } = renderHook(() =>
      useSupabaseQuery(builder, [], { enabled: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(builder).not.toHaveBeenCalled();
  });

  it("refetch re-runs the builder", async () => {
    let n = 0;
    const builder = vi.fn(async () => ({ data: ++n, error: null }));
    const { result } = renderHook(() => useSupabaseQuery(builder, []));

    await waitFor(() => expect(result.current.data).toBe(1));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.data).toBe(2);
    expect(builder).toHaveBeenCalledTimes(2);
  });

  it("does not write state after unmount", async () => {
    const builder = vi.fn(
      () =>
        new Promise<{ data: string; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: "late", error: null }), 30),
        ),
    );
    const { result, unmount } = renderHook(() => useSupabaseQuery(builder, []));
    unmount();
    await new Promise((r) => setTimeout(r, 60));
    // Hook is unmounted — last value should remain initial null.
    expect(result.current.data).toBeNull();
  });
});

describe("useRealtimeChannel", () => {
  it("creates and subscribes to a channel on mount", () => {
    const factory = vi.fn(() => mockChannelInstance as unknown as ReturnType<
      Parameters<typeof useRealtimeChannel>[0]
    >);
    const { result } = renderHook(() => useRealtimeChannel(factory, ["dep1"]));

    expect(factory).toHaveBeenCalledTimes(1);
    expect(mockChannelInstance.subscribe).toHaveBeenCalledTimes(1);
    expect(result.current.channelRef.current).toBe(mockChannelInstance);
  });

  it("unsubscribes and nulls the ref on unmount", () => {
    const factory = vi.fn(() => mockChannelInstance as unknown as ReturnType<
      Parameters<typeof useRealtimeChannel>[0]
    >);
    const { result, unmount } = renderHook(() =>
      useRealtimeChannel(factory, ["dep1"]),
    );
    unmount();
    expect(mockChannelInstance.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result.current.channelRef.current).toBeNull();
  });

  it("re-subscribes when deps change", () => {
    const factory = vi.fn(() => mockChannelInstance as unknown as ReturnType<
      Parameters<typeof useRealtimeChannel>[0]
    >);
    const { rerender } = renderHook(
      ({ dep }: { dep: number }) => useRealtimeChannel(factory, [dep]),
      { initialProps: { dep: 1 } },
    );

    expect(mockChannelInstance.subscribe).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 });
    expect(mockChannelInstance.unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockChannelInstance.subscribe).toHaveBeenCalledTimes(2);
  });

  it("skips when factory returns null", () => {
    const factory = vi.fn(() => null);
    const { result } = renderHook(() => useRealtimeChannel(factory, []));

    expect(mockChannelInstance.subscribe).not.toHaveBeenCalled();
    expect(result.current.channelRef.current).toBeNull();
  });

  it("skips entirely when enabled=false", () => {
    const factory = vi.fn(() => mockChannelInstance as unknown as ReturnType<
      Parameters<typeof useRealtimeChannel>[0]
    >);
    renderHook(() => useRealtimeChannel(factory, [], { enabled: false }));

    expect(factory).not.toHaveBeenCalled();
    expect(mockChannelInstance.subscribe).not.toHaveBeenCalled();
  });

  it("swallows double-unsubscribe errors", () => {
    mockChannelInstance.unsubscribe.mockImplementationOnce(() => {
      throw new Error("already closed");
    });
    const factory = vi.fn(() => mockChannelInstance as unknown as ReturnType<
      Parameters<typeof useRealtimeChannel>[0]
    >);
    const { unmount } = renderHook(() => useRealtimeChannel(factory, []));
    expect(() => unmount()).not.toThrow();
  });
});

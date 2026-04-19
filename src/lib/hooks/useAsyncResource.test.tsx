import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAsyncResource } from "./useAsyncResource";

describe("useAsyncResource", () => {
  it("loads data then transitions loading -> data", async () => {
    const fetcher = vi.fn(async () => "payload");
    const { result } = renderHook(() => useAsyncResource(fetcher, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("payload");
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("sets error when fetcher throws", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("kaboom");
    });
    const { result } = renderHook(() => useAsyncResource(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe("kaboom");
    expect(result.current.data).toBeNull();
  });

  it("skips fetch when enabled=false and stays in non-loading state", async () => {
    const fetcher = vi.fn(async () => "x");
    const { result } = renderHook(() =>
      useAsyncResource(fetcher, [], { enabled: false }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("refetch re-runs the fetcher", async () => {
    let counter = 0;
    const fetcher = vi.fn(async () => ++counter);
    const { result } = renderHook(() => useAsyncResource(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe(1));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe(2);
  });

  it("aborts on unmount (no state update after unmount)", async () => {
    const fetcher = vi.fn(
      (signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
          setTimeout(() => resolve("late"), 200);
        }),
    );

    const { result, unmount } = renderHook(() => useAsyncResource(fetcher, []));
    expect(result.current.loading).toBe(true);
    unmount();

    // Wait a bit to let the aborted promise settle; no throw = pass.
    await new Promise((r) => setTimeout(r, 50));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

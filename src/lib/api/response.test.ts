import { describe, it, expect, vi } from "vitest";

/**
 * `next/server` `NextResponse` is a thin wrapper around the WHATWG `Response`.
 * In jsdom we provide a minimal mock that returns a real `Response` so we can
 * assert on `.status`, `.headers` and the JSON body.
 */
vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: (
        body: unknown,
        init?: { status?: number; headers?: HeadersInit },
      ) => {
        const headers = new Headers(init?.headers);
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json");
        }
        return new Response(JSON.stringify(body), {
          status: init?.status ?? 200,
          headers,
        });
      },
    },
  };
});

import { apiError, apiOk, apiRaw } from "./response";

describe("apiError", () => {
  it("returns 500 by default with `error` field", async () => {
    const res = apiError("boom");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "boom" });
  });

  it("accepts a custom status code", () => {
    const res = apiError("nope", 404);
    expect(res.status).toBe(404);
  });

  it("includes optional `code` field when supplied", async () => {
    const res = apiError("not_found", 404, { code: "missing" });
    const body = await res.json();
    expect(body).toEqual({ error: "not_found", code: "missing" });
  });

  it("includes `details` only when defined (not for `undefined`)", async () => {
    const res = apiError("oops", 400, { details: { field: "name" } });
    const body = await res.json();
    expect(body.details).toEqual({ field: "name" });

    const res2 = apiError("oops", 400, { details: undefined });
    const body2 = await res2.json();
    expect("details" in body2).toBe(false);
  });

  it("forwards custom headers", () => {
    const res = apiError("rate_limited", 429, {
      headers: { "Retry-After": "30" },
    });
    expect(res.headers.get("Retry-After")).toBe("30");
  });
});

describe("apiOk", () => {
  it("wraps payload as { ok: true, data } with 200 default", async () => {
    const res = apiOk({ id: "u1", name: "Test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { id: "u1", name: "Test" } });
  });

  it("respects a custom status (e.g. 201 created)", () => {
    const res = apiOk({ id: 1 }, { status: 201 });
    expect(res.status).toBe(201);
  });

  it("forwards headers", () => {
    const res = apiOk(null, { headers: { "X-Custom": "yes" } });
    expect(res.headers.get("X-Custom")).toBe("yes");
  });
});

describe("apiRaw", () => {
  it("returns payload as-is (no envelope) for legacy clients", async () => {
    const res = apiRaw([1, 2, 3]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([1, 2, 3]);
  });

  it("respects custom status + headers", () => {
    const res = apiRaw({ legacy: true }, { status: 202, headers: { "X-Legacy": "1" } });
    expect(res.status).toBe(202);
    expect(res.headers.get("X-Legacy")).toBe("1");
  });
});

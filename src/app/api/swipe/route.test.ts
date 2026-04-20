import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * /api/swipe — POST handler
 *
 * Mocks:
 *  - `@supabase/supabase-js` createClient → controllable mock with auth + from chain
 *  - `next/server` NextResponse → real Response wrapper for assertions
 *  - `@/lib/premium-gate` → controlled daily cap per test
 */

const { authGetUser, fromMock, getDailyLikeCapMock } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  fromMock: vi.fn(),
  getDailyLikeCapMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: authGetUser },
    from: fromMock,
  })),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      }),
  },
}));

vi.mock("@/lib/premium-gate", () => ({
  getDailyLikeCap: getDailyLikeCapMock,
}));

import { POST } from "./route";

/** Build a fake builder chain that returns a count + maybeSingle controllable. */
function buildChainable(opts: {
  count?: number;
  countError?: { message: string } | null;
  insertError?: { message: string; code?: string } | null;
  reverseSwipe?: { id: string } | null;
  conversationId?: string | null;
}) {
  const insertChain = {
    error: opts.insertError ?? null,
  };
  const reverseSingle = vi.fn().mockResolvedValue({
    data: opts.reverseSwipe ?? null,
    error: null,
  });
  const upsertSingle = vi.fn().mockResolvedValue({
    data: opts.conversationId ? { id: opts.conversationId } : null,
    error: null,
  });

  return {
    select: vi.fn(function (this: unknown) {
      return this;
    }),
    insert: vi.fn().mockResolvedValue(insertChain),
    upsert: vi.fn(function (this: unknown) {
      return this;
    }),
    eq: vi.fn(function (this: unknown) {
      return this;
    }),
    in: vi.fn(function (this: unknown) {
      return this;
    }),
    gte: vi.fn(function (this: unknown) {
      return this;
    }),
    limit: vi.fn(function (this: unknown) {
      return this;
    }),
    maybeSingle: reverseSingle,
    single: upsertSingle,
    // For the count query pattern: `.select("id", { count, head }).eq.in.gte` returns { count, error }
    then: (resolve: (v: { count: number | null; error: { message: string } | null }) => unknown) =>
      Promise.resolve({
        count: opts.count ?? 0,
        error: opts.countError ?? null,
      }).then(resolve),
  };
}

beforeEach(() => {
  authGetUser.mockReset();
  fromMock.mockReset();
  getDailyLikeCapMock.mockReset();
});

function makeRequest(opts: {
  body?: unknown;
  bearer?: string | null;
  rawBody?: string;
} = {}): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (opts.bearer) headers["authorization"] = `Bearer ${opts.bearer}`;
  return new Request("https://example.com/api/swipe", {
    method: "POST",
    headers,
    body: opts.rawBody ?? JSON.stringify(opts.body ?? {}),
  });
}

describe("POST /api/swipe", () => {
  it("returns 401 when no Bearer token is provided", async () => {
    const res = await POST(makeRequest({ body: { targetId: "x", direction: "like" } }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/non authentifie/i);
  });

  it("returns 401 when Bearer token is invalid (auth.getUser errors)", async () => {
    authGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });
    const res = await POST(
      makeRequest({ bearer: "fake", body: { targetId: "x", direction: "like" } }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when JSON body is malformed", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await POST(makeRequest({ bearer: "good", rawBody: "not-json" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when targetId is missing", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await POST(
      makeRequest({ bearer: "good", body: { direction: "like" } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when direction is invalid", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await POST(
      makeRequest({ bearer: "good", body: { targetId: "u-2", direction: "super-bad" } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/direction/i);
  });

  it("rejects swiping yourself with 400", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    const res = await POST(
      makeRequest({ bearer: "good", body: { targetId: "user-1", direction: "like" } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when free-tier cap is reached", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getDailyLikeCapMock.mockResolvedValue(100);
    fromMock.mockReturnValueOnce(buildChainable({ count: 100 }));

    const res = await POST(
      makeRequest({ bearer: "good", body: { targetId: "u-2", direction: "like" } }),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("rate_limited");
    expect(body.swipesRemaining).toBe(0);
    expect(body.resetAt).toBeTruthy();
  });

  it("happy path: records like + returns matched=false when no reverse swipe", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getDailyLikeCapMock.mockResolvedValue(100);

    // 1st call: count query (rate-limit). 2nd call: insert. 3rd call: reverse-swipe lookup.
    fromMock
      .mockReturnValueOnce(buildChainable({ count: 5 }))
      .mockReturnValueOnce(buildChainable({}))
      .mockReturnValueOnce(buildChainable({ reverseSwipe: null }));

    const res = await POST(
      makeRequest({ bearer: "good", body: { targetId: "u-2", direction: "like" } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(false);
    expect(body.conversationId).toBeNull();
    expect(body.swipesRemaining).toBeGreaterThanOrEqual(0);
  });

  it("matches mutual likes and creates a conversation", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-a" } },
      error: null,
    });
    getDailyLikeCapMock.mockResolvedValue(Infinity);

    fromMock
      .mockReturnValueOnce(buildChainable({ count: 0 })) // rate-limit
      .mockReturnValueOnce(buildChainable({})) // insert
      .mockReturnValueOnce(
        buildChainable({ reverseSwipe: { id: "rev-1" } }), // reverse-swipe
      )
      .mockReturnValueOnce(buildChainable({ conversationId: "conv-42" })); // upsert convo

    const res = await POST(
      makeRequest({ bearer: "good", body: { targetId: "u-b", direction: "like" } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(true);
    expect(body.conversationId).toBe("conv-42");
    // Premium-cap (Infinity) maps to large finite number for JSON safety.
    expect(body.swipesRemaining).toBe(9999);
  });

  it("returns 409 on duplicate swipe (PG unique violation)", async () => {
    authGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    getDailyLikeCapMock.mockResolvedValue(100);

    fromMock
      .mockReturnValueOnce(buildChainable({ count: 1 }))
      .mockReturnValueOnce(buildChainable({ insertError: { message: "dup", code: "23505" } }));

    const res = await POST(
      makeRequest({ bearer: "good", body: { targetId: "u-2", direction: "pass" } }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("already_swiped");
  });
});

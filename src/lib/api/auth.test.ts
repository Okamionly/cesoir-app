import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `requireUser` glues together two clients:
 *   1. `@supabase/supabase-js` `createClient` — Bearer-token path
 *   2. `@/lib/supabase/server` `createClient` — SSR cookies path
 *
 * Both are mocked; we control what `auth.getUser()` returns to exercise
 * every branch of the `requireUser` resolver and the `AuthError` helper.
 */

const { bearerGetUser, ssrGetUser, supabaseJsCreateClient, ssrCreateClient } = vi.hoisted(() => {
  const bearerGetUser = vi.fn();
  const ssrGetUser = vi.fn();
  const supabaseJsCreateClient = vi.fn(() => ({
    auth: { getUser: bearerGetUser },
  }));
  const ssrCreateClient = vi.fn(async () => ({
    auth: { getUser: ssrGetUser },
  }));
  return { bearerGetUser, ssrGetUser, supabaseJsCreateClient, ssrCreateClient };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: supabaseJsCreateClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: ssrCreateClient,
}));

import { requireUser, requireUserBearer, requireUserSsr, AuthError } from "./auth";

beforeEach(() => {
  bearerGetUser.mockReset();
  ssrGetUser.mockReset();
  supabaseJsCreateClient.mockClear();
  ssrCreateClient.mockClear();
});

describe("AuthError", () => {
  it("defaults to 401 + unauthenticated code", () => {
    const err = new AuthError("nope");
    expect(err.status).toBe(401);
    expect(err.code).toBe("unauthenticated");
    expect(err.name).toBe("AuthError");
    expect(err.message).toBe("nope");
  });

  it("respects custom status + code (e.g. 403 forbidden)", () => {
    const err = new AuthError("not allowed", 403, "forbidden");
    expect(err.status).toBe(403);
    expect(err.code).toBe("forbidden");
  });
});

describe("requireUserBearer", () => {
  it("throws AuthError with `missing_bearer` when no Authorization header", async () => {
    const req = new Request("https://example.com/api/foo");
    await expect(requireUserBearer(req)).rejects.toThrowError(
      expect.objectContaining({ code: "missing_bearer", status: 401 }),
    );
  });

  it("throws when header is present but missing Bearer prefix", async () => {
    const req = new Request("https://example.com", {
      headers: { authorization: "Basic abc" },
    });
    await expect(requireUserBearer(req)).rejects.toMatchObject({
      code: "missing_bearer",
    });
  });

  it("throws `invalid_session` when supabase auth.getUser returns an error", async () => {
    bearerGetUser.mockResolvedValue({ data: null, error: { message: "expired" } });
    const req = new Request("https://example.com", {
      headers: { authorization: "Bearer fake-token" },
    });
    await expect(requireUserBearer(req)).rejects.toMatchObject({
      code: "invalid_session",
      status: 401,
    });
  });

  it("returns user + supabase client on a valid Bearer token", async () => {
    const fakeUser = { id: "u-123", email: "test@example.com" };
    bearerGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const req = new Request("https://example.com", {
      headers: { authorization: "Bearer good-token" },
    });
    const ctx = await requireUserBearer(req);

    expect(ctx.user).toEqual(fakeUser);
    expect(ctx.supabase).toBeDefined();
    expect(supabaseJsCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer good-token" } },
      }),
    );
  });
});

describe("requireUserSsr", () => {
  it("throws `invalid_session` when SSR cookies have no user", async () => {
    ssrGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireUserSsr()).rejects.toMatchObject({
      code: "invalid_session",
    });
  });

  it("returns user + supabase client when SSR session is valid", async () => {
    const fakeUser = { id: "u-ssr", email: "ssr@example.com" };
    ssrGetUser.mockResolvedValue({ data: { user: fakeUser }, error: null });

    const ctx = await requireUserSsr();
    expect(ctx.user).toEqual(fakeUser);
    expect(ctx.supabase).toBeDefined();
    expect(ssrCreateClient).toHaveBeenCalledTimes(1);
  });
});

describe("requireUser (default resolver)", () => {
  it("delegates to Bearer path when Authorization header starts with Bearer", async () => {
    bearerGetUser.mockResolvedValue({
      data: { user: { id: "u-1" } },
      error: null,
    });
    const req = new Request("https://example.com", {
      headers: { authorization: "Bearer x" },
    });
    const ctx = await requireUser(req);
    expect(ctx.user.id).toBe("u-1");
    expect(ssrCreateClient).not.toHaveBeenCalled();
  });

  it("falls back to SSR path when no Bearer header is present and Supabase cookie exists", async () => {
    ssrGetUser.mockResolvedValue({
      data: { user: { id: "u-cookie" } },
      error: null,
    });
    const req = new Request("https://example.com", {
      headers: { cookie: "sb-myproj-auth-token=eyJ.foo.bar; other=1" },
    });
    const ctx = await requireUser(req);
    expect(ctx.user.id).toBe("u-cookie");
    expect(supabaseJsCreateClient).not.toHaveBeenCalled();
  });

  it("rejects with `missing_auth` when neither Bearer header nor Supabase cookie is present", async () => {
    const req = new Request("https://example.com");
    await expect(requireUser(req)).rejects.toMatchObject({
      code: "missing_auth",
      status: 401,
    });
    // Should short-circuit without touching cookies() / createClient.
    expect(ssrCreateClient).not.toHaveBeenCalled();
    expect(supabaseJsCreateClient).not.toHaveBeenCalled();
  });
});

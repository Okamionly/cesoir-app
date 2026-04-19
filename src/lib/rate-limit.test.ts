import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp, rateLimitResponse } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows hits under the limit", () => {
    const key = `test-under-${Math.random()}`;
    const r1 = checkRateLimit(key, 3, 60_000);
    const r2 = checkRateLimit(key, 3, 60_000);
    const r3 = checkRateLimit(key, 3, 60_000);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks after limit reached and returns retryAfter", () => {
    const key = `test-block-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const blocked = checkRateLimit(key, 2, 60_000);

    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("isolates buckets per key", () => {
    const keyA = `iso-a-${Math.random()}`;
    const keyB = `iso-b-${Math.random()}`;

    checkRateLimit(keyA, 1, 60_000);
    const blockedA = checkRateLimit(keyA, 1, 60_000);
    const freshB = checkRateLimit(keyB, 1, 60_000);

    expect(blockedA.ok).toBe(false);
    expect(freshB.ok).toBe(true);
  });

  it("decrements remaining correctly", () => {
    const key = `remain-${Math.random()}`;
    const r1 = checkRateLimit(key, 5, 60_000);
    const r2 = checkRateLimit(key, 5, 60_000);

    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(3);
  });
});

describe("getClientIp", () => {
  it("prefers x-vercel-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: {
        "x-vercel-forwarded-for": "1.2.3.4",
        "x-forwarded-for": "5.6.7.8",
      },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-forwarded-for and trims the first entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "9.9.9.9, 10.10.10.10" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("returns 'unknown' when no IP headers are set", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with Retry-After header and JSON body", async () => {
    const res = rateLimitResponse({ ok: false, remaining: 0, retryAfter: 30 });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(res.headers.get("Content-Type")).toBe("application/json");

    const body = (await res.json()) as { error: string; retryAfter: number };
    expect(body.error).toBe("rate_limited");
    expect(body.retryAfter).toBe(30);
  });

  it("defaults Retry-After to 60 when not provided", () => {
    const res = rateLimitResponse({ ok: false, remaining: 0 });
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});

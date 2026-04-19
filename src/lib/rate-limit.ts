/**
 * In-memory rate limiter — sliding window per key.
 *
 * Limitation: in-memory only. On Vercel serverless, each function instance
 * has its own Map → effective limit is N × instances. Sufficient for MVP
 * to slow down brute-force, but for production hardening swap for an
 * Upstash/Redis-backed implementation (see TODO at end of file).
 *
 * Usage:
 *   const result = checkRateLimit(`login:${ip}:${email}`, 5, 60_000);
 *   if (!result.ok) {
 *     return NextResponse.json({ error: "rate_limited", retryAfter: result.retryAfter }, { status: 429 });
 *   }
 */

type Bucket = {
  hits: number[]; // timestamps (ms) of each hit within the window
};

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 5000; // rough cap to bound memory; LRU-style purge

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter?: number; // seconds until next allowed hit
};

export function checkRateLimit(
  key: string,
  maxHits: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { hits: [] };
    if (buckets.size >= MAX_KEYS) {
      // Drop oldest entry — Map preserves insertion order
      const firstKey = buckets.keys().next().value;
      if (firstKey !== undefined) buckets.delete(firstKey);
    }
    buckets.set(key, bucket);
  }

  // Drop hits outside the window
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= maxHits) {
    const oldest = bucket.hits[0];
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  bucket.hits.push(now);
  return { ok: true, remaining: maxHits - bucket.hits.length };
}

/** Get client IP from a Fetch Request, with sensible fallbacks for Vercel/Cloudflare. */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-vercel-forwarded-for") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Standard 429 JSON response with Retry-After header.
 *
 * Shared shape so clients can dispatch uniformly across endpoints that
 * enforce a quota (wallet, undos, squad/join, account/delete, stripe).
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter ?? 60),
      },
    },
  );
}

// TODO production: replace this in-memory map with Upstash KV / Redis
// to share state across Vercel serverless instances. See @upstash/ratelimit.

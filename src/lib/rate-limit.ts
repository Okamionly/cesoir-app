/**
 * Rate limiter — distributed (Upstash Redis) with in-memory fallback.
 *
 * Production (Upstash configured):
 *   Uses @upstash/ratelimit sliding-window against a shared Redis instance
 *   → consistent state across all Vercel lambda instances. This is what
 *   prevents horizontal-scale brute-force (5 lambdas × 5 attempts = 25 free
 *   tries before any blocking with the in-memory approach).
 *
 * Dev / unconfigured (no Upstash env vars):
 *   Falls back to the previous per-process `Map` implementation. Sufficient
 *   for local dev / tests. A warning is logged once at cold start so we
 *   don't ship to prod without noticing.
 *
 * Env vars (both required to enable distributed mode):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Usage (unchanged — existing callers don't break, but must `await`):
 *   const result = await checkRateLimit(`login:${ip}:${email}`, 5, 60_000);
 *   if (!result.ok) {
 *     return rateLimitResponse(result);
 *   }
 *
 * For authenticated routes, prefer a userId-based key over an IP-based one —
 * shared IPs (campus, office, mobile carrier NAT) otherwise false-positive a
 * whole building on one abuser.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

// ─── Distributed limiter (Upstash) ────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

type LimiterKind = "login" | "signup" | "api" | "strict";

/**
 * Named limiters used via {@link checkRateLimitByAction}. Each has a sensible
 * default; callers that keep the legacy `(key, max, windowMs)` signature still
 * work, but they get a per-(max,window) on-demand limiter cached below.
 */
const namedLimiters: Record<LimiterKind, Ratelimit> | null = hasUpstash
  ? (() => {
      const redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
      return {
        // Anti brute-force login — tighter than the legacy 5/min so we still
        // get good UX but pop the box faster under attack.
        login: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, "1 m"),
          analytics: true,
          prefix: "rl:login",
        }),
        // Signup is expensive (email send, profile row, storage init) — rarer.
        signup: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(3, "1 h"),
          analytics: true,
          prefix: "rl:signup",
        }),
        // Default limiter for sensitive POST routes (wallet, undos, squad…).
        api: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(60, "1 m"),
          analytics: true,
          prefix: "rl:api",
        }),
        // Very rare actions (account deletion, etc.) — 1/hour.
        strict: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(1, "1 h"),
          analytics: true,
          prefix: "rl:strict",
        }),
      };
    })()
  : null;

// Cache for ad-hoc limiters created by legacy `(key, max, windowMs)` calls.
// Keyed by `${max}:${windowMs}`.
const adhocLimiters = new Map<string, Ratelimit>();

function getAdhocLimiter(
  max: number,
  windowMs: number,
): Ratelimit | null {
  if (!hasUpstash) return null;
  const cacheKey = `${max}:${windowMs}`;
  const existing = adhocLimiters.get(cacheKey);
  if (existing) return existing;

  const redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
  const seconds = Math.max(1, Math.round(windowMs / 1000));
  // Upstash Duration is a template string; build it from seconds.
  const window = `${seconds} s` as const;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    analytics: true,
    prefix: "rl:adhoc",
  });
  adhocLimiters.set(cacheKey, limiter);
  return limiter;
}

// ─── In-memory fallback (previous behaviour) ─────────────────────────────────

type Bucket = {
  hits: number[]; // timestamps (ms) of each hit within the window
};

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000; // rough cap to bound memory; LRU-style purge

function inMemoryCheck(
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

// ─── Warn once in prod-ish env if Upstash is missing ─────────────────────────

let warnedNoUpstash = false;
function warnOnceIfMissing(): void {
  if (hasUpstash || warnedNoUpstash) return;
  warnedNoUpstash = true;
  if (process.env.NODE_ENV === "production") {
    logger.warn("rate_limit_upstash_missing_falling_back_to_memory");
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until next allowed hit (only set when ok=false). */
  retryAfter?: number;
};

/**
 * Sliding-window rate limit check. Backward-compatible signature: existing
 * callers pass `(key, maxHits, windowMs)`. Now async — callers must `await`.
 *
 * When Upstash env vars are configured, this hits a distributed Redis
 * sliding-window limiter shared across all instances. Otherwise falls back
 * to a per-process in-memory Map (fine for dev, NOT enough in prod).
 */
export async function checkRateLimit(
  key: string,
  maxHits: number,
  windowMs: number,
): Promise<RateLimitResult> {
  warnOnceIfMissing();

  const limiter = getAdhocLimiter(maxHits, windowMs);
  if (!limiter) {
    return inMemoryCheck(key, maxHits, windowMs);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(key);
    if (success) {
      return { ok: true, remaining };
    }
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  } catch (err) {
    // Never fail the request because Redis blinked — fall back to in-memory
    // so the user gets through instead of a 500.
    logger.error("rate_limit_upstash_error", { err: String(err) });
    return inMemoryCheck(key, maxHits, windowMs);
  }
}

/**
 * Action-based rate limit check — preferred API for new routes. Picks a
 * preconfigured limiter by semantic action name (login/signup/api/strict).
 * Keys should already be namespaced by the caller (e.g. `ip:1.2.3.4:email`).
 */
export async function checkRateLimitByAction(
  key: string,
  action: LimiterKind,
): Promise<RateLimitResult> {
  warnOnceIfMissing();

  if (!namedLimiters) {
    const { max, windowMs } = ACTION_DEFAULTS[action];
    return inMemoryCheck(key, max, windowMs);
  }

  try {
    const { success, remaining, reset } = await namedLimiters[action].limit(
      key,
    );
    if (success) {
      return { ok: true, remaining };
    }
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  } catch (err) {
    logger.error("rate_limit_upstash_error", { err: String(err) });
    const { max, windowMs } = ACTION_DEFAULTS[action];
    return inMemoryCheck(key, max, windowMs);
  }
}

// Mirrors the Upstash defaults for the in-memory fallback path.
const ACTION_DEFAULTS: Record<LimiterKind, { max: number; windowMs: number }> =
  {
    login: { max: 5, windowMs: 60_000 },
    signup: { max: 3, windowMs: 60 * 60_000 },
    api: { max: 60, windowMs: 60_000 },
    strict: { max: 1, windowMs: 60 * 60_000 },
  };

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

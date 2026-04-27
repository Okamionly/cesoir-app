/**
 * Unified auth helper for API routes.
 *
 * Supports BOTH patterns so migration can be gradual:
 *   1. Bearer token (from `Authorization: Bearer <token>` header) — majority pattern
 *   2. SSR cookies (@supabase/ssr) — used by /api/auth/login, /api/auth/logout
 *
 * `requireUser(request)` returns `{ user, supabase }` or throws an `AuthError`.
 * The caller wraps in try/catch and can convert to `apiError(...)`.
 *
 * Rationale (audit ARCH_BACKEND API-1) : two patterns coexisted. Rather than
 * force migration of every client call (big refactor of client-side token
 * passing), we preserve Bearer as the canonical API pattern and offer the SSR
 * variant for routes that genuinely need cookie-bound sessions (login flow).
 */
import { createClient as createBearerClient } from "@supabase/supabase-js";
import { createClient as createSsrClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export class AuthError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 401, code = "unauthenticated") {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

/**
 * AuthedContext carries a loosely-typed Supabase client on purpose.
 *
 * Callers dozens of routes deep use `.from("tableName")` and spread
 * inserts without the full column shape (Wave-14 tables and the shape
 * of a few legacy tables don't currently round-trip through the
 * generator). Typing this as `SupabaseClient<Database>` would propagate
 * `never` inference across every API route that consumes it. Routes
 * that need a strict type can import `Database` directly from
 * `@/lib/supabase-types` and cast on the specific call site.
 *
 * The server-side boundary we actually care about is validation (Zod)
 * + RLS (Postgres), not TS strictness on the client proxy.
 */
export interface AuthedContext {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>;
}

/**
 * Extracts the user from a Bearer token in the Authorization header.
 * Throws `AuthError` if missing or invalid.
 */
export async function requireUserBearer(request: Request): Promise<AuthedContext> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Non authentifie", 401, "missing_bearer");
  }
  const token = authHeader.slice(7);

  const supabase = createBearerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new AuthError("Session invalide", 401, "invalid_session");
  }

  return { user: data.user, supabase };
}

/**
 * Extracts the user from SSR cookies (via @supabase/ssr).
 * Use for endpoints that must read/write cookies (login, logout, oauth callback).
 */
export async function requireUserSsr(): Promise<AuthedContext> {
  const supabase = await createSsrClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new AuthError("Session invalide", 401, "invalid_session");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { user: data.user, supabase: supabase as unknown as SupabaseClient<any> };
}

/**
 * CSRF protection: list of origins allowed to mutate state with cookie auth.
 *
 * Cookies are auto-attached by browsers on cross-origin form POSTs, which
 * means a malicious site could trigger destructive ops (account delete, swipe,
 * roses spend) just by getting a logged-in user to visit a crafted page.
 *
 * Bearer-token clients (mobile / SDK) are immune because attackers can't read
 * the token from another origin — so we only enforce the origin check when
 * auth is cookie-based.
 */
function getAllowedOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cesoir-app.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
  ];
}

/**
 * Verifies that a state-changing (non-GET/HEAD/OPTIONS) cookie-authed request
 * originates from an allowed Origin or Referer. Returns `null` if the request
 * is safe (or uses Bearer auth, which is CSRF-immune); returns an `AuthError`
 * to throw otherwise.
 *
 * Why this exists: Supabase SSR session cookies are auto-attached by browsers
 * on cross-origin form POSTs, exposing every cookie-authed mutating route
 * (account delete, swipe, wallet spend, etc.) to CSRF. Bearer tokens can't be
 * read across origins so SDK/mobile clients skip this check. See OWASP CSRF
 * cheatsheet — Origin/Referer validation is the cookie-only equivalent of a
 * synchronizer token when SameSite=Lax isn't sufficient (e.g. top-level POST
 * navigations from an attacker-controlled form).
 */
function checkCsrfOrigin(request: Request): AuthError | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  // Bearer-authed requests come from non-browser clients (mobile, SDK, server).
  // Browsers can't read another origin's bearer token, so CSRF doesn't apply.
  const hasBearer = request.headers.get("authorization")?.startsWith("Bearer ");
  if (hasBearer) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = getAllowedOrigins();
  const isAllowed = (url: string | null) =>
    !!url && allowed.some((o) => url.startsWith(o));

  if (!isAllowed(origin) && !isAllowed(referer)) {
    return new AuthError("Origine non autorisee", 403, "csrf-rejected");
  }
  return null;
}

/**
 * Default `requireUser`. Tries Bearer first (API canonical), falls back to SSR
 * cookies if the request carries a Supabase session cookie. Throws `AuthError`
 * if neither works.
 *
 * For non-GET methods using cookie auth, also enforces an Origin/Referer check
 * to block CSRF (see `checkCsrfOrigin` rationale). Bearer-authed mutations
 * skip this check — they aren't reachable via browser cookie auto-attach.
 *
 * Cookie sniffing avoids hitting `cookies()` in contexts that aren't request
 * scopes (e.g. unit tests), which would otherwise throw a Next.js dynamic-API
 * error the moment we enter the SSR branch with no auth header at all.
 */
export async function requireUser(request: Request): Promise<AuthedContext> {
  const csrfError = checkCsrfOrigin(request);
  if (csrfError) {
    throw csrfError;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return requireUserBearer(request);
  }

  // Fall back to SSR only if the client actually sent a Supabase cookie. The
  // cookie name uses the shared `sb-` prefix (@supabase/ssr). If no such
  // cookie is present, we treat the request as unauthenticated without
  // touching `cookies()` — avoids "called outside a request scope" in tests.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasSupabaseCookie = /(?:^|;\s*)sb-[\w-]+-auth-token/i.test(cookieHeader);
  if (!hasSupabaseCookie) {
    throw new AuthError("Non authentifie", 401, "missing_auth");
  }

  return requireUserSsr();
}

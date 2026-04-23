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
 * Default `requireUser`. Tries Bearer first (API canonical), falls back to SSR
 * cookies if the request carries a Supabase session cookie. Throws `AuthError`
 * if neither works.
 *
 * Cookie sniffing avoids hitting `cookies()` in contexts that aren't request
 * scopes (e.g. unit tests), which would otherwise throw a Next.js dynamic-API
 * error the moment we enter the SSR branch with no auth header at all.
 */
export async function requireUser(request: Request): Promise<AuthedContext> {
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

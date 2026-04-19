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
import type { Database } from "@/lib/supabase-types";

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

export interface AuthedContext {
  user: User;
  supabase: SupabaseClient<Database>;
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

  const supabase = createBearerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  return { user: data.user, supabase: supabase as unknown as SupabaseClient<Database> };
}

/**
 * Default `requireUser`. Tries Bearer first (API canonical), falls back to SSR
 * cookies if Bearer header is absent. Throws `AuthError` if neither works.
 *
 * Use this in API routes that don't care which pattern the client uses.
 */
export async function requireUser(request: Request): Promise<AuthedContext> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return requireUserBearer(request);
  }
  return requireUserSsr();
}

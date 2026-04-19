import { createClient } from "@/lib/supabase/server";
import { apiError, apiRaw } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 *
 * Logs the user in server-side and sets the proper SSR cookies
 * so the session persists across page navigations.
 *
 * Hardening (audit 2026-04-19):
 *   H3 — In-memory rate limit: 5 attempts / 60s per (ip, email).
 *   M6 — Generic error message; no leaking "user exists vs wrong password".
 *
 * Note: uses `apiRaw` (not `apiOk`) to preserve the existing `{ ok, user }`
 * shape clients already consume. New endpoints should use `apiOk(data)`.
 */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return apiError("Email et mot de passe requis", 400, {
        code: "missing_credentials",
      });
    }

    // H3 — rate limit by (ip, email) so neither a single IP nor a single
    // account can be brute-forced.
    const ip = getClientIp(request);
    const normalizedEmail = String(email).toLowerCase().trim();
    const rl = checkRateLimit(
      `login:${ip}:${normalizedEmail}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rl.ok) {
      return apiError(
        "Trop de tentatives. Réessaye dans quelques instants.",
        429,
        {
          code: "rate_limited",
          details: { retryAfter: rl.retryAfter },
          headers: rl.retryAfter
            ? { "Retry-After": String(rl.retryAfter) }
            : undefined,
        },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      // M6 — single generic message regardless of failure type.
      return apiError("Email ou mot de passe incorrect", 401, {
        code: "invalid_credentials",
      });
    }

    return apiRaw({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch {
    console.error("[/api/auth/login] unexpected error");
    return apiError("Erreur serveur", 500, { code: "internal_error" });
  }
}

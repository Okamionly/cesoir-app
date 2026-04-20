import { createClient } from "@/lib/supabase/server";
import { apiError, apiRaw } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { authSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

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
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("Corps JSON invalide", 400, { code: "invalid_json" });
    }

    const parsed = authSchema.safeParse(rawBody);
    if (!parsed.success) {
      logger.warn("api_auth_login_validation_failed", { fields: parsed.error.flatten().fieldErrors });
      return apiError("Email et mot de passe requis", 400, {
        code: "validation_failed",
        details: { issues: parsed.error.flatten() },
      });
    }
    const { email, password } = parsed.data;

    // H3 — rate limit by (ip, email) so neither a single IP nor a single
    // account can be brute-forced.
    const ip = getClientIp(request);
    const normalizedEmail = email.toLowerCase().trim();
    const rl = await checkRateLimit(
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
    logger.error("api_auth_login_unexpected_error");
    return apiError("Erreur serveur", 500, { code: "internal_error" });
  }
}

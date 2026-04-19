import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
 */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 },
      );
    }

    // H3 — rate limit by (ip, email) so neither a single IP nor a single
    // account can be brute-forced. Supabase Auth has its own ~5-10/h limit
    // but at the app layer we get faster lockout + custom error response.
    const ip = getClientIp(request);
    const normalizedEmail = String(email).toLowerCase().trim();
    const rl = checkRateLimit(
      `login:${ip}:${normalizedEmail}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Trop de tentatives. Réessaye dans quelques instants.",
          retryAfter: rl.retryAfter,
        },
        {
          status: 429,
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
      // M6 — single generic message regardless of failure type. Do not
      // leak whether the email exists in the database.
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch {
    // Avoid leaking error.message to the client — log server-side instead.
    console.error("[/api/auth/login] unexpected error");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

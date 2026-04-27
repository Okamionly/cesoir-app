import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  checkRateLimitByAction,
  rateLimitResponse,
  getClientIp,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/signup
 *
 * 2026-04-24 patrol #7 (was SEC-007). Wraps `supabase.auth.signUp`
 * server-side so we can rate-limit it. Previously AuthContext called
 * `supabase.auth.signUp` directly in the browser with no throttle — a
 * bot army with leaked invite codes could flood the user base.
 *
 * Rate limit: 3 signups per hour per IP (via the existing
 * `namedLimiters.signup` profile, already wired in src/lib/rate-limit.ts).
 *
 * The client still owns the session state — we return the access + refresh
 * tokens from Supabase and the client calls `supabase.auth.setSession()`
 * so it stays in sync without round-tripping every request through this
 * route.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  email?: string;
  password?: string;
  metadata?: {
    name?: string;
    age?: number;
    gender?: string;
    looking_for?: string;
  };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 8 caractères" },
      { status: 400 },
    );
  }

  // 3 signups per hour per IP. Uses the prebuilt `signup` named limiter.
  // Signature is (key, action) — the ip goes first, not the action.
  const rl = await checkRateLimitByAction(`signup:${ip}`, "signup");
  if (!rl.ok) return rateLimitResponse(rl);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error("api_signup_missing_env");
    return NextResponse.json(
      { error: "Configuration serveur incomplète" },
      { status: 500 },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const metadata = body.metadata && typeof body.metadata === "object"
    ? body.metadata
    : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) {
    logger.warn("api_signup_supabase_error", { err: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // SECURITY (P0 fix 2026-04-26): account-takeover via unverified signup.
  // Supabase will hand back a live session even when the email is unconfirmed
  // if the project setting "Confirm email" is on but "Allow unverified login"
  // is also on (or for projects with confirmation disabled the field is set
  // immediately, so the gate becomes a no-op — that's fine). Without this
  // gate, an attacker who signs up with a typo of someone else's address
  // (e.g. `victim@gmial.com`) is auto-authenticated and can claim invite
  // codes / roses / Founder badge before the real owner ever notices.
  //
  // We strip the session whenever `email_confirmed_at` is null and force the
  // user through the email confirmation flow.
  //
  // TODO(client UX): src/app/signup-quick/page.tsx still proceeds to step 2
  // after signup. When the response now contains `requiresEmailConfirmation:
  // true` and `session: null`, the page should render a "Vérifie ton email"
  // banner with a resend button instead of trying to auto-log in. Backend
  // hardening landed first; client follow-up tracked separately.
  const emailConfirmed = data?.user?.email_confirmed_at;
  if (data.session && !emailConfirmed) {
    logger.warn("api_signup_session_stripped_unverified", {
      userId: data.user?.id,
    });
    return NextResponse.json({
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
      session: null,
      requiresEmailConfirmation: true,
      message: "Vérifie ton email pour activer ton compte.",
    });
  }

  // Return what the client needs to set its own session. If Supabase is
  // configured to require email confirmation, `session` will be null and the
  // client will show the confirmation-sent state.
  return NextResponse.json({
    user: data.user,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
      : null,
  });
}

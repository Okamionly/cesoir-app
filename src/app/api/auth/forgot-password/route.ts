import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/forgot-password
 *
 * 2026-04-24 patrol #7 (was SEC-006). Wraps `supabase.auth.resetPasswordForEmail`
 * server-side so we can rate-limit it before the email-send fires. The
 * previous /forgot-password page called the Supabase client directly with
 * no throttle — an email-bomb vector and a weak account-enumeration channel.
 *
 * Rate limit: 3 requests per 15 minutes per (IP + normalized email).
 * Intentionally returns the same 200 response regardless of whether the email
 * exists — prevents enumeration. Supabase also never errors for missing
 * addresses, so this is consistent with what users already see.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  email?: string;
  redirectTo?: string;
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
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // 3 attempts / 15 min / (ip + email) — prevents both IP-broadcast and
  // single-email-targeted bombing.
  const rl = await checkRateLimit(`forgot:${ip}:${email}`, 3, 15 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error("api_forgot_missing_env");
    return NextResponse.json(
      { error: "Configuration serveur incomplète" },
      { status: 500 },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const redirectTo =
    typeof body.redirectTo === "string" && body.redirectTo.startsWith("http")
      ? body.redirectTo
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    // Log server-side but never leak to the client — same response shape
    // whether the email exists or not.
    logger.warn("api_forgot_supabase_error", { err: error.message });
  }

  return NextResponse.json({ ok: true });
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { isMaleThrottled, getCurrentRatio } from "@/lib/analytics/genderRatio";

/**
 * POST /api/invites/claim
 *
 * Wave 15 CRO 10/10 (2026-04-23). Called from /register step 0 (before the
 * auth.signUp) to validate a candidate invite code. We look it up with the
 * anon client (codes table has no SELECT policy for anonymous readers, so
 * this actually needs the service role to preview).
 *
 * Two phases:
 *   1. POST { code, verify: true } → validates the code without claiming.
 *      Returns { valid: true } if the code exists + unused + not expired.
 *   2. POST { code } (authenticated) → claims it via the RPC
 *      `claim_invite_code(p_code text)`. The RPC is SECURITY DEFINER and
 *      uses auth.uid() — we just forward the bearer token.
 *
 * Rate limited to 10 requests / minute / IP to deter brute-force on the
 * 8-char alnum code (14^8 ≈ 1.5B, but still spray-able over time).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

interface ClaimBody {
  code?: string;
  verify?: boolean;
  /** Gender of the registering user — used for H/F ratio throttle check. */
  gender?: string;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`invite-claim:${ip}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  let body: ClaimBody;
  try {
    body = (await request.json()) as ClaimBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  if (!code || code.length < 4 || code.length > 16) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  // --- Phase 1 : verify only --------------------------------------
  if (body.verify) {
    if (!SUPABASE_SERVICE_ROLE) {
      logger.error("api_invites_verify_missing_service_role");
      return NextResponse.json(
        { error: "Configuration serveur incomplète" },
        { status: 500 },
      );
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const { data, error } = await admin
      .from("invite_codes")
      .select("code, used_by, expires_at")
      .ilike("code", code)
      .maybeSingle();

    if (error) {
      logger.error("api_invites_verify_query_failed", { err: error.message });
      return NextResponse.json({ valid: false, reason: "error" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
    }
    if (data.used_by) {
      return NextResponse.json({ valid: false, reason: "used" }, { status: 409 });
    }
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" }, { status: 410 });
    }

    // --- H/F ratio throttle (W2-2 CEO P0) -----------------------------------
    // If the ratio of males in the last 7 days exceeds 60%, block new male
    // signups so the platform stays balanced. Female and non-binary users
    // always pass. The check runs during verify (phase 1) so the user gets
    // feedback before completing the full auth.signup flow.
    const gender = (body.gender ?? "").trim();
    if (gender) {
      try {
        const throttled = await isMaleThrottled(gender);
        const ratio = await getCurrentRatio();

        // PostHog event — fires whether blocked or allowed.
        // Server-side track writes to logger since PostHog JS is browser-only.
        logger.info("signup_gender_check", {
          gender,
          current_ratio_pct: ratio.ratio_male_pct,
          throttled,
          male: ratio.male,
          female: ratio.female,
        });

        if (throttled) {
          return NextResponse.json(
            {
              valid: false,
              reason: "gender_quota",
              message:
                "Pour maintenir l'équilibre de la communauté, les inscriptions masculines sont temporairement suspendues. Réessaie dans quelques jours.",
              ratio_male_pct: ratio.ratio_male_pct,
            },
            { status: 429 },
          );
        }
      } catch (ratioErr) {
        // Non-fatal: if the ratio check fails (e.g. service role missing in
        // local dev), log and let the signup continue rather than blocking
        // legitimate users on an infra error.
        logger.warn("gender_ratio_check_failed", {
          err: ratioErr instanceof Error ? ratioErr.message : String(ratioErr),
        });
      }
    }

    return NextResponse.json({ valid: true, code: data.code });
  }

  // --- Phase 2 : claim (authenticated) ----------------------------
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await db.rpc("claim_invite_code", { p_code: code });

  if (error) {
    const msg = error.message || "Code invalide";
    // Map known error codes to HTTP status
    const status =
      msg.includes("already claimed") ? 409 :
      msg.includes("expired") ? 410 :
      msg.includes("Invalid") ? 404 :
      msg.includes("authenticated") ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ claimed: true, data });
}

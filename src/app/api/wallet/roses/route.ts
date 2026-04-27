import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { walletActionSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { isMonetizationEnabledServer } from "@/lib/featureFlags";
import { requireUser, AuthError } from "@/lib/api/auth";
import { apiError } from "@/lib/api/response";

/**
 * POST /api/wallet/roses
 * Body: { action: 'spend', amount: number }
 * Auth: unified `requireUser` (Bearer or SSR cookie).
 *
 * Decrements the user's Roses balance server-side. Before audit 2026-04-19
 * the balance lived in localStorage — a user who cleared it got unlimited
 * spend. Now the DB is source of truth.
 *
 * Rate limit: 10/min per user (prevent rapid drain / flooding).
 *
 * On 'spend' we reject if balance < amount (returns 402 payment_required).
 * The row is upserted on first call (0 default via table constraint).
 *
 * Audit 2026-04-26 (P0 fraud fix): the `earn` action was removed. Any
 * authenticated client could call `{ action: "earn", amount: 999999 }`
 * and grant themselves unlimited roses via the service-role upsert below.
 * Roses are now server-issued only:
 *   - Stripe checkout webhook (paid purchase)
 *   - `claim_invite_code` RPC (referral reward)
 *   - achievement triggers (server-side game logic)
 * Stale clients sending `action: "earn"` get HTTP 410 (Gone) with a clear
 * `earn-action-removed` code so they can be detected in logs and updated.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export async function POST(request: Request) {
  // Free-first launch: roses wallet mutations are blocked while monetization
  // is off. Reading still works (GET) so latent UI can render 0 without crashing.
  if (!isMonetizationEnabledServer()) {
    logger.warn("api_wallet_roses_mutate_blocked_monetization_disabled");
    return NextResponse.json({ error: "monetization_disabled" }, { status: 503 });
  }

  // --- Auth (unified helper, Wave 15) ---
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;

  // --- Rate limit: 10/min per user ---
  const rl = await checkRateLimit(`wallet:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // --- Parse + validate body ---
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  // P0 fraud fix (2026-04-26): intercept the deprecated `earn` action BEFORE
  // schema validation so legacy clients get a clear, dedicated error code
  // (instead of a generic `validation_failed`) and we can track adoption in
  // logs. Any code path that needs to credit roses must go through a
  // server-trusted entry point (Stripe webhook / claim_invite_code RPC /
  // achievement triggers) — never through this client-facing route.
  if (
    typeof rawBody === "object" &&
    rawBody !== null &&
    (rawBody as { action?: unknown }).action === "earn"
  ) {
    logger.warn("api_wallet_roses_earn_attempt_blocked", { userId: user.id });
    return apiError(
      "Roses are server-issued only. Use Stripe checkout, invite claim, or achievement triggers.",
      410, // Gone
      { code: "earn-action-removed" },
    );
  }

  const parsed = walletActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    logger.warn("api_wallet_roses_validation_failed", { fields: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      {
        error: "validation_failed",
        code: "validation_failed",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const { action, amount } = parsed.data;

  // --- Fetch current balance (upsert row if missing) ---
  const { data: wallet, error: selectErr } = await db
    .from("user_wallet")
    .select("roses_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectErr) {
    logger.error("api_wallet_roses_select_failed", { err: selectErr.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const currentBalance = wallet?.roses_balance ?? 0;

  // --- Compute new balance ---
  // Switch on action so the dispatch is exhaustive — adding a future
  // server-side action (e.g. "refund") forces an explicit case here.
  let newBalance: number;
  switch (action) {
    case "spend": {
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: "insufficient_balance", balance: currentBalance },
          { status: 402 },
        );
      }
      newBalance = currentBalance - amount;
      break;
    }
    // Defensive: schema rejects anything other than "spend" today. The
    // `earn` case is intercepted above with a 410. If a new union member
    // is added without a case here, TS won't catch it (z.enum widens to
    // string), so we 400 explicitly rather than silently fall through.
    default: {
      logger.error("api_wallet_roses_unhandled_action", { action });
      return apiError("Action non supportee", 400, { code: "unsupported_action" });
    }
  }

  // --- Upsert ---
  // RLS on user_wallet only allows SELECT for the user — writes must go
  // through service_role. Use it if configured, otherwise fall back to
  // the user's token (requires an UPDATE policy — kept tight: writes
  // only via this route).
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const writerDb = serviceRoleKey
    ? createClient(SUPABASE_URL, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : db;

  const { error: upsertErr } = await writerDb
    .from("user_wallet")
    .upsert(
      { user_id: user.id, roses_balance: newBalance },
      { onConflict: "user_id" },
    );

  if (upsertErr) {
    logger.error("api_wallet_roses_upsert_failed", { err: upsertErr.message });
    return NextResponse.json({ error: "Erreur ecriture wallet" }, { status: 500 });
  }

  return NextResponse.json({ balance: newBalance, action, amount });
}

/**
 * GET /api/wallet/roses — read balance (client uses this to hydrate).
 */
export async function GET(request: Request) {
  let ctx;
  try {
    ctx = await requireUser(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { user, supabase: db } = ctx;

  const { data: wallet, error } = await db
    .from("user_wallet")
    .select("roses_balance, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logger.error("api_wallet_roses_get_failed", { err: error.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({
    balance: wallet?.roses_balance ?? 0,
    updatedAt: wallet?.updated_at ?? null,
  });
}

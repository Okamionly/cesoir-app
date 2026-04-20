import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { walletActionSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { isMonetizationEnabledServer } from "@/lib/featureFlags";

/**
 * POST /api/wallet/roses
 * Body: { action: 'spend' | 'earn', amount: number }
 * Auth: Bearer <access_token>
 *
 * Increments/decrements the user's Roses balance server-side. Before
 * audit 2026-04-19 the balance lived in localStorage — a user who
 * cleared it got unlimited spend. Now the DB is source of truth.
 *
 * Rate limit: 10/min per user (prevent rapid drain / flooding).
 *
 * On 'spend' we reject if balance < amount (returns 402 payment_required).
 * The row is upserted on first call (0 default via table constraint).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function POST(request: Request) {
  // Free-first launch: roses wallet mutations are blocked while monetization
  // is off. Reading still works (GET) so latent UI can render 0 without crashing.
  if (!isMonetizationEnabledServer()) {
    logger.warn("api_wallet_roses_mutate_blocked_monetization_disabled");
    return NextResponse.json({ error: "monetization_disabled" }, { status: 503 });
  }

  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

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
  let newBalance: number;
  if (action === "spend") {
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: "insufficient_balance", balance: currentBalance },
        { status: 402 },
      );
    }
    newBalance = currentBalance - amount;
  } else {
    newBalance = currentBalance + amount;
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
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

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

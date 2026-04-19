import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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

interface WalletBody {
  action: "spend" | "earn";
  amount: number;
}

export async function POST(request: Request) {
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
  const rl = checkRateLimit(`wallet:${user.id}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // --- Parse body ---
  let body: WalletBody;
  try {
    body = (await request.json()) as WalletBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { action, amount } = body;
  if (action !== "spend" && action !== "earn") {
    return NextResponse.json(
      { error: "action doit etre 'spend' ou 'earn'" },
      { status: 400 },
    );
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "amount doit etre un entier positif" },
      { status: 400 },
    );
  }

  // --- Fetch current balance (upsert row if missing) ---
  const { data: wallet, error: selectErr } = await db
    .from("user_wallet")
    .select("roses_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectErr) {
    console.error("[/api/wallet/roses] select failed:", selectErr.message);
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
    console.error("[/api/wallet/roses] upsert failed:", upsertErr.message);
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
    console.error("[/api/wallet/roses GET] failed:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({
    balance: wallet?.roses_balance ?? 0,
    updatedAt: wallet?.updated_at ?? null,
  });
}

/**
 * /api/push/subscribe — Web push subscription registration (Wave 16 Bet #4)
 *
 * POST   { subscription: { endpoint, keys: { p256dh, auth } } }
 *        Saves (or upserts) the device's push subscription so the server
 *        can fan-out a notification when a match or message arrives.
 *
 * DELETE { endpoint: string }
 *        Removes the subscription for THIS user + endpoint pair.
 *
 * Auth   Bearer token (Authorization: Bearer <jwt>) — same pattern as the
 *        rest of /api/* (see src/lib/api/auth.ts). Cookie-based fallback
 *        is handled by `requireUser` for browsers that send the SSR
 *        session cookie.
 *
 * Required env vars (set in Vercel Production + Preview + Development):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY    (server-only, bypasses RLS for upsert)
 *
 * The service-role client is used for the WRITE because the row must be
 * insertable from the server even though RLS only lets users SEE their
 * own rows. The user identity itself is verified via the Bearer token
 * BEFORE we touch the row, so the trust boundary is preserved.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser, AuthError } from "@/lib/api/auth";
import { logger } from "@/lib/logger";

interface PushKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushKeys;
}

interface SubscribeBody {
  subscription?: PushSubscriptionPayload;
  // The hook also forwards `timestamp`; we ignore it (server uses now()).
  timestamp?: number;
}

interface DeleteBody {
  endpoint?: string;
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "push_subscribe_misconfigured: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  // ---- Auth ----
  let userId: string;
  try {
    const ctx = await requireUser(request);
    userId = ctx.user.id;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    throw err;
  }

  // ---- Body ----
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json(
      { error: "invalid_subscription", code: "missing_fields" },
      { status: 400 },
    );
  }

  // ---- Upsert ----
  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (err) {
    logger.error("push_subscribe_env_missing", { err: String(err) });
    return NextResponse.json({ error: "Configuration serveur" }, { status: 500 });
  }

  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: request.headers.get("user-agent") ?? null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    logger.error("push_subscribe_upsert_failed", { err: error.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  // ---- Auth ----
  let userId: string;
  try {
    const ctx = await requireUser(request);
    userId = ctx.user.id;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    throw err;
  }

  // ---- Body ----
  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
  }

  let admin;
  try {
    admin = getServiceRoleClient();
  } catch (err) {
    logger.error("push_unsubscribe_env_missing", { err: String(err) });
    return NextResponse.json({ error: "Configuration serveur" }, { status: 500 });
  }

  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", body.endpoint);

  if (error) {
    logger.error("push_unsubscribe_delete_failed", { err: error.message });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

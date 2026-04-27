/**
 * /api/push/send — internal push fan-out endpoint (Wave 16 Bet #4)
 *
 * Called server-side ONLY (from the Postgres trigger in migration
 * 030_push_triggers.sql via pg_net.http_post). Browsers are blocked by
 * the shared-secret header check.
 *
 * Body shape:
 *   { user_id: string, payload: PushPayload }
 *
 * Required env vars (set in Vercel for Production + Preview + Dev):
 *   - PUSH_INTERNAL_SECRET   (random 32-char string, also stored as a
 *                             Postgres setting `app.push_internal_secret`
 *                             so the trigger can attach it as a header)
 *   - VAPID_*                (see src/lib/push/sendPush.ts)
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * The handler is intentionally thin — all the work lives in
 * sendPushToUser so the same code path is used by direct server callers
 * (api/swipe/route.ts) and the trigger.
 */
import { NextResponse, type NextRequest } from "next/server";
import { sendPushToUser, type PushPayload } from "@/lib/push/sendPush";
import { logger } from "@/lib/logger";

interface SendBody {
  user_id?: string;
  payload?: PushPayload;
}

export async function POST(request: NextRequest) {
  // ---- Shared-secret check ----
  const secret = request.headers.get("x-internal-secret");
  const expected = process.env.PUSH_INTERNAL_SECRET;
  if (!expected) {
    // In dev the secret is intentionally absent. Refuse rather than
    // silently letting unauthenticated calls through.
    logger.warn("push_send_secret_missing");
    return NextResponse.json({ error: "Configuration serveur" }, { status: 500 });
  }
  if (secret !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ---- Body ----
  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!body.user_id || !body.payload?.title || !body.payload?.body) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await sendPushToUser(body.user_id, body.payload);
  return NextResponse.json({ ok: true, ...result });
}

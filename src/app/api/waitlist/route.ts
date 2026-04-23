import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * GET /api/waitlist
 *
 * Public counter of onboarded users — shown on the landing as social proof.
 * Reads from the `v_waitlist_count` view (migration 021, security_invoker).
 *
 * Cached at the edge for 60s to keep landing rendering snappy; the view
 * is cheap (single aggregate) but we still don't need second-precision.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const revalidate = 60;

export async function GET() {
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await db
    .from("v_waitlist_count")
    .select("signed_up")
    .maybeSingle();

  if (error) {
    logger.error("api_waitlist_count_failed", { err: error.message });
    // Degrade gracefully — a zero counter on the landing is worse than
    // showing a plausible fallback.
    return NextResponse.json({ signedUp: 0, error: "unavailable" }, { status: 200 });
  }

  return NextResponse.json(
    { signedUp: data?.signed_up ?? 0 },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

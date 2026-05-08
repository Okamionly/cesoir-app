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
 *
 * Next.js 16 note: `revalidate` route segment is removed when Cache
 * Components are enabled. The HTTP Cache-Control header below is what
 * actually drives the 60s edge cache. Build-time prerender is avoided
 * by lazy-init of the Supabase client + missing-env early return —
 * Vercel build context doesn't expose the public env vars during static
 * generation of API routes.
 */

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Guard: if env vars are missing (Vercel build static-generation phase
  // or local dev without .env), serve a graceful fallback instead of
  // crashing the build. createClient() throws "supabaseUrl is required"
  // on empty string — that's what was breaking the production build.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { signedUp: 0, error: "env_missing" },
      { status: 200 },
    );
  }

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

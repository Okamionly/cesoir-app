/**
 * GET /api/health — liveness + readiness probe.
 *
 * Returns 200 when the app is up and Supabase round-trips a trivial
 * select, 503 otherwise. Vercel / uptime monitors / Kubernetes probes
 * can all consume this. No auth required (info is non-sensitive).
 */
import { NextResponse } from "next/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "fail" | "unconfigured";

async function checkSupabase(): Promise<CheckStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "unconfigured";
  try {
    const client = createAnonClient(url, key, {
      auth: { persistSession: false },
    });
    const { error } = await client.from("profiles").select("id").limit(1);
    return error ? "fail" : "ok";
  } catch (e) {
    logger.warn("health_check_supabase_throw", { err: String(e) });
    return "fail";
  }
}

export async function GET() {
  const db = await checkSupabase();
  const body = {
    status: db === "ok" || db === "unconfigured" ? "ok" : "degraded",
    checks: {
      app: "ok" as const,
      db,
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    ts: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: body.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

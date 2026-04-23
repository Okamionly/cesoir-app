/**
 * POST /api/moderate-photo — optional Sightengine cross-check (V5 Wave 15)
 *
 * Complements the client-side nsfwjs check. Requires:
 *   SIGHTENGINE_USER (server-side secret)
 *   SIGHTENGINE_SECRET (server-side secret)
 * If unset, returns null (graceful fallback — client-only mode).
 *
 * Budget: Sightengine free tier = 2000 ops/mo. Use only for flagged/ambiguous
 * photos, not every upload, to stay within budget.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SightengineResponse {
  status: string;
  nudity?: {
    raw?: number;
    partial?: number;
    safe?: number;
  };
  offensive?: { prob?: number };
}

export async function POST(req: Request) {
  const user = process.env.SIGHTENGINE_USER;
  const secret = process.env.SIGHTENGINE_SECRET;
  if (!user || !secret) {
    return NextResponse.json(
      { safe: true, categories: [], scores: {}, fallbackUsed: true },
      { status: 200 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("media");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "media_required" }, { status: 400 });
    }

    const seForm = new FormData();
    seForm.append("media", file);
    seForm.append("models", "nudity-2.0,offensive");
    seForm.append("api_user", user);
    seForm.append("api_secret", secret);

    const res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: seForm,
    });
    if (!res.ok) {
      logger.warn("sightengine_http_error", { status: res.status });
      return NextResponse.json({
        safe: true,
        categories: [],
        scores: {},
        fallbackUsed: true,
      });
    }
    const data = (await res.json()) as SightengineResponse;
    const categories: string[] = [];
    const scores: Record<string, number> = {};
    if (data.nudity) {
      scores.nudity_raw = data.nudity.raw ?? 0;
      scores.nudity_partial = data.nudity.partial ?? 0;
      if ((data.nudity.raw ?? 0) > 0.5) categories.push("nudity_raw");
      if ((data.nudity.partial ?? 0) > 0.6) categories.push("nudity_partial");
    }
    if (data.offensive?.prob != null) {
      scores.offensive = data.offensive.prob;
      if (data.offensive.prob > 0.5) categories.push("offensive");
    }
    return NextResponse.json({
      safe: categories.length === 0,
      categories,
      scores,
      fallbackUsed: false,
    });
  } catch (err) {
    logger.error("sightengine_exception", { err: String(err) });
    return NextResponse.json({
      safe: true,
      categories: [],
      scores: {},
      fallbackUsed: true,
    });
  }
}

/**
 * Infra metrics — lightweight in-session cost tracking.
 *
 * Wave 15 · CFO 10/10 (2026-04-23) — V6 stub. The full admin dashboard lands
 * in a future wave (see docs/finance/UNIT_ECONOMICS.md § "Observability
 * roadmap"). This file exists now because:
 *
 *   1. Cost lines show up in user-facing code right away (supabase .select,
 *      .insert calls, image uploads), so wrapping them in cheap counters
 *      avoids a messy retrofit later.
 *   2. Sentry + our structured logger already accept arbitrary JSON, so we
 *      can fan-out these metrics with zero net new infra.
 *
 * Usage:
 *   import { infraMetrics } from "@/lib/infra-metrics";
 *   infraMetrics.trackSupabaseRead(1, { table: "profiles" });
 *   infraMetrics.trackBandwidth(payloadBytes, { endpoint: "/api/swipe" });
 *
 * Periodically (on visibility change, at sign-out) we flush the aggregated
 * session counts via `flush()` which the logger forwards to Sentry breadcrumbs
 * and the console in development.
 */

import { logger } from "@/lib/logger";

type MetricKind =
  | "supabase_read"
  | "supabase_write"
  | "bandwidth_bytes"
  | "edge_function_call"
  | "storage_upload_bytes"
  | "stripe_call";

interface MetricContext {
  table?: string;
  endpoint?: string;
  bucket?: string;
  [key: string]: unknown;
}

interface Aggregate {
  kind: MetricKind;
  count: number;
  totalBytes: number;
  lastContext?: MetricContext;
  firstSeenAt: number;
}

// In-memory store per session. Deliberately simple — flushed on visibility
// change, max size caps memory usage if the user keeps the tab open forever.
const SESSION_CAP = 500;

class InfraMetrics {
  private aggregates = new Map<string, Aggregate>();
  private flushScheduled = false;

  private key(kind: MetricKind, ctx?: MetricContext): string {
    if (!ctx) return kind;
    const scope = ctx.table ?? ctx.endpoint ?? ctx.bucket ?? "default";
    return `${kind}:${scope}`;
  }

  private record(
    kind: MetricKind,
    delta: { count?: number; bytes?: number },
    ctx?: MetricContext,
  ): void {
    if (typeof window === "undefined" && kind !== "stripe_call" && kind !== "edge_function_call") {
      // Server-side metrics are already logged via the route handlers themselves;
      // avoid double-counting by only tracking client-side for DB calls.
      return;
    }

    if (this.aggregates.size >= SESSION_CAP) {
      this.flush();
    }

    const k = this.key(kind, ctx);
    const existing = this.aggregates.get(k);
    if (existing) {
      existing.count += delta.count ?? 0;
      existing.totalBytes += delta.bytes ?? 0;
      existing.lastContext = ctx;
    } else {
      this.aggregates.set(k, {
        kind,
        count: delta.count ?? 0,
        totalBytes: delta.bytes ?? 0,
        lastContext: ctx,
        firstSeenAt: Date.now(),
      });
    }

    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    if (typeof window === "undefined") return;
    this.flushScheduled = true;

    // Debounce: wait for 30s of quiet or for tab unload, whichever comes first.
    const timer = window.setTimeout(() => {
      this.flush();
    }, 30_000);

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        window.clearTimeout(timer);
        this.flush();
      }
    };
    document.addEventListener("visibilitychange", onHide, { once: true });
  }

  trackSupabaseRead(count = 1, ctx?: MetricContext): void {
    this.record("supabase_read", { count }, ctx);
  }

  trackSupabaseWrite(count = 1, ctx?: MetricContext): void {
    this.record("supabase_write", { count }, ctx);
  }

  trackBandwidth(bytes: number, ctx?: MetricContext): void {
    if (!Number.isFinite(bytes) || bytes <= 0) return;
    this.record("bandwidth_bytes", { bytes }, ctx);
  }

  trackStorageUpload(bytes: number, ctx?: MetricContext): void {
    if (!Number.isFinite(bytes) || bytes <= 0) return;
    this.record("storage_upload_bytes", { bytes }, ctx);
  }

  trackEdgeFunctionCall(name: string): void {
    this.record("edge_function_call", { count: 1 }, { endpoint: name });
  }

  trackStripeCall(kind: string): void {
    this.record("stripe_call", { count: 1 }, { endpoint: kind });
  }

  snapshot(): Array<Aggregate & { key: string }> {
    return Array.from(this.aggregates.entries()).map(([key, agg]) => ({
      key,
      ...agg,
    }));
  }

  flush(): void {
    if (this.aggregates.size === 0) {
      this.flushScheduled = false;
      return;
    }

    const payload = this.snapshot();
    this.aggregates.clear();
    this.flushScheduled = false;

    logger.info("infra_metrics_flush", { count: payload.length, aggregates: payload });
  }

  reset(): void {
    this.aggregates.clear();
    this.flushScheduled = false;
  }
}

export const infraMetrics = new InfraMetrics();

// ---------------------------------------------------------------------------
// Cost model — Euro per unit. Kept co-located with the tracker so the admin
// dashboard can multiply snapshot counts without re-reading a spreadsheet.
// Numbers sourced from docs/finance/COST_PROJECTION.md (2026-04-23).
// ---------------------------------------------------------------------------

export const INFRA_COST_MODEL_EUR = {
  // Supabase Pro includes 5M reads and 500k writes per month. Overage billed
  // per additional 500k reads / 100k writes. We track them separately so the
  // dashboard can show "reads remaining before overage".
  supabasePro: { baseMonthly: 25, readPerMillion: 5, writePerMillion: 10 },
  // Vercel Pro Function Invocations: 1 000 000 included, 0.60$/M after.
  vercelPro: { baseMonthly: 20, fnInvocationsPerMillion: 0.55 },
  // Upstash Redis: $0.20 per 100k commands.
  upstashPerHundredK: 0.2,
  // Sentry Team: $26/mo flat up to 50k errors, $0.80 per extra 1k errors.
  sentryTeamBase: 26,
  sentryOverPerK: 0.8,
  // Resend: $20/mo for 50k emails. 1€ per 1k extra.
  resendBase: 20,
  resendPerK: 1,
  // Stripe: 2.9% + 0.30€ per successful charge (EU cards).
  stripePctFee: 0.029,
  stripeFixedFee: 0.3,
  // Bandwidth: Supabase egress bills at ~$0.09/GB after the 250 GB included.
  bandwidthPerGB: 0.09,
} as const;

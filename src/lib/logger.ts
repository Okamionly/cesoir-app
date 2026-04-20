/**
 * Structured JSON logger — O4 observability (Wave 12 2026-04-20).
 *
 * Emits JSON to stdout/stderr so Vercel log drains + any downstream
 * ingestor (Sentry, Logtail, Axiom) can parse reliably. Forwards
 * errors to Sentry when a DSN is configured (browser + server).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("user_signed_in", { userId });
 *   logger.error("stripe_webhook_failed", { err: String(e), eventId });
 *
 * Design:
 * - No PII: redacts `email`, `password`, `token`, `authorization`,
 *   `passwordHash`, `stripe_customer_id` from payloads.
 * - Debug/info silent in production; warn/error always emitted.
 * - Sentry import is dynamic so the package is only pulled when a DSN
 *   exists — keeps cold-start light in dev.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  "email",
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "api_key",
  "apiKey",
  "secret",
  "stripe_customer_id",
]);

function redact(ctx?: LogContext): LogContext | undefined {
  if (!ctx) return undefined;
  const clean: LogContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (SENSITIVE_KEYS.has(k)) {
      clean[k] = "[redacted]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      clean[k] = redact(v as LogContext);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function sentryEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  );
}

function log(level: LogLevel, msg: string, ctx?: LogContext): void {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV,
    runtime: typeof window === "undefined" ? "server" : "client",
    ...redact(ctx),
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
    if (sentryEnabled()) {
      // Dynamic import keeps bundle slim when Sentry is not configured.
      import("@sentry/nextjs")
        .then((S) => {
          S.captureException(new Error(msg), { extra: ctx });
        })
        .catch(() => {
          // Sentry load failed — already logged to stderr, nothing else to do.
        });
    }
    return;
  }

  if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
    if (sentryEnabled()) {
      import("@sentry/nextjs")
        .then((S) => {
          S.captureMessage(msg, { level: "warning", extra: ctx });
        })
        .catch(() => {});
    }
    return;
  }

  // debug + info are dev-only to keep production log spend down.
  if (process.env.NODE_ENV !== "production") {
    if (level === "info") {
      // eslint-disable-next-line no-console
      console.info(line);
    } else {
      // eslint-disable-next-line no-console
      console.debug(line);
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => log("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
};

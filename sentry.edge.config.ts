/**
 * Sentry Edge runtime init — O4 observability (Wave 12).
 *
 * Loaded by `instrumentation.ts` when NEXT_RUNTIME === "edge".
 * No-op when DSN missing. Lighter config because the edge runtime
 * has no access to server-side Node APIs.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

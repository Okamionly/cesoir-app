/**
 * Sentry browser SDK init — O4 observability (Wave 12).
 *
 * Conditional: if `NEXT_PUBLIC_SENTRY_DSN` is not set, Sentry is a no-op
 * so dev/CI without a DSN works. Enable in prod by adding the env var
 * to Vercel. See README section "Observability / Sentry".
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    // 10% traces by default — dial up in Sentry if needed.
    tracesSampleRate: 0.1,
    // Session replay is opt-in via `NEXT_PUBLIC_SENTRY_REPLAY=1`.
    replaysSessionSampleRate:
      process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1" ? 0.1 : 0,
    replaysOnErrorSampleRate:
      process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1" ? 1.0 : 0,
    // Redact PII that somehow ends up in breadcrumbs.
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user?.email) event.user.email = "[redacted]";
      return event;
    },
  });
}

/**
 * Sentry Node runtime init — O4 observability (Wave 12).
 *
 * Loaded by `instrumentation.ts` when NEXT_RUNTIME === "nodejs".
 * No-op when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` absent.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Strip PII from server-side events before transport.
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      if (event.user?.email) event.user.email = "[redacted]";
      return event;
    },
  });
}

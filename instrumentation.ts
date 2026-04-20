/**
 * Next.js 16 server instrumentation hook.
 *
 * Called once per server instance. Branches on NEXT_RUNTIME so edge
 * workers don't try to load Node-only Sentry transports.
 * Sentry itself no-ops when DSN env vars are absent (see sentry.*.config.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Re-export Sentry's request error hook. Harmless if Sentry isn't
// initialized — the function checks its own init state.
export { captureRequestError as onRequestError } from "@sentry/nextjs";

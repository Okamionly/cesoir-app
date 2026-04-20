/**
 * Next.js 16 client instrumentation hook — runs pre-hydration.
 * Delegates to sentry.client.config.ts (conditional on DSN env var).
 */
import "./sentry.client.config";

// Next.js 16 picks this up to track SPA navigations in Sentry.
export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";

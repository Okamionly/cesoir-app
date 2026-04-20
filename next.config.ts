import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "ycyxmvzilzkusecpgvbi.supabase.co" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "geolocation=(self), camera=(self)" },
      ],
    }];
  },
};

// Sentry wrapping — all flags no-op if SENTRY_DSN / org / project aren't
// set, so dev builds without a Sentry account don't fail.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Tree-shake Sentry SDK code paths we don't use, keeps bundle small.
  disableLogger: true,
  // Upload source maps only when an auth token is present (prod CI).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Route browser SDK requests through our own domain to dodge ad-blockers
  // in production; only enabled when a DSN is configured.
  tunnelRoute: process.env.NEXT_PUBLIC_SENTRY_DSN ? "/monitoring" : undefined,
});

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Content-Security-Policy — tight default-src with explicit allowlists
 * for every outbound origin the app actually calls.
 *
 *   connect-src  : Supabase REST/Realtime (wss), Upstash Redis (rate-limit),
 *                  Sentry ingest (tunneled under /monitoring but also
 *                  direct during instrumentation bootstrap), image CDNs.
 *   img-src      : Unsplash (feed / event covers), DiceBear + ui-avatars
 *                  (fallback avatars), Supabase Storage (user avatars).
 *   script-src   : Next.js inlines runtime hydration scripts, so
 *                  'unsafe-inline' + 'unsafe-eval' are required until
 *                  strict CSP with nonces is wired (future Wave).
 *   style-src    : Tailwind injects inline styles for arbitrary values.
 *   font-src     : data: URIs only (no external CDN fonts).
 *
 * Keep this string on ONE line per directive — Next.js concatenates
 * directives with semicolons as-is and extra whitespace can confuse
 * some CDN / WAF parsers.
 */
const CSP = [
  "default-src 'self'",
  "connect-src 'self' https://*.supabase.co https://*.upstash.io https://*.ingest.sentry.io https://images.unsplash.com https://ui-avatars.com https://api.dicebear.com wss://*.supabase.co",
  "img-src 'self' data: blob: https://images.unsplash.com https://ui-avatars.com https://api.dicebear.com https://*.supabase.co https://randomuser.me https://i.pravatar.cc",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

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
        { key: "Content-Security-Policy", value: CSP },
        // 2 years, includeSubDomains, preload — matches hstspreload.org
        // requirements. Once we submit to the preload list, rolling this
        // back requires a manual removal from Chromium's source tree.
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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

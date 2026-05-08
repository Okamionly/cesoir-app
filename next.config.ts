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
// 2026-04-24 (dev-mode regression fix): React in development mode uses
// `eval()` to reconstruct stack traces from sourcemaps (see the React
// dev error: "React requires eval() in development mode for various
// debugging features"). The production bundle never calls eval, so we
// keep the hardened prod CSP but re-enable 'unsafe-eval' during
// `next dev` only. This preserves the SEC-005 hardening for real users
// while unblocking local development.
const IS_DEV = process.env.NODE_ENV !== "production";
const SCRIPT_SRC = IS_DEV
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const CSP = [
  "default-src 'self'",
  // cartocdn.com is MapLibre's default basemap host (used in /map).
  // basemaps.cartocdn.com serves style JSON, {a-d}.basemaps.cartocdn.com serve tiles.
  // Adding it back here — the 2026-04-24 patrol caught /map going fully blank
  // because the glowup CSP tightening dropped it silently.
  "connect-src 'self' https://*.supabase.co https://*.upstash.io https://*.ingest.sentry.io https://images.unsplash.com https://ui-avatars.com https://api.dicebear.com https://*.cartocdn.com https://*.basemaps.cartocdn.com wss://*.supabase.co",
  "img-src 'self' data: blob: https://images.unsplash.com https://ui-avatars.com https://api.dicebear.com https://*.supabase.co https://randomuser.me https://i.pravatar.cc https://*.cartocdn.com https://*.basemaps.cartocdn.com",
  // 2026-04-24 (SEC-005): dropped 'unsafe-eval' in production. Not required
  // by Next 16 prod builds — the React runtime no longer uses eval(). Kept
  // 'unsafe-inline' because Next still ships an inline script for initial
  // state hydration (`__NEXT_DATA__` bootstrap). In dev mode we re-allow
  // 'unsafe-eval' because React needs it for source-map stack reconstruction
  // (see IS_DEV branch above).
  SCRIPT_SRC,
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
  // FIX H (perf-ml-001): exclude heavy ML packages from SSR bundles.
  // nsfwjs (~700 KB) + @tensorflow/tfjs (~2.3 MB) + @vladmandic/face-api
  // (~1 MB) are browser-only — they use WebGL / WASM / tf.ENV.  They must
  // never be bundled for Node.js server rendering or included in the initial
  // JS that Next.js traces for the Edge runtime.  The actual code that imports
  // them (`@/lib/nsfw`, `SelfieVerification`) already uses `await import()`
  // so the browser receives them as separate async chunks — this config just
  // prevents webpack from pulling them into the SSR bundle as a side-effect.
  serverExternalPackages: ["@tensorflow/tfjs", "nsfwjs", "@vladmandic/face-api"],
  // typedRoutes: true,
  //   ↑ Deferred. Next 16's <Link> type is already narrow via RouteImpl<>
  //   (see .next/types/routes.d.ts when present), so enabling typedRoutes
  //   here would generate the same file during `next build` and surface 13
  //   existing dynamic-href sites (`/profile/${id}`, component `href` props
  //   typed as `string`, etc.). Each needs either `satisfies Route` on the
  //   source, `as Route` at the call site, or threading `Route` through
  //   component props. This PR already killed the one real dead-route
  //   (/mood-match → /modes in `src/lib/fab-actions.ts`). Migration PR
  //   will land separately with all call sites fixed.

  experimental: {
    // Persist Turbopack's dep graph + transform cache to `.next/cache/turbo`
    // between `next dev` sessions. Shaves 2-5× off cold starts on our
    // 378-file TS codebase. Stable for dev in Next 16; build variant is
    // still marked experimental (we don't enable it for CI).
    turbopackFileSystemCacheForDev: true,
  },

  images: {
    // Next 16 REQUIRES an explicit qualities allowlist — unrestricted access
    // would let attackers request arbitrary qualities and blow up our
    // on-demand optimization budget. Default is 75 so it must be in the list.
    // 50 = feed thumbnails, 75 = avatars/defaults, 85 = full-size profile.
    qualities: [50, 75, 85],

    // AVIF first (~30% smaller than WebP on photo feeds), WebP fallback
    // for Safari < 16 / Firefox older. Browser picks via Accept header.
    formats: ["image/avif", "image/webp"],

    // 1 year — our avatars are content-addressed (user uploads get a new
    // Supabase Storage path) so the optimized cache can live forever.
    minimumCacheTTL: 31536000,

    // Remote hosts whitelisted for next/image optimization.
    // Must match CSP `img-src` above. Every hostname referenced by seed
    // avatars (migrations 013/014/015) or event flyers (migration 020)
    // must be listed here or next/image throws an ErrorBoundary at
    // render time (see 2026-04-24 bug report on /profile).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
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
        // Broad deny list per OWASP 2026 recommendation (SEC-016). Only the
        // 2 permissions we actually use — geolocation (map, proximity) and
        // camera (selfie verification) — are granted to the origin itself.
        // Everything else is shut off so a compromised page script can't ask
        // for microphone / payment / USB / bluetooth / etc.
        {
          key: "Permissions-Policy",
          value:
            "geolocation=(self), camera=(self), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), midi=(), fullscreen=(self), display-capture=(), publickey-credentials-get=()",
        },
      ],
    }];
  },
};

// Sentry wrapping — all flags no-op if SENTRY_DSN / org / project aren't
// set, so dev builds without a Sentry account don't fail.
//
// 2026-04-27: removed `disableLogger: true` — deprecated in @sentry/nextjs
// and not supported with Turbopack. The replacement is webpack
// `treeshake.removeDebugLogging`, but that only applies to Webpack builds.
// In Turbopack dev (Next 16 default), the logger tree-shaking happens
// automatically when NODE_ENV === 'production'. Net effect: dev keeps the
// helpful Sentry SDK logs, prod still strips them via the build-time
// minifier. No change to bundle size in production.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Upload source maps only when an auth token is present (prod CI).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Route browser SDK requests through our own domain to dodge ad-blockers
  // in production; only enabled when a DSN is configured.
  tunnelRoute: process.env.NEXT_PUBLIC_SENTRY_DSN ? "/monitoring" : undefined,
});

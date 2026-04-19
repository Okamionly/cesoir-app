import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly middleware).
 *
 * Auth gate for protected routes + redirect logged-in users away from
 * /login or /register. Refreshes Supabase SSR session tokens on every
 * request via getUser().
 *
 * Migrated from src/middleware.ts on 2026-04-19 (Next 16 deprecation).
 */

/**
 * Routes that require an authenticated user.
 *
 * QA 2026-04-19 caught: /safety was unprotected (SOS, trusted contacts) — major leak.
 * Strategy: protect by EXCLUSION. Anything not in publicRoutes is gated.
 * `publicRoutes` list is the authoritative whitelist.
 */
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/about",
  "/cgu",
  "/privacy",
  "/why-free",
  "/auth/callback",
  // Static assets at root that browsers fetch regardless of auth state
  "/manifest.json",
  "/manifest.webmanifest",
  "/sw.js",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

/** Path prefixes that are public (e.g. /p/<id> public profile, /invite/<code>). */
const publicPrefixes = ["/p/", "/invite/", "/api/", "/_next/", "/icons/"];

const authRoutes = ["/login", "/register"];

function isPublicPath(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // M4 — In production, missing env vars are a fatal misconfiguration:
  // returning early would leave protected routes open. Crash visibly so
  // ops sees the error in Vercel logs.
  // In dev, we log + fall through so a fresh clone with missing .env.local
  // shows a useful error in the UI rather than 500ing every request.
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[proxy] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in production. " +
          "Check Vercel project env vars.",
      );
    }
    console.warn(
      "[proxy] Supabase env vars missing — auth gate skipped (dev only).",
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: always call getUser() to refresh session tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Anything not explicitly public is gated. Catches /safety, /notifications,
  // /achievements, /trust, /reviews, /soiree, /events, /rooms, /squad, etc.
  if (!isPublic && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/browse";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

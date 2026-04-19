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

const protectedRoutes = ["/browse", "/map", "/chat", "/modes", "/profile", "/app"];
const authRoutes = ["/login", "/register"];

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
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
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

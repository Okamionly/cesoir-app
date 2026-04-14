import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/browse", "/map", "/chat", "/modes", "/profile"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r));

  if (!isProtected && !isAuthRoute) return NextResponse.next();

  // Check for Supabase session via cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return NextResponse.next();

  // Look for auth token in cookies
  const authCookie = request.cookies.getAll().find(c =>
    c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  const hasSession = !!authCookie?.value;

  // Protected route without session → redirect to login
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Auth route with session → redirect to browse
  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/browse";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/browse/:path*",
    "/map/:path*",
    "/chat/:path*",
    "/modes/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};

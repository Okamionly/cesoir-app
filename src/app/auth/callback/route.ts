import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth callback for Supabase Auth.
 *
 * B6 — `next` is user-controlled. Even if the current `${origin}${next}`
 * concat protects against classic open redirect (//evil.com resolves
 * same-origin), we still whitelist to avoid future regressions.
 */
function safeNext(raw: string | null): string {
  const fallback = "/browse";
  if (!raw) return fallback;
  // Must be a single relative path: starts with /, no protocol-relative //
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  // Block backslash tricks some browsers normalize to /
  if (raw.includes("\\")) return fallback;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed → back to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { m } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { landing } from "@/lib/design-tokens";
import { easings } from "@/lib/motion-design";
import { Eye, EyeOff, Loader2 } from "@/components/ui/lucide";
import {
  FormField,
  FormInput,
  FormSubmit,
  FormBanner,
} from "@/components/ui/forms";

const DEFAULT_POST_LOGIN = "/feed";

/**
 * Whitelist redirect targets to prevent open-redirect attacks.
 * Only accept same-origin pathnames: must start with "/", must not start
 * with "//" (protocol-relative), must not contain "://" (absolute URL),
 * and must not contain ".." (path traversal escape).
 */
function safeRedirectTarget(raw: string | null): string {
  if (!raw) return DEFAULT_POST_LOGIN;
  const candidate = raw.trim();
  if (!candidate.startsWith("/")) return DEFAULT_POST_LOGIN;
  if (candidate.startsWith("//")) return DEFAULT_POST_LOGIN;
  if (candidate.includes("://")) return DEFAULT_POST_LOGIN;
  if (candidate.includes("..")) return DEFAULT_POST_LOGIN;
  // Avoid bouncing back to auth pages (would loop)
  if (
    candidate === "/login" ||
    candidate.startsWith("/login?") ||
    candidate.startsWith("/login/") ||
    candidate === "/register" ||
    candidate.startsWith("/register?") ||
    candidate === "/signup-quick" ||
    candidate.startsWith("/signup-quick?")
  ) {
    return DEFAULT_POST_LOGIN;
  }
  return candidate;
}

function LoginPageInner() {
  const { signIn, error: authError } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      try {
        await signIn(email.trim().toLowerCase(), password);
      } catch {
        // Non-blocking — server cookie is what matters
      }

      // Honor middleware's ?redirectTo= so users land on the page they
      // originally requested before being bounced to /login.
      const target = safeRedirectTarget(searchParams?.get("redirectTo") ?? null);
      window.location.href = target;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
      setLoading(false);
    }
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ background: landing.bg, color: landing.fg }}
    >
      {/* Ambient gradient glow — landing signature */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full blur-3xl opacity-40"
        style={{ background: landing.gradient }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(139,92,246,0.35) 0, transparent 40%), radial-gradient(circle at 80% 90%, rgba(0,255,136,0.25) 0, transparent 45%)",
        }}
      />

      <m.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: easings.out }}
        className="relative w-full max-w-sm"
      >
        {/* Logo with breathing moon */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <m.span
            className="text-3xl drop-shadow-[0_0_18px_rgba(139,92,246,0.6)]"
            aria-hidden="true"
            style={{ color: landing.violet }}
            animate={{ rotate: [0, 6, 0, -6, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            ☾
          </m.span>
          <span className="font-display text-2xl font-bold tracking-tight">
            CeSoir
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-center mb-2 tracking-tight">
          <span
            style={{
              backgroundImage: landing.gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Content(e) de te revoir
          </span>
        </h1>
        <p className="text-sm text-white/60 text-center mb-10">
          Connecte-toi pour voir qui est dispo
        </p>

        <div className="mb-4">
          <FormBanner tone="error" variant="dark">
            {error || authError || null}
          </FormBanner>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Email" variant="dark" required>
            <FormInput
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              variant="dark"
              size="lg"
              error={Boolean(error)}
            />
          </FormField>

          <FormField label="Mot de passe" variant="dark" required>
            <div className="relative">
              <FormInput
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                variant="dark"
                size="lg"
                error={Boolean(error)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-lg text-white/60 hover:text-white/90 transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={20} aria-hidden="true" />
                ) : (
                  <Eye size={20} aria-hidden="true" />
                )}
              </button>
            </div>
          </FormField>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium tap-target inline-block py-1 transition-opacity hover:opacity-80"
              style={{ color: landing.violet }}
            >
              Mot de passe oublie ?
            </Link>
          </div>

          <FormSubmit
            isLoading={loading}
            loadingLabel="Connexion..."
            hasError={Boolean(error)}
            variant="dark"
          >
            Se connecter
          </FormSubmit>
        </form>

        <p className="text-sm text-white/60 text-center mt-8">
          Pas encore inscrit ?{" "}
          <Link
            href="/signup-quick"
            className="font-semibold transition-opacity hover:opacity-80 tap-target inline-flex items-center justify-center"
            style={{ color: landing.vert }}
          >
            Créer un compte
          </Link>
        </p>
      </m.div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <Loader2
        size={28}
        strokeWidth={1.8}
        className="animate-spin text-accent"
        aria-label="Chargement"
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageInner />
    </Suspense>
  );
}

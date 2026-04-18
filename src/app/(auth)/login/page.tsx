"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { landing } from "@/lib/design-tokens";
import { springs, easings } from "@/lib/motion-design";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      window.location.href = "/feed";
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

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: easings.out }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span
            className="text-3xl"
            aria-hidden="true"
            style={{ color: landing.violet }}
          >
            ☾
          </span>
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

        {(error || authError) && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.snap}
            className="border text-[13px] px-4 py-3 rounded-xl mb-4"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.25)",
              color: "#FCA5A5",
            }}
          >
            {error || authError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="login-email"
              className="block text-[11px] font-semibold mb-1.5 tracking-wide uppercase text-white/50"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="ton@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-xl text-sm placeholder:text-white/30 focus:outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: landing.fg,
              }}
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-[11px] font-semibold mb-1.5 tracking-wide uppercase text-white/50"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-xl text-sm placeholder:text-white/30 focus:outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: landing.fg,
              }}
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium tap-target inline-block py-1 transition-opacity hover:opacity-80"
              style={{ color: landing.violet }}
            >
              Mot de passe oublie ?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snap}
            className="w-full font-semibold py-3.5 rounded-full text-sm text-white disabled:opacity-50 tap-target"
            style={{
              background: landing.gradient,
              boxShadow: landing.shadow,
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </motion.button>
        </form>

        <p className="text-sm text-white/60 text-center mt-8">
          Pas encore inscrit ?{" "}
          <Link
            href="/register"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: landing.vert }}
          >
            Creer un compte
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

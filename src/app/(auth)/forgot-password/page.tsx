"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 2026-04-24 patrol #7 (SEC-006): route through the server wrapper
    // instead of calling supabase.auth directly. The wrapper rate-limits
    // to 3 / 15min / (IP + email) — prevents email-bomb + enumeration.
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });
      if (res.status === 429) {
        setError("Trop de tentatives. Réessaie dans quelques minutes.");
      } else if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Impossible d'envoyer l'email");
      } else {
        setSent(true);
      }
    } catch {
      setError("Impossible d'envoyer l'email. Vérifie ta connexion.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl text-accent" aria-hidden="true">☾</span>
          <span className="text-xl font-bold">CeSoir</span>
        </div>

        {sent ? (
          <div className="text-center animate-fade-up">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-xl font-bold mb-2">Email envoye</h1>
            <p className="text-sm text-text-muted mb-6">
              Verifie ta boite mail ({email}) pour reinitialiser ton mot de passe.
            </p>
            <Link href="/login" className="text-accent font-semibold text-sm">
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-center mb-1">Mot de passe oublie ?</h1>
            <p className="text-sm text-text-muted text-center mb-8">
              Entre ton email et on t&apos;envoie un lien de reinitialisation.
            </p>

            {error && (
              <div role="alert" className="bg-danger/10 border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-[11px] font-semibold text-text-muted mb-1">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="ton@email.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm active:scale-[0.98] transition-transform disabled:opacity-50 tap-target"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>

            <p className="text-sm text-text-muted text-center mt-6">
              <Link href="/login" className="text-accent font-semibold">Retour a la connexion</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

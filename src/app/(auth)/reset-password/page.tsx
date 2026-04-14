"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the access_token in the URL hash after email link click
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      setReady(true);
    }

    // Also handle the SIGNED_IN event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
    } else {
      setDone(true);
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

        {done ? (
          <div className="text-center animate-fade-up">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold mb-2">Mot de passe modifie</h1>
            <p className="text-sm text-text-muted mb-6">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
            <Link href="/login" className="gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm inline-block">
              Se connecter
            </Link>
          </div>
        ) : !ready ? (
          <div className="text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
            <p className="text-sm text-text-muted mb-6">Ce lien de reinitialisation est expire ou invalide. Demande un nouveau lien.</p>
            <Link href="/forgot-password" className="text-accent font-semibold text-sm">
              Nouveau lien →
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-center mb-1">Nouveau mot de passe</h1>
            <p className="text-sm text-text-muted text-center mb-8">Choisis un mot de passe solide.</p>

            {error && (
              <div role="alert" className="bg-danger/10 border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-pass" className="block text-[11px] font-semibold text-text-muted mb-1">Nouveau mot de passe</label>
                <input id="new-pass" type="password" placeholder="Min. 6 caracteres" required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                  className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
              </div>
              <div>
                <label htmlFor="confirm-pass" className="block text-[11px] font-semibold text-text-muted mb-1">Confirmer</label>
                <input id="confirm-pass" type="password" placeholder="Repete le mot de passe" required minLength={6}
                  value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                  className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm active:scale-[0.98] transition-transform disabled:opacity-50 tap-target">
                {loading ? "Modification..." : "Modifier le mot de passe"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

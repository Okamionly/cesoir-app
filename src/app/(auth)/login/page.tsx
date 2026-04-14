"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/browse"), 500);
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl text-accent" aria-hidden="true">☾</span>
          <span className="text-xl font-bold">CeSoir</span>
        </div>

        <h1 className="text-xl font-bold text-center mb-1">Content(e) de te revoir</h1>
        <p className="text-sm text-text-muted text-center mb-8">Connecte-toi pour voir qui est dispo</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-[11px] font-semibold text-text-muted mb-1">Email</label>
            <input id="login-email" type="email" placeholder="ton@email.com" required autoComplete="email" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-[11px] font-semibold text-text-muted mb-1">Mot de passe</label>
            <input id="login-password" type="password" placeholder="********" required autoComplete="current-password" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-[12px] text-accent font-medium tap-target inline-block py-1">Mot de passe oublie ?</Link>
          </div>

          <button type="submit" disabled={loading} className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm active:scale-[0.98] transition-transform disabled:opacity-50 tap-target">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Pas encore inscrit ? <Link href="/register" className="text-accent font-semibold">Creer un compte</Link>
        </p>
      </div>
    </main>
  );
}

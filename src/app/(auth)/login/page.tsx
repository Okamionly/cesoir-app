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
    // TODO: Supabase auth
    setTimeout(() => router.push("/browse"), 500);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl text-accent">☾</span>
          <span className="text-2xl font-extrabold">CeSoir</span>
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-1">Content de te revoir</h1>
        <p className="text-sm text-text-muted text-center mb-8">Connecte-toi pour voir qui est dispo</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Email</label>
            <input
              type="email"
              placeholder="ton@email.com"
              required
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Mot de passe</label>
            <input
              type="password"
              placeholder="********"
              required
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-base active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Pas encore inscrit ?{" "}
          <Link href="/register" className="text-accent font-semibold">
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

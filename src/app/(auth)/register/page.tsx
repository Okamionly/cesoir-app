"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MODES, MODE_KEYS } from "@/lib/modes";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  function toggleMode(key: string) {
    setSelectedModes((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: Supabase auth
    setTimeout(() => router.push("/browse"), 500);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl text-accent">☾</span>
          <span className="text-2xl font-extrabold">CeSoir</span>
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-1">Rejoins CeSoir</h1>
        <p className="text-sm text-text-muted text-center mb-6">En 30 secondes, tu es pret(e)</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Prenom</label>
              <input
                type="text"
                placeholder="Ton prenom"
                required
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">Age</label>
              <input
                type="number"
                min={18}
                max={99}
                placeholder="25"
                required
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

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
              placeholder="Min. 6 caracteres"
              minLength={6}
              required
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Mode selection */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-2">Tes modes ce soir</label>
            <div className="grid grid-cols-3 gap-2">
              {MODE_KEYS.map((key) => {
                const mode = MODES[key];
                const active = selectedModes.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMode(key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all tap-target ${
                      active
                        ? "border-accent gradient-bg-subtle"
                        : "border-border bg-bg-card"
                    }`}
                  >
                    <span className="text-xl">{mode.icon}</span>
                    <span className={`text-[10px] font-medium ${active ? "text-accent" : "text-text-muted"}`}>
                      {mode.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Decris ta soiree ideale</label>
            <textarea
              rows={2}
              placeholder="Ex: Un bon sushi avec quelqu'un de cool"
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-base active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? "Creation..." : "C'est parti !"}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Deja inscrit ?{" "}
          <Link href="/login" className="text-accent font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

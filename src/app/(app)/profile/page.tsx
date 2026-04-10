"use client";

import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-accent">☾</span>
          <h1 className="text-xl font-extrabold">Mon Profil</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Avatar + name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-3xl font-bold text-white mb-3">
            Y
          </div>
          <h2 className="text-xl font-extrabold">Youssef, 28</h2>
          <p className="text-sm text-text-muted">Paris, France</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-safe shadow-[0_0_6px_#22c55e]" />
            <span className="text-xs text-safe font-semibold">Dispo ce soir</span>
          </div>
        </div>

        {/* Active modes */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Modes actifs</h3>
          <div className="flex flex-wrap gap-2">
            <span className="gradient-bg-subtle border border-accent/20 px-3 py-1.5 rounded-full text-xs font-medium text-accent">🍽️ Solo Diner</span>
            <span className="gradient-bg-subtle border border-accent/20 px-3 py-1.5 rounded-full text-xs font-medium text-accent">🌐 Langue Exchange</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xl font-extrabold gradient-text">12</p>
            <p className="text-[10px] text-text-muted">Rencontres</p>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xl font-extrabold gradient-text">4.9</p>
            <p className="text-[10px] text-text-muted">Note</p>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xl font-extrabold gradient-text">3</p>
            <p className="text-[10px] text-text-muted">Modes</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-1">
          {[
            { label: "Modifier mon profil", icon: "✏️" },
            { label: "Mes preferences", icon: "⚙️" },
            { label: "Verification du profil", icon: "✅" },
            { label: "Securite", icon: "🔒" },
            { label: "A propos de CeSoir", icon: "☾" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-bg-card transition-colors tap-target"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <Link
          href="/"
          className="block w-full text-center text-sm text-danger font-semibold mt-8 py-3"
        >
          Se deconnecter
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { MODES } from "@/lib/modes";

const activeModes = ["solo-diner", "langue", "dog-date"] as const;
const stats = [
  { label: "Rencontres", value: "12", icon: "🤝" },
  { label: "Note", value: "4.9", icon: "⭐" },
  { label: "Matchs", value: "28", icon: "♥" },
  { label: "Ce mois", value: "5", icon: "📅" },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="relative h-44 overflow-hidden bg-bg-card">
        <div className="absolute inset-0 gradient-bg opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg" />
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <span className="text-lg text-accent" aria-hidden="true">☾</span>
          <span className="text-base font-bold">Mon Profil</span>
        </div>
        <button aria-label="Parametres" className="absolute top-3 right-4 w-9 h-9 rounded-full bg-bg border border-border flex items-center justify-center text-sm tap-target">
          ⚙️
        </button>
      </div>

      {/* Avatar */}
      <div className="relative -mt-14 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center text-3xl font-black text-white ring-4 ring-bg shadow-glow">
          Y
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <span className="w-2.5 h-2.5 rounded-full bg-safe" aria-hidden="true" />
          <span className="text-xs text-safe font-semibold">Dispo ce soir</span>
        </div>
        <h1 className="text-2xl font-black mt-2 text-text">Youssef, 28</h1>
        <p className="text-sm text-text-muted">📍 Paris, France</p>
        <div className="flex items-center gap-1.5 mt-2 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
          <span className="text-xs" aria-hidden="true">✅</span>
          <span className="text-[11px] text-accent font-semibold">Profil verifie</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-card border border-border rounded-2xl p-3 text-center">
            <span className="text-lg" aria-hidden="true">{s.icon}</span>
            <p className="text-xl font-black gradient-text mt-1">{s.value}</p>
            <p className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active modes */}
      <div className="px-4 mt-6">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3">Modes actifs ce soir</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {activeModes.map((key) => {
            const mode = MODES[key];
            return (
              <div key={key} className="shrink-0 flex items-center gap-2 bg-bg-card border border-accent/20 rounded-2xl px-4 py-3">
                <span className="text-xl" aria-hidden="true">{mode.icon}</span>
                <div>
                  <p className="text-sm font-bold text-text">{mode.name}</p>
                  <p className="text-[10px] text-text-muted">Actif</p>
                </div>
              </div>
            );
          })}
          <button className="shrink-0 flex items-center gap-2 border border-dashed border-border rounded-2xl px-4 py-3 text-text-muted tap-target" aria-label="Ajouter un mode">
            <span className="text-xl" aria-hidden="true">+</span>
            <span className="text-sm font-medium">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Bio */}
      <div className="px-4 mt-6">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-2">Bio</p>
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-text-soft leading-relaxed">
            Curieux de tout, toujours partant pour decouvrir un nouveau resto ou pratiquer une langue. Mon chien Rex est mon meilleur wingman 🐶
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6 mb-4">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-2">Parametres</p>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[
            { label: "Modifier mon profil", icon: "✏️" },
            { label: "Preferences de recherche", icon: "🎯" },
            { label: "Notifications", icon: "🔔" },
            { label: "Securite & confidentialite", icon: "🔒" },
            { label: "Obtenir le badge verifie", icon: "✅", accent: true },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-border/30 transition-colors tap-target">
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">{item.icon}</span>
                <span className={`text-sm font-medium ${"accent" in item ? "text-accent" : "text-text"}`}>{item.label}</span>
              </div>
              <span className="text-text-muted text-sm" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-24">
        <Link href="/" className="block w-full text-center text-sm text-danger font-semibold py-3 bg-danger/5 border border-danger/10 rounded-2xl tap-target">
          Se deconnecter
        </Link>
      </div>
    </div>
  );
}

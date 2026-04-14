"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { MODES } from "@/lib/modes";
import { MODE_ICONS, IconStar } from "@/components/ui/Icons";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/app/PhotoUpload";

const activeModes = ["solo-diner", "langue", "dog-date"] as const;

const prompts = [
  { question: "Mon restaurant prefere a Paris...", answer: "Un petit izakaya cache dans le 11e. Je te montre si tu viens." },
  { question: "La derniere chose qui m'a fait rire...", answer: "Mon chien Rex qui essaie de voler un croissant a une terrasse." },
  { question: "Ce soir, j'ai envie de...", answer: "Decouvrir un endroit que je connais pas avec quelqu'un que je connais pas encore." },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Youssef");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        if (data?.name) setProfileName(data.name);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Photo header */}
      <div className="relative h-72 overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-30" aria-hidden="true" />
        ) : (
          <div className="absolute inset-0 gradient-bg opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 z-10">
          <h1 className="text-[16px] font-black text-text tracking-tight">Mon Profil</h1>
          <Link href="/modes" className="w-9 h-9 rounded-full bg-bg/80 backdrop-blur border border-border flex items-center justify-center tap-target">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4m-7.78-2.22l2.83-2.83m9.9-9.9l2.83-2.83M1 12h4m14 0h4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Avatar + info — overlapping the header */}
      <div className="relative -mt-20 px-5">
        <div className="flex items-end gap-4">
          {user ? (
            <PhotoUpload
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              onUploadComplete={(url) => setAvatarUrl(url)}
              variant="compact"
              fallbackLetter={profileName.charAt(0).toUpperCase()}
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl gradient-bg p-[3px] shadow-glow shrink-0">
              <div className="w-full h-full rounded-[13px] bg-bg flex items-center justify-center text-[36px] font-black text-accent">
                {profileName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[24px] font-black tracking-tight text-text">{profileName}</h2>
              <span className="text-[14px] text-text-muted font-light">28</span>
            </div>
            <p className="text-[13px] text-text-muted">Paris, France</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-safe" />
              <span className="text-[11px] text-safe font-semibold">Dispo ce soir</span>
            </div>
          </div>
        </div>

        {/* Verification + reliability */}
        <div className="flex gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-accent/8 border border-accent/15 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M20 6L9 17l-5-5"/></svg>
            <span className="text-[11px] text-accent font-semibold">Verifie</span>
          </div>
          <div className="flex items-center gap-1.5 bg-safe/8 border border-safe/15 px-3 py-1.5 rounded-full">
            <IconStar size={12} className="text-safe" />
            <span className="text-[11px] text-safe font-semibold">4.9</span>
          </div>
        </div>
      </div>

      {/* Stats — clean horizontal */}
      <div className="flex gap-1 px-5 mt-5">
        {[
          { n: "12", l: "Rencontres" },
          { n: "28", l: "Matchs" },
          { n: "5", l: "Ce mois" },
        ].map(s => (
          <div key={s.l} className="flex-1 bg-bg-card border border-border rounded-xl py-3 text-center">
            <p className="text-[20px] font-black gradient-text">{s.n}</p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Prompts — Hinge style */}
      <div className="px-5 mt-6">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">A propos</p>
        <div className="space-y-3">
          {prompts.map((p, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors">
              <p className="text-[11px] text-accent font-bold uppercase tracking-wider mb-2">{p.question}</p>
              <p className="text-[14px] text-text leading-relaxed">{p.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active modes — with custom icons */}
      <div className="px-5 mt-6">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Modes actifs ce soir</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {activeModes.map((key) => {
            const mode = MODES[key];
            const Icon = MODE_ICONS[key];
            return (
              <div key={key} className="shrink-0 flex items-center gap-2.5 bg-bg-card border border-accent/15 rounded-2xl px-4 py-3">
                {Icon && <Icon size={20} className="text-accent" />}
                <div>
                  <p className="text-[13px] font-bold text-text">{mode.name}</p>
                  <p className="text-[10px] text-text-muted">Actif</p>
                </div>
              </div>
            );
          })}
          <button className="shrink-0 flex items-center gap-2 border border-dashed border-border rounded-2xl px-4 py-3 text-text-muted tap-target">
            <span className="text-[16px]">+</span>
            <span className="text-[12px] font-medium">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Settings — minimal */}
      <div className="px-5 mt-6 mb-4">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Parametres</p>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[
            { label: "Modifier mon profil", sub: "Photos, bio, prompts" },
            { label: "Preferences", sub: "Age, distance, genre" },
            { label: "Notifications", sub: "Matchs, messages, rappels" },
            { label: "Securite", sub: "Mot de passe, blocage, signalement" },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-border/20 transition-colors tap-target">
              <div>
                <span className="text-[13px] font-semibold text-text block">{item.label}</span>
                <span className="text-[10px] text-text-muted">{item.sub}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5 pb-24">
        <Link href="/" className="block w-full text-center text-[13px] text-danger font-semibold py-3 bg-danger/5 border border-danger/10 rounded-xl tap-target">
          Se deconnecter
        </Link>
      </div>
    </div>
  );
}

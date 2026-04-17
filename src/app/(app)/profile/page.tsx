"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const TONIGHT_CHIPS = ["Diner", "Boire un verre", "Cinema", "Balade", "Concert", "Sport"];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease, delay },
});

// ────────────────────────────────────────────────
// Inline icons — clean strokes, consistent size
// ────────────────────────────────────────────────
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Youssef");
  const [age, setAge] = useState<number>(28);

  const [selectedChips, setSelectedChips] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cesoir-tonight-chips");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("cesoir-tonight-chips", JSON.stringify(selectedChips));
  }, [selectedChips]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, name, age")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { avatar_url?: string; name?: string; age?: number } | null }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        if (data?.name) setProfileName(data.name);
        if (data?.age) setAge(data.age);
      });
  }, [user]);

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* ── HEADER ── */}
      <motion.header
        className="px-6 pt-7 pb-2 flex items-center justify-between"
        {...fade(0)}
      >
        <h1 className="text-[15px] font-semibold tracking-tight text-text">Profil</h1>
        <Link
          href="/settings"
          aria-label="Parametres"
          className="-mr-2 w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <SettingsIcon />
        </Link>
      </motion.header>

      {/* ── HERO ── Avatar + Name + Edit button ── */}
      <motion.section
        className="px-6 pt-8 pb-10 flex flex-col items-center text-center"
        {...fade(0.05)}
      >
        {/* Avatar with subtle gradient ring */}
        <div className="relative mb-6">
          <div
            className="w-32 h-32 rounded-full p-[3px]"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
          >
            <div className="w-full h-full rounded-full bg-bg overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Photo de ${profileName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-bg-card">
                  <span
                    className="text-[52px] font-bold tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {profileName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Online indicator */}
          <span
            className="absolute bottom-1.5 right-1.5 block w-4 h-4 rounded-full ring-[3px] ring-bg"
            style={{ background: "#00FF88" }}
            aria-label="En ligne ce soir"
          />
        </div>

        {/* Name */}
        <h2 className="text-[28px] font-bold tracking-tight text-text leading-none">
          {profileName}, <span className="font-normal text-text-muted">{age}</span>
        </h2>
        <p className="text-[13px] text-text-muted mt-2 tracking-wide">Paris, France</p>

        {/* Status pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border">
          <span className="block w-1.5 h-1.5 rounded-full" style={{ background: "#00FF88" }} aria-hidden="true" />
          <span className="text-[12px] font-medium text-text">Disponible ce soir</span>
        </div>

        {/* Edit profile — primary action button */}
        <Link
          href="/profile/edit"
          className="mt-7 inline-flex items-center justify-center px-7 py-3 rounded-full bg-text text-bg text-[14px] font-semibold tracking-tight hover:opacity-90 active:scale-[0.98] transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
        >
          Modifier le profil
        </Link>
      </motion.section>

      {/* ── INTENT: What do you want tonight? ── */}
      <motion.section
        className="px-6 mb-8"
        {...fade(0.1)}
        aria-labelledby="tonight-label"
      >
        <h3
          id="tonight-label"
          className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-3.5"
        >
          Mes envies ce soir
        </h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Selection des envies de ce soir">
          {TONIGHT_CHIPS.map(chip => {
            const on = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                aria-pressed={on}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none ${
                  on
                    ? "bg-text text-bg border border-text"
                    : "bg-bg-card text-text border border-border hover:border-text/30"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* ── ESSENTIALS ── 3 main destinations ── */}
      <motion.nav
        className="px-6 mb-8"
        {...fade(0.15)}
        aria-label="Navigation principale"
      >
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-3.5">
          Decouvrir
        </h3>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {[
            { label: "Recommandations", desc: "Profils selectionnes pour toi", href: "/pour-toi" },
            { label: "Soirees", desc: "Organiser ou rejoindre", href: "/soiree" },
            { label: "Confiance", desc: "Verification et securite", href: "/trust" },
          ].map((item, i, arr) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-bg transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset focus-visible:outline-none ${
                i < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold tracking-tight text-text">{item.label}</div>
                <div className="text-[12px] text-text-muted mt-0.5">{item.desc}</div>
              </div>
              <span className="text-text-muted shrink-0"><ChevronRight /></span>
            </Link>
          ))}
        </div>
      </motion.nav>

      {/* ── SETTINGS ── */}
      <motion.div
        className="px-6 mb-8"
        {...fade(0.2)}
      >
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-3.5">
          Reglages
        </h3>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {[
            { label: "Notifications", href: "/profile/notifications" },
            { label: "Confidentialite", href: "/profile/privacy" },
            { label: "Verification du compte", href: "/profile/verify" },
            { label: "A propos", href: "/about" },
          ].map((item, i, arr) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-5 py-3.5 hover:bg-bg transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset focus-visible:outline-none ${
                i < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-[14px] text-text">{item.label}</span>
              <span className="text-text-muted"><ChevronRight /></span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── LOGOUT ── */}
      <motion.div
        className="px-6"
        {...fade(0.25)}
      >
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-bg-card border border-border text-[14px] font-medium text-text-muted hover:text-text hover:border-text/20 transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
        >
          Se deconnecter
        </button>
      </motion.div>
    </div>
  );
}

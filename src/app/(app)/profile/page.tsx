"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/app/PhotoUpload";
import AudioIntro from "@/components/app/AudioIntro";

const TONIGHT_CHIPS = ["Diner", "Boire un verre", "Cinema", "Balade", "Concert", "Jeux", "Cuisiner", "Sport"];
const MOOD_EMOJIS = ["😊", "🔥", "🥂", "🌙", "💜", "🎉", "😴", "🤔"];

/* Subtle fade + slight rise — calm, uniform entrance */
const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease, delay },
});

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Youssef");

  // Ce soir state
  const [selectedChips, setSelectedChips] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cesoir-tonight-chips");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [moodEmoji, setMoodEmoji] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("cesoir-mood-emoji") || "";
    return "";
  });
  const [moodText, setMoodText] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("cesoir-mood-text") || "";
    return "";
  });

  // Persist
  useEffect(() => { localStorage.setItem("cesoir-tonight-chips", JSON.stringify(selectedChips)); }, [selectedChips]);
  useEffect(() => { localStorage.setItem("cesoir-mood-emoji", moodEmoji); }, [moodEmoji]);
  useEffect(() => { localStorage.setItem("cesoir-mood-text", moodText); }, [moodText]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, name")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { avatar_url?: string; name?: string } | null }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        if (data?.name) setProfileName(data.name);
      });
  }, [user]);

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  const Chevron = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted shrink-0" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-bg">

      {/* ── 1. Avatar + Name + City ── centered, large, breathing */}
      <motion.div className="pt-14 pb-8 px-5 flex flex-col items-center" {...fade(0)}>
        <div className="mb-5">
          {user ? (
            <PhotoUpload
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              onUploadComplete={(url) => setAvatarUrl(url)}
              variant="compact"
              fallbackLetter={profileName.charAt(0).toUpperCase()}
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-bg-card border border-border flex items-center justify-center text-[36px] font-black text-accent">
              {profileName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-[26px] font-black tracking-tight text-text">{profileName}, <span className="font-light text-text-muted">28</span></h1>
        <p className="text-[13px] text-text-muted mt-1">Paris, France</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-safe" />
          <span className="text-[11px] text-safe font-semibold">Dispo ce soir</span>
        </div>
      </motion.div>

      {/* ── 2. Quick stats ── 3 numbers, subtle */}
      <motion.div className="px-5 mb-8" {...fade(0.05)}>
        <div className="flex items-center justify-center gap-8">
          {[
            { n: "12", label: "Rencontres" },
            { n: "8", label: "Matchs" },
            { n: "3", label: "Ce mois" },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="text-[20px] font-black text-text">{s.n}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 3. Ce soir je veux ── chips */}
      <motion.div className="px-5 mb-8" {...fade(0.1)}>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.15em] font-semibold mb-3">Ce soir je veux...</p>
        <div className="flex flex-wrap gap-2">
          {TONIGHT_CHIPS.map(chip => {
            const on = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                aria-pressed={on}
                className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors ${
                  on
                    ? "border-2 border-accent bg-accent/10 text-accent"
                    : "border border-border text-text-muted hover:border-accent/30"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── 4. Mon mood ── emoji + text, simple */}
      <motion.div className="px-5 mb-8" {...fade(0.15)}>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.15em] font-semibold mb-3">Mon mood</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {MOOD_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setMoodEmoji(emoji === moodEmoji ? "" : emoji)}
                aria-pressed={moodEmoji === emoji}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] shrink-0 transition-all ${
                  moodEmoji === emoji
                    ? "border-2 border-accent bg-accent/10 scale-110"
                    : "border border-border hover:border-accent/30"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        {moodEmoji && (
          <div className="mt-3 bg-bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-[18px]">{moodEmoji}</span>
            <input
              type="text"
              value={moodText}
              onChange={e => setMoodText(e.target.value.slice(0, 50))}
              placeholder="Un mot sur ton mood..."
              maxLength={50}
              className="flex-1 bg-transparent text-[13px] text-text placeholder:text-text-muted outline-none"
              aria-label="Texte de mood"
            />
            <span className="text-[9px] text-text-muted shrink-0">{moodText.length}/50</span>
          </div>
        )}
      </motion.div>

      {/* ── 5. Audio intro ── */}
      <motion.div className="px-5 mb-8" {...fade(0.2)}>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.15em] font-semibold mb-3">Intro audio</p>
        <AudioIntro />
      </motion.div>

      {/* ── 6. Parametres ── clean rows with chevrons */}
      <motion.div className="px-5 mb-4" {...fade(0.25)}>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.15em] font-semibold mb-3">Parametres</p>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[
            { icon: "✏️", label: "Modifier mon profil", sub: "Photos, bio, prompts", href: "/profile/edit" },
            { icon: "✅", label: "Verification", sub: "Badge via selfie ou SMS", href: "/profile/verify" },
            { icon: "⚙️", label: "Preferences", sub: "Age, distance, genre", href: "/settings" },
            { icon: "🔔", label: "Notifications", sub: "Matchs, messages, rappels", href: "/settings" },
            { icon: "🛡️", label: "Securite", sub: "Mot de passe, blocage", href: "/safety" },
          ].map(item => (
            <Link key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-border/10 transition-colors">
              <span className="text-[16px] shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-semibold text-text block">{item.label}</span>
                <span className="text-[11px] text-text-muted">{item.sub}</span>
              </div>
              <Chevron />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── 7. Plus ── simple text rows for features that were gradient cards */}
      <motion.div className="px-5 mb-4" {...fade(0.3)}>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.15em] font-semibold mb-3">Plus</p>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[
            { icon: "📊", label: "Mes Insights", href: "/insights" },
            { icon: "🏆", label: "Achievements", href: "/achievements" },
            { icon: "⭐", label: "Mes Avis", href: "/reviews" },
            { icon: "📅", label: "Mon Parcours", href: "/timeline" },
            { icon: "🎵", label: "Mon Vibe", href: "/vibes" },
            { icon: "🛒", label: "Boutique", href: "/shop" },
            { icon: "👑", label: "Premium", href: "/premium" },
            { icon: "🔗", label: "Partager mon profil", href: "/profile/share" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-border/10 transition-colors">
              <span className="text-[16px] shrink-0">{item.icon}</span>
              <span className="text-[14px] font-medium text-text flex-1">{item.label}</span>
              <Chevron />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Logout ── */}
      <motion.div className="px-5 pb-28 mt-6" {...fade(0.35)}>
        <button
          onClick={async () => { await signOut(); router.push("/"); }}
          className="w-full text-center text-[13px] text-danger font-semibold py-3 bg-danger/5 border border-danger/10 rounded-xl"
        >
          Se deconnecter
        </button>
      </motion.div>
    </div>
  );
}

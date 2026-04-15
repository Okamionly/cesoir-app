"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { profileVariants, springs } from "@/lib/motion-design";
import { MODES } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/app/PhotoUpload";
import KarmaBadge from "@/components/app/KarmaBadge";
import AudioIntro from "@/components/app/AudioIntro";
import CheckIn from "@/components/app/CheckIn";

const activeModes = ["solo-diner", "langue", "dog-date"] as const;

const prompts = [
  { question: "Mon restaurant prefere a Paris...", answer: "Un petit izakaya cache dans le 11e. Je te montre si tu viens." },
  { question: "La derniere chose qui m'a fait rire...", answer: "Mon chien Rex qui essaie de voler un croissant a une terrasse." },
  { question: "Ce soir, j'ai envie de...", answer: "Decouvrir un endroit que je connais pas avec quelqu'un que je connais pas encore." },
];

const TONIGHT_CHIPS = ["Diner", "Boire un verre", "Cinema", "Balade", "Concert", "Jeux", "Cuisiner", "Sport"];
const MOOD_EMOJIS = ["😊", "🔥", "🥂", "🌙", "💜", "🎉", "😴", "🤔"];
const TIME_SLOTS = ["19h-21h", "21h-23h", "23h+", "Flexible"];

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
  const [timeSlot, setTimeSlot] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("cesoir-time-slot") || "";
    return "";
  });
  const [zone, setZone] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("cesoir-zone") || "";
    return "";
  });

  // Check-in demo state
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem("cesoir-tonight-chips", JSON.stringify(selectedChips)); }, [selectedChips]);
  useEffect(() => { localStorage.setItem("cesoir-mood-emoji", moodEmoji); }, [moodEmoji]);
  useEffect(() => { localStorage.setItem("cesoir-mood-text", moodText); }, [moodText]);
  useEffect(() => { localStorage.setItem("cesoir-time-slot", timeSlot); }, [timeSlot]);
  useEffect(() => { localStorage.setItem("cesoir-zone", zone); }, [zone]);

  // Parallax scroll
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 300], [0, 150]);
  const bgScale = useTransform(scrollY, [0, 300], [1.1, 1.0]);

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

  return (
    <div className="min-h-screen bg-bg">
      {/* Parallax photo header */}
      <motion.div
        ref={headerRef}
        className="relative h-72 overflow-hidden"
        variants={profileVariants.hero}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ y: bgY, scale: bgScale }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30" aria-hidden="true" />
          ) : (
            <div className="absolute inset-0 gradient-bg opacity-20" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 z-10">
          <h1 className="text-[16px] font-black text-text tracking-tight">Mon Profil</h1>
          <Link href="/settings" className="w-9 h-9 rounded-full bg-bg/80 backdrop-blur border border-border flex items-center justify-center tap-target">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4m-7.78-2.22l2.83-2.83m9.9-9.9l2.83-2.83M1 12h4m14 0h4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83"/>
            </svg>
          </Link>
        </div>
      </motion.div>

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

        {/* Verification + karma */}
        <div className="flex gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-accent/8 border border-accent/15 px-3 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M20 6L9 17l-5-5"/></svg>
            <span className="text-[11px] text-accent font-semibold">Verifie</span>
          </div>
          <KarmaBadge score={4.8} meetups={12} />
        </div>
      </div>

      {/* Audio Intro — slide from left (odd card) */}
      <motion.div
        className="px-5 mt-5"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.3 }}
      >
        <AudioIntro />
      </motion.div>

      {/* === CE SOIR JE VEUX === slide from right (even card) */}
      <motion.div
        className="px-5 mt-6"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.4 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Ce soir je veux...</p>
        <div className="flex flex-wrap gap-2">
          {TONIGHT_CHIPS.map((chip, i) => {
            const on = selectedChips.includes(chip);
            return (
              <motion.button
                key={chip}
                onClick={() => toggleChip(chip)}
                aria-pressed={on}
                variants={profileVariants.chip}
                initial="hidden"
                animate="visible"
                whileTap="tap"
                custom={i}
                className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors tap-target ${
                  on
                    ? "border-2 border-accent bg-accent/10 text-accent"
                    : "border border-border text-text-muted hover:border-accent/30"
                }`}
              >
                {chip}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* === MON MOOD === slide from left (odd card) */}
      <motion.div
        className="px-5 mt-6"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.5 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Mon mood</p>
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {MOOD_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setMoodEmoji(emoji === moodEmoji ? "" : emoji)}
              aria-pressed={moodEmoji === emoji}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[20px] shrink-0 transition-all tap-target ${
                moodEmoji === emoji
                  ? "border-2 border-accent bg-accent/10 scale-110"
                  : "border border-border hover:border-accent/30"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {(moodEmoji || moodText) && (
          <div className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-2">
            {moodEmoji && <span className="text-[20px]">{moodEmoji}</span>}
            <input
              type="text"
              value={moodText}
              onChange={e => setMoodText(e.target.value.slice(0, 50))}
              placeholder="Envie de decouvrir un nouveau quartier"
              maxLength={50}
              className="flex-1 bg-transparent text-[13px] text-text placeholder:text-text-muted outline-none"
              aria-label="Texte de mood"
            />
            <span className="text-[9px] text-text-muted shrink-0">{moodText.length}/50</span>
          </div>
        )}
      </motion.div>

      {/* === MA DISPO === slide from right (even card) */}
      <motion.div
        className="px-5 mt-6"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.6 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Ma dispo</p>
        <div className="flex gap-2">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              onClick={() => setTimeSlot(slot === timeSlot ? "" : slot)}
              aria-pressed={timeSlot === slot}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all tap-target ${
                timeSlot === slot
                  ? "gradient-bg text-white shadow-glow"
                  : "border border-border text-text-muted hover:border-accent/30"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </motion.div>

      {/* === MA ZONE CE SOIR === slide from left (odd card) */}
      <motion.div
        className="px-5 mt-6"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.7 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Ma zone ce soir</p>
        <input
          type="text"
          value={zone}
          onChange={e => setZone(e.target.value)}
          placeholder="ex: Marais, Bastille, Montmartre..."
          className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-[13px] text-text placeholder:text-text-muted outline-none focus:border-accent/30 transition-colors"
          aria-label="Zone pour ce soir"
        />
      </motion.div>

      {/* Prompts — Hinge style, slide from right (even card) */}
      <motion.div
        className="px-5 mt-6"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.8 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">A propos</p>
        <div className="space-y-3">
          {prompts.map((p, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors">
              <p className="text-[11px] text-accent font-bold uppercase tracking-wider mb-2">{p.question}</p>
              <p className="text-[14px] text-text leading-relaxed">{p.answer}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active modes — with custom icons, slide from left (odd card) */}
      <motion.div
        className="px-5 mt-6"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 0.9 }}
      >
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
      </motion.div>

      {/* Settings — minimal, slide from right (even card) */}
      <motion.div
        className="px-5 mt-6 mb-4"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springs.heavy, delay: 1.0 }}
      >
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Parametres</p>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[
            { label: "Modifier mon profil", sub: "Photos, bio, prompts", href: "/profile/edit" },
            { label: "Verification", sub: "Badge Verifie via selfie, SMS ou social", href: "/profile/verify" as string | null },
            { label: "Preferences", sub: "Age, distance, genre", href: "/settings" },
            { label: "Notifications", sub: "Matchs, messages, rappels", href: "/settings" },
            { label: "Securite", sub: "Mot de passe, blocage, signalement", href: "/safety" },
          ].map((item) => (
            item.href ? (
              <Link key={item.label} href={item.href} className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-border/20 transition-colors tap-target">
                <div>
                  <span className="text-[13px] font-semibold text-text block">{item.label}</span>
                  <span className="text-[10px] text-text-muted">{item.sub}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            ) : (
              <button key={item.label} className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-border/20 transition-colors tap-target">
                <div>
                  <span className="text-[13px] font-semibold text-text block">{item.label}</span>
                  <span className="text-[10px] text-text-muted">{item.sub}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            )
          ))}
        </div>
      </motion.div>

      {/* Simuler un check-in (demo) */}
      <div className="px-5 mb-4">
        <button
          onClick={() => setShowCheckIn(true)}
          className="w-full flex items-center justify-between bg-bg-card border border-accent/15 rounded-2xl p-4 active:scale-[0.98] transition-transform tap-target"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <span className="text-[18px]" aria-hidden="true">📋</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-text">Simuler un check-in</p>
              <p className="text-[10px] text-text-muted">Tester le retour post-rencontre</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Share profile card */}
      <div className="px-5 mb-4">
        <Link
          href="/profile/share"
          className="flex items-center justify-between bg-bg-card border border-accent/15 rounded-2xl p-4 active:scale-[0.98] transition-transform tap-target"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-text">Partager mon profil</p>
              <p className="text-[10px] text-text-muted">Carte shareable, QR code, reseaux</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </Link>
      </div>

      {/* Logout */}
      <div className="px-5 pb-24 mt-4">
        <button
          onClick={async () => { await signOut(); router.push("/"); }}
          className="w-full text-center text-[13px] text-danger font-semibold py-3 bg-danger/5 border border-danger/10 rounded-xl tap-target"
        >
          Se deconnecter
        </button>
      </div>

      {/* Check-in modal */}
      <CheckIn
        peerName="Sarah"
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
      />
    </div>
  );
}

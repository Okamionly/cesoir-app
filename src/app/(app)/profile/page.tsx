"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { m, useReducedMotion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Magnetic } from "@/components/motion/Magnetic";
import { springs, profileVariants } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronRight as LucideChevronRight, Settings as LucideSettings } from "@/components/ui/lucide";

const TONIGHT_CHIPS = ["Diner", "Boire un verre", "Cinema", "Balade", "Concert", "Sport"];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.55, ease, delay },
});

// ────────────────────────────────────────────────
// Local glyph wrappers — keep call sites unchanged
// ────────────────────────────────────────────────
function ChevronRight() {
  return <LucideChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />;
}

function SettingsIcon() {
  return <LucideSettings size={20} strokeWidth={1.6} aria-hidden="true" />;
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

  const reducedMotion = useReducedMotion();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch((err) => {
      // Client sign-out still proceeds; surface the server-side issue for observability
      console.error("[profile] logout API call failed:", err);
    });
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Profil"
        titleClassName="text-[15px] font-semibold tracking-tight"
        sticky={false}
        borderless
        actions={
          <Link
            href="/settings"
            aria-label="Parametres"
            className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <SettingsIcon />
          </Link>
        }
      />

      {/* ── HERO ── Avatar + Name + Edit button ── */}
      <m.section
        className="px-6 pt-8 pb-10 flex flex-col items-center text-center"
        variants={profileVariants.hero}
        initial="hidden"
        animate="visible"
      >
        {/* Avatar with breathing gradient ring */}
        <m.div
          className="relative mb-6"
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ ...springs.elastic, delay: 0.1 }}
        >
          {/* Outer animated halo (skipped on reduced-motion) */}
          {!reducedMotion && (
            <m.div
              aria-hidden="true"
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                filter: "blur(14px)",
                opacity: 0.35,
              }}
              animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <m.div
            className="relative w-32 h-32 rounded-full p-[3px]"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))" }}
            animate={
              reducedMotion
                ? undefined
                : { backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }
            }
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <div className="relative w-full h-full rounded-full bg-bg overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`Photo de ${profileName}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-bg-card">
                  <span
                    className="text-[52px] font-bold tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {profileName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </m.div>
          {/* Online indicator with soft pulse */}
          <m.span
            className="absolute bottom-1.5 right-1.5 block w-4 h-4 rounded-full ring-[3px] ring-bg"
            style={{ background: "var(--color-accent-2)" }}
            aria-label="En ligne ce soir"
            animate={
              reducedMotion
                ? undefined
                : {
                    boxShadow: [
                      "0 0 0 0 color-mix(in srgb, var(--color-accent-2) 50%, transparent)",
                      "0 0 0 8px color-mix(in srgb, var(--color-accent-2) 0%, transparent)",
                      "0 0 0 0 color-mix(in srgb, var(--color-accent-2) 50%, transparent)",
                    ],
                  }
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
        </m.div>

        {/* Name */}
        <m.h2
          className="text-[28px] font-bold tracking-tight text-text leading-none"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.25 }}
        >
          {profileName}, <span className="font-normal text-text-muted">{age}</span>
        </m.h2>
        <m.p
          className="text-[13px] text-text-muted mt-2 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Paris, France
        </m.p>

        {/* Status pill */}
        <m.div
          className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springs.elastic, delay: 0.5 }}
        >
          <span className="block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent-2)" }} aria-hidden="true" />
          <span className="text-[12px] font-medium text-text">Disponible ce soir</span>
        </m.div>

        {/* Edit profile — magnetic primary action */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.cinematic, delay: 0.6 }}
          className="mt-7"
        >
          <Magnetic strength={0.16} radius={90}>
            <m.span
              className="inline-block"
              whileTap={{ scale: 0.96, transition: springs.micro }}
            >
              <Link
                href="/profile/edit"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-text text-bg text-[14px] font-semibold tracking-tight hover:opacity-90 transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
              >
                Modifier le profil
              </Link>
            </m.span>
          </Magnetic>
        </m.div>
      </m.section>

      {/* ── INTENT: What do you want tonight? ── */}
      <m.section
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
          {TONIGHT_CHIPS.map((chip, i) => {
            const on = selectedChips.includes(chip);
            return (
              <m.button
                key={chip}
                onClick={() => toggleChip(chip)}
                aria-pressed={on}
                custom={i}
                variants={profileVariants.chip}
                initial="hidden"
                animate="visible"
                whileTap="tap"
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none ${
                  on
                    ? "bg-text text-bg border border-text"
                    : "bg-bg-card text-text border border-border hover:border-text/30"
                }`}
              >
                {chip}
              </m.button>
            );
          })}
        </div>
      </m.section>

      {/* ── ESSENTIALS ── 3 main destinations ── */}
      <m.nav
        className="px-6 mb-8"
        {...fade(0.15)}
        aria-label="Navigation principale"
      >
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-3.5">
          Decouvrir
        </h3>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {[
            { label: "Recommandations", desc: "Profils selectionnes pour toi", href: "/browse" },
            { label: "Plans ce soir", desc: "Organiser ou rejoindre", href: "/plans" },
            { label: "Progression", desc: "Badges, defis, confiance", href: "/progress" },
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
      </m.nav>

      {/* ── SETTINGS ── */}
      <m.div
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
      </m.div>

      {/* ── LOGOUT ── */}
      <m.div
        className="px-6"
        {...fade(0.25)}
      >
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-bg-card border border-border text-[14px] font-medium text-text-muted hover:text-text hover:border-text/20 transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
        >
          Se deconnecter
        </button>
      </m.div>
    </div>
  );
}

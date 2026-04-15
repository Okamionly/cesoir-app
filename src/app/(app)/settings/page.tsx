"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { setMuted, isMuted } from "@/lib/sounds";
import { useDarkMode } from "@/components/ui/DarkModeProvider";
import { useAccessibility, type FontSize } from "@/components/ui/ReducedMotion";
import { useTranslation, setLocale as persistLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

// ── Types ──────────────────────────────────────────

interface Settings {
  notifications: {
    messages: boolean;
    likes: boolean;
    matchs: boolean;
    plansFlash: boolean;
    sons: boolean;
  };
  privacy: {
    profilVisible: boolean;
    partagerPosition: boolean;
    modeFantome: boolean;
  };
  appearance: {
    theme: "auto" | "clair" | "sombre";
  };
}

const DEFAULT_SETTINGS: Settings = {
  notifications: {
    messages: true,
    likes: true,
    matchs: true,
    plansFlash: true,
    sons: true,
  },
  privacy: {
    profilVisible: true,
    partagerPosition: true,
    modeFantome: false,
  },
  appearance: {
    theme: "auto",
  },
};

const STORAGE_KEY = "cesoir_settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // localStorage unavailable
  }
}

// ── Toggle Switch ──────────────────────────────────

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <motion.button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-[44px] h-[26px] rounded-full shrink-0 tap-target"
      animate={{
        backgroundColor: value ? "#8B5CF6" : "var(--color-border)",
      }}
      transition={springs.snap}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className="absolute top-[3px] left-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md"
        animate={{ x: value ? 18 : 0 }}
        transition={springs.snap}
      />
    </motion.button>
  );
}

// ── Section wrapper with staggered entrance ────────

function Section({
  title,
  index,
  children,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="px-5 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.heavy, delay: 0.08 * index }}
    >
      <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">
        {title}
      </p>
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </motion.div>
  );
}

// ── Row components ─────────────────────────────────

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[13px] font-semibold text-text">{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function LinkRow({
  label,
  href,
  danger,
}: {
  label: string;
  href: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3.5 active:bg-border/20 transition-colors tap-target"
    >
      <span
        className={`text-[13px] font-semibold ${danger ? "text-danger" : "text-text"}`}
      >
        {label}
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-muted"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[13px] font-semibold text-text">{label}</span>
      <span className="text-[13px] text-text-muted">{value}</span>
    </div>
  );
}

// ── Accessibility Section ─────────────────────────

function AccessibilitySection({ index }: { index: number }) {
  const { locale, changeLocale } = useTranslation();
  const {
    fontSize,
    setFontSize,
    reducedMotion,
    reducedMotionOverride,
    setReducedMotionOverride,
  } = useAccessibility();

  const FONT_LABELS: { value: FontSize; label: string }[] = [
    { value: "normal", label: "Normal" },
    { value: "large", label: "Grand" },
    { value: "xlarge", label: "Tres grand" },
  ];

  const LOCALE_LABELS: { value: Locale; label: string }[] = [
    { value: "fr", label: "Francais" },
    { value: "en", label: "English" },
  ];

  return (
    <Section title="Accessibilite" index={index}>
      {/* Language */}
      <div className="px-4 py-3.5">
        <p className="text-[13px] font-semibold text-text mb-3">Langue</p>
        <div className="flex gap-2">
          {LOCALE_LABELS.map((l) => {
            const active = locale === l.value;
            return (
              <motion.button
                key={l.value}
                onClick={() => changeLocale(l.value)}
                aria-pressed={active}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors tap-target ${
                  active
                    ? "bg-accent text-white"
                    : "border border-border text-text-muted hover:border-accent/30"
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {l.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Font size */}
      <div className="px-4 py-3.5">
        <p className="text-[13px] font-semibold text-text mb-3">
          Taille du texte
        </p>
        <div className="flex gap-2">
          {FONT_LABELS.map((f) => {
            const active = fontSize === f.value;
            return (
              <motion.button
                key={f.value}
                onClick={() => setFontSize(f.value)}
                aria-pressed={active}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors tap-target ${
                  active
                    ? "bg-accent text-white"
                    : "border border-border text-text-muted hover:border-accent/30"
                }`}
                whileTap={{ scale: 0.9 }}
              >
                {f.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Reduced motion */}
      <ToggleRow
        label="Reduire les animations"
        value={reducedMotionOverride !== null ? reducedMotionOverride : reducedMotion}
        onChange={(v) => setReducedMotionOverride(v)}
      />
    </Section>
  );
}

// ── Main Page ──────────────────────────────────────

// Map between settings French labels and DarkModeProvider values
const themeToMode = { auto: "auto", clair: "light", sombre: "dark" } as const;
const modeToTheme = { auto: "auto", light: "clair", dark: "sombre" } as const;

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { mode: darkModeValue, setMode: setDarkMode } = useDarkMode();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount and sync theme from DarkModeProvider
  useEffect(() => {
    const loaded = loadSettings();
    // Sync sound mute state from sounds.ts
    loaded.notifications.sons = !isMuted();
    // Sync theme from DarkModeProvider (source of truth)
    loaded.appearance.theme = modeToTheme[darkModeValue];
    setSettings(loaded);
    setMounted(true);
  }, [darkModeValue]);

  // Persist whenever settings change (skip initial mount)
  useEffect(() => {
    if (!mounted) return;
    saveSettings(settings);
  }, [settings, mounted]);

  const updateNotif = (
    key: keyof Settings["notifications"],
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    // Sync sound toggle with sounds.ts mute state
    if (key === "sons") {
      setMuted(!value);
    }
  };

  const updatePrivacy = (
    key: keyof Settings["privacy"],
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }));
  };

  const setTheme = (theme: Settings["appearance"]["theme"]) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme },
    }));
    // Sync to DarkModeProvider so the actual theme changes
    setDarkMode(themeToMode[theme]);
  };

  const sectionIdx = { current: 0 };
  const nextIdx = () => sectionIdx.current++;

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-20 bg-bg/80 backdrop-blur-lg border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.snap}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <motion.button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center tap-target"
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-text"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <h1 className="text-[16px] font-black text-text tracking-tight">
            Reglages
          </h1>
        </div>
      </motion.div>

      <div className="pt-5">
        {/* ── 1. Compte ─────────────────────────────── */}
        <Section title="Compte" index={nextIdx()}>
          <InfoRow
            label="Email"
            value={user?.email ?? "Non connecte"}
          />
          <LinkRow label="Changer le mot de passe" href="/profile/edit" />
          <LinkRow
            label="Supprimer mon compte"
            href="/profile/delete"
            danger
          />
        </Section>

        {/* ── 2. Notifications ──────────────────────── */}
        <Section title="Notifications" index={nextIdx()}>
          <ToggleRow
            label="Nouveaux messages"
            value={settings.notifications.messages}
            onChange={(v) => updateNotif("messages", v)}
          />
          <ToggleRow
            label="Likes recus"
            value={settings.notifications.likes}
            onChange={(v) => updateNotif("likes", v)}
          />
          <ToggleRow
            label="Matchs"
            value={settings.notifications.matchs}
            onChange={(v) => updateNotif("matchs", v)}
          />
          <ToggleRow
            label="Plans flash"
            value={settings.notifications.plansFlash}
            onChange={(v) => updateNotif("plansFlash", v)}
          />
          <ToggleRow
            label="Sons"
            value={settings.notifications.sons}
            onChange={(v) => updateNotif("sons", v)}
          />
        </Section>

        {/* ── 3. Confidentialite ────────────────────── */}
        <Section title="Confidentialite" index={nextIdx()}>
          <ToggleRow
            label="Profil visible"
            value={settings.privacy.profilVisible}
            onChange={(v) => updatePrivacy("profilVisible", v)}
          />
          <ToggleRow
            label="Partager ma position"
            value={settings.privacy.partagerPosition}
            onChange={(v) => updatePrivacy("partagerPosition", v)}
          />
          <ToggleRow
            label="Mode fantome"
            value={settings.privacy.modeFantome}
            onChange={(v) => updatePrivacy("modeFantome", v)}
          />
        </Section>

        {/* ── 4. Apparence ──────────────────────────── */}
        <Section title="Apparence" index={nextIdx()}>
          <div className="px-4 py-3.5">
            <p className="text-[13px] font-semibold text-text mb-3">Theme</p>
            <div className="flex gap-2">
              {(["auto", "clair", "sombre"] as const).map((t) => {
                const labels = {
                  auto: "Auto",
                  clair: "Clair",
                  sombre: "Sombre",
                };
                const active = settings.appearance.theme === t;
                return (
                  <motion.button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-pressed={active}
                    className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors tap-target ${
                      active
                        ? "bg-accent text-white"
                        : "border border-border text-text-muted hover:border-accent/30"
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {labels[t]}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── 5. Accessibilite ──────────────────────── */}
        <AccessibilitySection index={nextIdx()} />

        {/* ── 6. A propos ───────────────────────────── */}
        <Section title="A propos" index={nextIdx()}>
          <InfoRow label="Version" value="1.0.0" />
          <LinkRow label="Conditions generales" href="/cgu" />
          <LinkRow label="Politique de confidentialite" href="/privacy" />
          <LinkRow label="A propos de CeSoir" href="/about" />
        </Section>
      </div>
    </div>
  );
}

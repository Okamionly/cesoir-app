"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { m } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { setMuted, isMuted } from "@/lib/sounds";
import { useDarkMode } from "@/components/ui/DarkModeProvider";
import { useAccessibility, type FontSize } from "@/components/ui/ReducedMotion";
import { useTranslation, type Locale } from "@/lib/i18n";
import { useWomenFirstSettings } from "@/lib/useWomenFirst";
import { useUserSettings } from "@/lib/useUserSettings";
import { springs } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronRight } from "@/components/ui/lucide";

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

// ── Toggle Switch (iOS-style) ─────────────────────

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative w-[44px] h-[26px] rounded-full shrink-0 tap-target transition-colors duration-200"
      style={{ backgroundColor: value ? "var(--color-safe)" : "var(--color-border)" }}
    >
      <span
        className="absolute top-[3px] left-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-transform duration-200"
        style={{ transform: value ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

// ── Section wrapper ───────────────────────────────

function Section({
  title,
  children,
  index = 0,
}: {
  title: string;
  children: React.ReactNode;
  index?: number;
}) {
  return (
    <m.div
      className="px-5 mb-6"
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...springs.heavy, delay: 0.1 + index * 0.06 }}
    >
      <p className="text-[11px] text-text-muted uppercase tracking-[0.12em] font-semibold mb-2 px-1">
        {title}
      </p>
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </m.div>
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
      <ChevronRight size={16} strokeWidth={1.5} className="text-text-muted" aria-hidden="true" />
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

// ── Pill selector ─────────────────────────────────

function PillSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors tap-target ${
              active
                ? "bg-accent text-white"
                : "border border-border text-text-muted hover:border-accent/30"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────

const themeToMode = { auto: "auto", clair: "light", sombre: "dark" } as const;
const modeToTheme = { auto: "auto", light: "clair", dark: "sombre" } as const;

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { mode: darkModeValue, setMode: setDarkMode } = useDarkMode();
  const { locale, changeLocale } = useTranslation();
  const {
    fontSize,
    setFontSize,
    reducedMotion,
    reducedMotionOverride,
    setReducedMotionOverride,
  } = useAccessibility();
  const { settings: wfSettings, toggle: toggleWomenFirst } = useWomenFirstSettings();

  // Server-backed prefs — localStorage stays as immediate fallback.
  const {
    settings: serverSettings,
    updateNotifications: serverUpdateNotifications,
    updatePrivacy: serverUpdatePrivacy,
    updateAppPrefs: serverUpdateAppPrefs,
    loading: serverLoading,
  } = useUserSettings();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load local state first (instant paint), then overlay server values once available.
  useEffect(() => {
    const loaded = loadSettings();
    loaded.notifications.sons = !isMuted();
    loaded.appearance.theme = modeToTheme[darkModeValue];
    setSettings(loaded);
    setMounted(true);
  }, [darkModeValue]);

  // Once server settings arrive, overlay the persisted values (server wins).
  useEffect(() => {
    if (serverLoading) return;
    setSettings((prev) => {
      const n = serverSettings.notifications;
      const p = serverSettings.privacy;
      const a = serverSettings.app;
      return {
        notifications: {
          messages: n.messages ?? prev.notifications.messages,
          likes: n.likes ?? prev.notifications.likes,
          matchs: n.matches ?? prev.notifications.matchs,
          plansFlash: n.plansFlash ?? prev.notifications.plansFlash,
          sons: n.sons ?? prev.notifications.sons,
        },
        privacy: {
          profilVisible: p.profile_visible ?? prev.privacy.profilVisible,
          partagerPosition: p.location_blur ? p.location_blur === "exact" : prev.privacy.partagerPosition,
          modeFantome: p.invisible ?? prev.privacy.modeFantome,
        },
        appearance: {
          theme: a.dark_mode ? modeToTheme[a.dark_mode] : prev.appearance.theme,
        },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverLoading, serverSettings.notifications, serverSettings.privacy, serverSettings.app]);

  useEffect(() => {
    if (!mounted) return;
    saveSettings(settings);
  }, [settings, mounted]);

  const updateNotif = (key: keyof Settings["notifications"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    if (key === "sons") {
      setMuted(!value);
    }
    // Map local keys -> server schema
    const serverMap: Record<keyof Settings["notifications"], string> = {
      messages: "messages",
      likes: "likes",
      matchs: "matches",
      plansFlash: "plansFlash",
      sons: "sons",
    };
    serverUpdateNotifications({ [serverMap[key]]: value }).catch((err) => {
      console.error("[settings] notifications sync failed:", err);
    });
  };

  const updatePrivacy = (key: keyof Settings["privacy"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }));
    // Map local keys -> server schema
    if (key === "profilVisible") {
      serverUpdatePrivacy({ profile_visible: value }).catch((err) =>
        console.error("[settings] privacy sync failed:", err),
      );
    } else if (key === "modeFantome") {
      serverUpdatePrivacy({ invisible: value }).catch((err) =>
        console.error("[settings] privacy sync failed:", err),
      );
    } else if (key === "partagerPosition") {
      serverUpdatePrivacy({ location_blur: value ? "exact" : "block" }).catch((err) =>
        console.error("[settings] privacy sync failed:", err),
      );
    }
  };

  const setTheme = (theme: Settings["appearance"]["theme"]) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme },
    }));
    setDarkMode(themeToMode[theme]);
    serverUpdateAppPrefs({ dark_mode: themeToMode[theme] }).catch((err) => {
      console.error("[settings] app prefs sync failed:", err);
    });
  };

  // Sync locale / fontSize / reducedMotion when user changes them via the existing providers.
  const handleLocaleChange = (next: Locale) => {
    changeLocale(next);
    serverUpdateAppPrefs({ language: next }).catch((err) => {
      console.error("[settings] language sync failed:", err);
    });
  };

  const handleFontSizeChange = (next: FontSize) => {
    setFontSize(next);
    serverUpdateAppPrefs({ font_size: next }).catch((err) => {
      console.error("[settings] font size sync failed:", err);
    });
  };

  const handleReducedMotionChange = (next: boolean) => {
    setReducedMotionOverride(next);
    serverUpdateAppPrefs({ reduced_motion: next }).catch((err) => {
      console.error("[settings] reduced motion sync failed:", err);
    });
  };

  const handleWomenFirstToggle = (_next: boolean) => {
    toggleWomenFirst();
    // useWomenFirstSettings flips its internal state — mirror the intended next value to server.
    serverUpdateAppPrefs({ women_first: _next }).catch((err) => {
      console.error("[settings] women_first sync failed:", err);
    });
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PageHeader
        title="Reglages"
        onBack={() => router.back()}
        icon={<span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />}
        iconAnimation="pulse"
        hairlineVariant="vert-violet"
        sticky={false}
        rackFocus
      />

      <div className="pt-5">
        {/* ── 1. Compte ─────────────────────────────── */}
        <Section title="Compte" index={0}>
          <InfoRow label="Email" value={user?.email ?? "Non connecte"} />
          <LinkRow label="Changer le mot de passe" href="/profile/edit" />
          <LinkRow label="Supprimer mon compte" href="/profile/delete" danger />
        </Section>

        {/* ── 2. Notifications ──────────────────────── */}
        <Section title="Notifications" index={1}>
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
        <Section title="Confidentialite" index={2}>
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
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text">
                Les femmes ecrivent d&apos;abord
              </span>
              <Toggle value={wfSettings.enabled} onChange={handleWomenFirstToggle} />
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Comme Bumble — les femmes initient la conversation
            </p>
          </div>
        </Section>

        {/* ── 4. Apparence ──────────────────────────── */}
        <Section title="Apparence" index={3}>
          <div className="px-4 py-3.5">
            <p className="text-[13px] font-semibold text-text mb-3">Theme</p>
            <PillSelector
              options={[
                { value: "auto" as const, label: "Auto" },
                { value: "clair" as const, label: "Clair" },
                { value: "sombre" as const, label: "Sombre" },
              ]}
              value={settings.appearance.theme}
              onChange={setTheme}
            />
          </div>
        </Section>

        {/* ── 5. Accessibilite ──────────────────────── */}
        <Section title="Accessibilite">
          <div className="px-4 py-3.5">
            <p className="text-[13px] font-semibold text-text mb-3">Langue</p>
            <PillSelector<Locale>
              options={[
                { value: "fr", label: "Francais" },
                { value: "en", label: "English" },
              ]}
              value={locale}
              onChange={handleLocaleChange}
            />
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[13px] font-semibold text-text mb-3">Taille du texte</p>
            <PillSelector<FontSize>
              options={[
                { value: "normal", label: "Normal" },
                { value: "large", label: "Grand" },
                { value: "xlarge", label: "Tres grand" },
              ]}
              value={fontSize}
              onChange={handleFontSizeChange}
            />
          </div>
          <ToggleRow
            label="Reduire les animations"
            value={reducedMotionOverride !== null ? reducedMotionOverride : reducedMotion}
            onChange={(v) => handleReducedMotionChange(v)}
          />
        </Section>

        {/* ── 6. A propos ───────────────────────────── */}
        <Section title="A propos">
          <InfoRow label="Version" value="1.0.0" />
          <LinkRow label="Conditions generales" href="/cgu" />
          <LinkRow label="Politique de confidentialite" href="/privacy" />
          <LinkRow label="A propos de CeSoir" href="/about" />
        </Section>
      </div>
    </div>
  );
}

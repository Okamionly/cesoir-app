"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "motion/react";
import PageHeader from "@/components/ui/PageHeader";
import { Info } from "@/components/ui/lucide";
import {
  useUserSettings,
  type LocationBlur,
  type PrivacyPrefs,
} from "@/lib/useUserSettings";

// ── Toggle descriptors (booleans only) ───────────────────────────────────────

interface ToggleSetting {
  key: "invisible" | "profile_visible" | "women_first";
  label: string;
  description: string;
  icon: string;
  // When true, the toggle represents the *opposite* of the stored flag
  // (e.g. "Profil visible" ON = profile_visible=true).
  positive?: boolean;
}

const TOGGLE_SETTINGS: ToggleSetting[] = [
  {
    key: "invisible",
    label: "Mode invisible",
    description: "Tu n'apparais plus sur la carte ni dans les suggestions. Tu peux toujours voir les autres.",
    icon: "👻",
  },
  {
    key: "profile_visible",
    label: "Apparaître dans les suggestions",
    description: "Les autres utilisateurs peuvent te découvrir via le feed et les recommandations.",
    icon: "✨",
    positive: true,
  },
  {
    key: "women_first",
    label: "Les femmes écrivent d'abord",
    description: "Comme Bumble — seules les femmes peuvent initier la conversation.",
    icon: "💬",
    positive: true,
  },
];

const LOCATION_OPTIONS: { value: LocationBlur; label: string; description: string }[] = [
  { value: "exact", label: "Exacte", description: "Distance au mètre près" },
  { value: "km", label: "Arrondi", description: "Au kilomètre près" },
  { value: "block", label: "Quartier", description: "Masque la distance précise" },
];

// ── localStorage fallback (offline/first-paint) ──────────────────────────────

const STORAGE_KEY = "cesoir-privacy-settings";

interface PrivacyState {
  invisible: boolean;
  profile_visible: boolean;
  women_first: boolean;
  location_blur: LocationBlur;
}

const defaults: PrivacyState = {
  invisible: false,
  profile_visible: true,
  women_first: false,
  location_blur: "km",
};

function loadLocal(): PrivacyState {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaults;
}

function saveLocal(state: PrivacyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function mergeFromServer(server: PrivacyPrefs): PrivacyState {
  return {
    invisible: server.invisible ?? defaults.invisible,
    profile_visible: server.profile_visible ?? defaults.profile_visible,
    women_first: server.women_first ?? defaults.women_first,
    location_blur: server.location_blur ?? defaults.location_blur,
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function PrivacySettingsPage() {
  const { settings, updatePrivacy, loading } = useUserSettings();
  const [state, setState] = useState<PrivacyState>(loadLocal);

  // Hydrate from server once loaded.
  useEffect(() => {
    if (loading) return;
    const merged = mergeFromServer(settings.privacy);
    setState(merged);
    saveLocal(merged);
  }, [loading, settings.privacy]);

  const persist = useCallback(
    (partial: Partial<PrivacyState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial };
        saveLocal(next);
        updatePrivacy(partial).catch((err) => {
          console.error("[privacy] sync failed:", err);
        });
        return next;
      });
    },
    [updatePrivacy],
  );

  const toggle = (key: ToggleSetting["key"]) => {
    persist({ [key]: !state[key] } as Partial<PrivacyState>);
  };

  const blockedUsers = settings.privacy.blocked_users ?? [];

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Confidentialité" backHref="/profile" />

      {/* Toggles */}
      <div className="px-5 py-6 space-y-3">
        {TOGGLE_SETTINGS.map((setting, i) => {
          const isOn = state[setting.key];
          return (
            <m.div
              key={setting.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[18px]" aria-hidden="true">{setting.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-text">{setting.label}</p>
                    <p className="text-[12px] text-text-muted mt-1 leading-relaxed">{setting.description}</p>
                  </div>
                </div>

                <button
                  role="switch"
                  aria-checked={isOn}
                  aria-label={setting.label}
                  onClick={() => toggle(setting.key)}
                  className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                    isOn ? "bg-accent" : "bg-border"
                  }`}
                >
                  <m.div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
                    animate={{ x: isOn ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </m.div>
          );
        })}
      </div>

      {/* Location precision selector */}
      <div className="px-5 pb-6">
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center shrink-0">
              <span className="text-[18px]" aria-hidden="true">📍</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-text">Précision de localisation</p>
              <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                Contrôle la précision avec laquelle les autres voient ta distance.
              </p>
            </div>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Précision de localisation">
            {LOCATION_OPTIONS.map((opt) => {
              const active = state.location_blur === opt.value;
              return (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => persist({ location_blur: opt.value })}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors tap-target ${
                    active
                      ? "bg-accent text-white"
                      : "border border-border text-text-muted hover:border-accent/30"
                  }`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Blocked users (read-only list for now) */}
      <div className="px-5 pb-6">
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center shrink-0">
              <span className="text-[18px]" aria-hidden="true">🚫</span>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-text">
                Utilisateurs bloqués
              </p>
              {blockedUsers.length === 0 ? (
                <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                  Aucun utilisateur bloqué. Utilise le menu depuis un profil pour bloquer quelqu&apos;un.
                </p>
              ) : (
                <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                  {blockedUsers.length} utilisateur{blockedUsers.length > 1 ? "s" : ""} bloqué{blockedUsers.length > 1 ? "s" : ""}. Le déblocage sera bientôt disponible.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="px-5 pb-24">
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Info size={16} strokeWidth={2} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[12px] text-text-muted leading-relaxed">
              Ces paramètres sont appliqués immédiatement et synchronisés entre tes appareils. En mode invisible, tu peux toujours parcourir les profils mais personne ne te verra. Tes conversations existantes restent accessibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

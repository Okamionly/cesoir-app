"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PrivacySetting {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const SETTINGS: PrivacySetting[] = [
  {
    key: "invisible",
    label: "Mode invisible",
    description: "Tu n'apparais plus sur la carte ni dans les suggestions. Tu peux toujours voir les autres.",
    icon: "👻",
  },
  {
    key: "location",
    label: "Partage de position",
    description: "Permet aux autres de voir ta distance approximative. Desactive pour masquer ta localisation.",
    icon: "📍",
  },
  {
    key: "suggestions",
    label: "Apparaitre dans les suggestions",
    description: "Les autres utilisateurs peuvent te decouvrir via le feed et les recommandations.",
    icon: "✨",
  },
];

const STORAGE_KEY = "cesoir-privacy-settings";

function loadSettings(): Record<string, boolean> {
  if (typeof window === "undefined") return { invisible: false, location: true, suggestions: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { invisible: false, location: true, suggestions: true };
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center tap-target"
            aria-label="Retour au profil"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-[16px] font-black text-text tracking-tight">Confidentialite</h1>
        </div>
      </div>

      {/* Settings list */}
      <div className="px-5 py-6 space-y-3">
        {SETTINGS.map((setting, i) => {
          const isOn = setting.key === "invisible" ? settings[setting.key] : settings[setting.key] !== false;
          return (
            <motion.div
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

                {/* Toggle switch */}
                <button
                  role="switch"
                  aria-checked={isOn}
                  aria-label={setting.label}
                  onClick={() => toggle(setting.key)}
                  className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                    isOn ? "bg-accent" : "bg-border"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm"
                    animate={{ x: isOn ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="px-5 pb-24">
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
            <p className="text-[12px] text-text-muted leading-relaxed">
              Ces parametres sont appliques immediatement. En mode invisible, tu peux toujours parcourir les profils
              mais personne ne te verra. Tes conversations existantes restent accessibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

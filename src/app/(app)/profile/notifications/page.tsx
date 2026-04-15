"use client";

import { useState, useEffect, useCallback } from "react";

const NOTIF_KEY = "cesoir_notification_prefs";

interface NotifPrefs {
  matchs: boolean;
  messages: boolean;
  reminder17h: boolean;
  newsletter: boolean;
}

const defaults: NotifPrefs = {
  matchs: true,
  messages: true,
  reminder17h: true,
  newsletter: false,
};

function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    // corrupted
  }
  return defaults;
}

function savePrefs(prefs: NotifPrefs): void {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
}

const toggles: { key: keyof NotifPrefs; label: string; description: string }[] = [
  { key: "matchs", label: "Nouveaux matchs", description: "Quand quelqu'un veut te rencontrer" },
  { key: "messages", label: "Messages", description: "Nouveaux messages de tes matchs" },
  { key: "reminder17h", label: "Rappel 17h", description: "\"Ce soir, tu fais quoi ?\" tous les jours" },
  { key: "newsletter", label: "Newsletter", description: "Actus CeSoir et nouveaux modes" },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const toggle = useCallback((key: keyof NotifPrefs) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      savePrefs(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return updated;
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-[20px] font-black mb-1">Notifications</h1>
      <p className="text-[13px] text-text-muted mb-6">
        Choisis ce que tu veux recevoir
      </p>

      <div className="space-y-3">
        {toggles.map(t => (
          <div
            key={t.key}
            className="flex items-center justify-between p-4 bg-bg border border-border rounded-2xl"
          >
            <div className="flex-1 mr-4">
              <p className="text-[14px] font-semibold">{t.label}</p>
              <p className="text-[11px] text-text-muted">{t.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[t.key]}
              onClick={() => toggle(t.key)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                prefs[t.key] ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                  prefs[t.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {saved && (
        <p className="text-center text-[13px] text-accent font-medium mt-4 animate-pulse">
          Preferences sauvegardees
        </p>
      )}
    </div>
  );
}

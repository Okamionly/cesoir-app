"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserSettings, type NotificationPrefs } from "@/lib/useUserSettings";

// localStorage fallback for offline/first-paint — server is source of truth.
const NOTIF_KEY = "cesoir_notification_prefs";

type NotifKey = "matches" | "likes" | "messages" | "events" | "feed" | "challenges" | "reminder17h" | "newsletter";

interface NotifPrefsShape extends Record<NotifKey, boolean> {
  matches: boolean;
  likes: boolean;
  messages: boolean;
  events: boolean;
  feed: boolean;
  challenges: boolean;
  reminder17h: boolean;
  newsletter: boolean;
}

const defaults: NotifPrefsShape = {
  matches: true,
  likes: true,
  messages: true,
  events: false,
  feed: true,
  challenges: true,
  reminder17h: true,
  newsletter: false,
};

function mergeDefaults(partial: NotificationPrefs): NotifPrefsShape {
  return {
    matches: partial.matches ?? defaults.matches,
    likes: partial.likes ?? defaults.likes,
    messages: partial.messages ?? defaults.messages,
    events: partial.events ?? defaults.events,
    feed: partial.feed ?? defaults.feed,
    challenges: partial.challenges ?? defaults.challenges,
    reminder17h: partial.reminder17h ?? defaults.reminder17h,
    newsletter: partial.newsletter ?? defaults.newsletter,
  };
}

function loadLocal(): NotifPrefsShape {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {
    // corrupted
  }
  return defaults;
}

function saveLocal(prefs: NotifPrefsShape): void {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable
  }
}

const toggles: { key: NotifKey; label: string; description: string }[] = [
  { key: "matches", label: "Nouveaux matchs", description: "Quand quelqu'un veut te rencontrer" },
  { key: "messages", label: "Messages", description: "Nouveaux messages de tes matchs" },
  { key: "likes", label: "Likes reçus", description: "Quand on aime ton profil" },
  { key: "events", label: "Événements", description: "Plans flash et soirées autour de toi" },
  { key: "feed", label: "Feed", description: "Activités de tes matchs et du quartier" },
  { key: "challenges", label: "Défis", description: "Défis du jour et progression" },
  { key: "reminder17h", label: "Rappel 17h", description: "\"Ce soir, tu fais quoi ?\" tous les jours" },
  { key: "newsletter", label: "Newsletter", description: "Actus CeSoir et nouveaux modes" },
];

export default function NotificationsPage() {
  const { settings, updateNotifications, loading } = useUserSettings();
  const [prefs, setPrefs] = useState<NotifPrefsShape>(defaults);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // First paint : localStorage (offline fallback).
  useEffect(() => {
    setPrefs(loadLocal());
  }, []);

  // Once server settings arrive, hydrate (server wins).
  useEffect(() => {
    if (loading) return;
    const merged = mergeDefaults(settings.notifications);
    setPrefs(merged);
    saveLocal(merged);
    setHydrated(true);
  }, [loading, settings.notifications]);

  const toggle = useCallback(
    (key: NotifKey) => {
      setPrefs((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveLocal(updated);
        // Persist to server (fire-and-forget, surface error via console only).
        updateNotifications({ [key]: updated[key] }).catch((err) => {
          console.error("[notifications] sync failed:", err);
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        return updated;
      });
    },
    [updateNotifications],
  );

  return (
    <div className="min-h-screen bg-bg px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-[20px] font-black mb-1">Notifications</h1>
      <p className="text-[13px] text-text-muted mb-6">
        Choisis ce que tu veux recevoir
      </p>

      <div className="space-y-3" aria-busy={!hydrated}>
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
              aria-label={t.label}
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
        <p className="text-center text-[13px] text-accent font-medium mt-4 animate-pulse" role="status">
          Preferences sauvegardees
        </p>
      )}
    </div>
  );
}

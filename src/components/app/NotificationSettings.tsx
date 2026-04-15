"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPrefs {
  smartTiming: boolean;
  modeAlerts: boolean;
  matchAlerts: boolean;
  chatMessages: boolean;
}

const STORAGE_KEY = "cesoir-notification-prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  smartTiming: true,
  modeAlerts: true,
  matchAlerts: true,
  chatMessages: true,
};

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Setting row
// ---------------------------------------------------------------------------

function SettingRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-semibold text-text cursor-pointer">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-text-muted">{description}</p>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save to localStorage
  const update = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // storage full or unavailable
        }
        return next;
      });
    },
    [],
  );

  if (!loaded) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-display text-lg font-bold text-text">Notifications</h3>

      <div className="glass-card divide-y divide-border px-5">
        <SettingRow
          id="smart-timing"
          label="Smart Timing"
          description="Notifications uniquement entre 17h et 23h"
          checked={prefs.smartTiming}
          onChange={(v) => update("smartTiming", v)}
        />
        <SettingRow
          id="mode-alerts"
          label="Alertes de mode"
          description="Quand ton mode est populaire pres de toi"
          checked={prefs.modeAlerts}
          onChange={(v) => update("modeAlerts", v)}
        />
        <SettingRow
          id="match-alerts"
          label="Alertes de match"
          description="Notification instantanee quand tu as un match"
          checked={prefs.matchAlerts}
          onChange={(v) => update("matchAlerts", v)}
        />
        <SettingRow
          id="chat-messages"
          label="Messages de chat"
          description="Recevoir les notifications de messages"
          checked={prefs.chatMessages}
          onChange={(v) => update("chatMessages", v)}
        />
      </div>
    </div>
  );
}

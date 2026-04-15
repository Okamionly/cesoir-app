// ── CeSoir i18n — lightweight, no external dependency ──────────
// Usage (future): const { t } = useTranslation();
//                 t("nav.explore") → "Explorer"

export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = "cesoir_locale";
const DEFAULT_LOCALE: Locale = "fr";

// ── Translation strings ──────────────────────────────

type TranslationTree = {
  nav: { explore: string; carte: string; chat: string; modes: string; profil: string };
  common: {
    save: string;
    cancel: string;
    back: string;
    next: string;
    loading: string;
    error: string;
    retry: string;
    close: string;
  };
  feed: { title: string; refresh: string; empty: string };
  chat: { placeholder: string; send: string; typing: string };
  profile: { title: string; edit: string; settings: string };
  premium: { title: string; cta: string };
};

const translations: Record<Locale, TranslationTree> = {
  fr: {
    nav: { explore: "Explorer", carte: "Carte", chat: "Chat", modes: "Modes", profil: "Profil" },
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      back: "Retour",
      next: "Suivant",
      loading: "Chargement...",
      error: "Erreur",
      retry: "Reessayer",
      close: "Fermer",
    },
    feed: { title: "En direct", refresh: "Actualiser", empty: "Rien pour le moment" },
    chat: { placeholder: "Message...", send: "Envoyer", typing: "ecrit..." },
    profile: { title: "Mon Profil", edit: "Modifier", settings: "Parametres" },
    premium: { title: "CeSoir Premium", cta: "Commencer l'essai gratuit" },
  },
  en: {
    nav: { explore: "Explore", carte: "Map", chat: "Chat", modes: "Modes", profil: "Profile" },
    common: {
      save: "Save",
      cancel: "Cancel",
      back: "Back",
      next: "Next",
      loading: "Loading...",
      error: "Error",
      retry: "Retry",
      close: "Close",
    },
    feed: { title: "Live", refresh: "Refresh", empty: "Nothing yet" },
    chat: { placeholder: "Message...", send: "Send", typing: "typing..." },
    profile: { title: "My Profile", edit: "Edit", settings: "Settings" },
    premium: { title: "CeSoir Premium", cta: "Start free trial" },
  },
};

// ── Locale read / write ──────────────────────────────

export function getLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) return stored as Locale;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LOCALE;
}

export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }
}

// ── Deep key access helper ───────────────────────────

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TranslationTree>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

// ── Hook ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";

/**
 * Returns a `t()` function that resolves dot-path keys against
 * the active locale's translation tree.
 *
 * Example: `const { t, locale } = useTranslation();`
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return getNestedValue(translations[locale] as unknown as Record<string, unknown>, key);
    },
    [locale],
  );

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  return { t, locale, changeLocale } as const;
}

"use client";

/**
 * EmptyStateContext — FR-FR copy dictionary for empty states (2026-04-23 design-audit).
 *
 * Goal: single source of truth for "empty feed / empty chat / empty events / ..." copy
 * so we stop duplicating strings across 9+ surfaces. Reuse via `useEmptyState(key)`:
 *
 *   const props = useEmptyState("feed");
 *   <EmptyState {...props} />
 *
 * Actions may be hrefs (navigation) or commands (caller implements), e.g. "reset" or
 * "share" or "pick_neighborhood". See `EmptyStateAction` below.
 */

import { useMemo } from "react";

export type EmptyStateKey =
  | "feed"
  | "browse"
  | "chat_list"
  | "chat_empty"
  | "events"
  | "modes"
  | "trending"
  | "squad"
  | "geoloc_denied"
  | "matches"
  | "notifications"
  | "search_no_results";

export type EmptyStateActionCommand =
  | "reset"
  | "share"
  | "pick_neighborhood"
  | "request_geoloc"
  | "retry";

export interface EmptyStateCta {
  label: string;
  /** Direct route (used by EmptyState component today). */
  href?: string;
  /** Imperative command — caller resolves via a handler map. */
  command?: EmptyStateActionCommand;
}

export interface EmptyStateCopy {
  emoji: string;
  title: string;
  subtitle?: string;
  cta: EmptyStateCta | null;
}

/** Master dictionary — FR-FR, keep copy < 80 chars for mobile viewports. */
export const EMPTY_STATES: Record<EmptyStateKey, EmptyStateCopy> = {
  feed: {
    emoji: "☾",
    title: "Pas encore d'activité",
    subtitle: "Les premiers plans arrivent ce soir.",
    cta: { label: "Explorer", href: "/browse" },
  },
  browse: {
    emoji: "🌙",
    title: "C'est tout pour ce soir",
    subtitle: "Reviens plus tard ou change de mode.",
    cta: { label: "Recommencer", command: "reset" },
  },
  chat_list: {
    emoji: "💬",
    title: "Pas encore de conversation",
    subtitle: "Le silence avant la magie. Découvre des profils.",
    cta: { label: "Découvrir", href: "/browse" },
  },
  chat_empty: {
    emoji: "✍️",
    title: "À toi de briser la glace",
    cta: null,
  },
  events: {
    emoji: "🎉",
    title: "Aucun event ce soir",
    subtitle: "Les venues Montpellier arrivent bientôt.",
    cta: null,
  },
  modes: {
    emoji: "🌟",
    title: "Pas de profils dans ce mode",
    subtitle: "Essaie un autre mode ou reviens plus tard.",
    cta: null,
  },
  trending: {
    emoji: "🔥",
    title: "Rien ne bouge encore",
    subtitle: "Les hotspots Montpellier se peupleront avec toi.",
    cta: { label: "Partager CeSoir", command: "share" },
  },
  squad: {
    emoji: "👥",
    title: "Squad vide",
    subtitle: "Crée ta squad ou rejoins via invite code.",
    cta: { label: "Créer", href: "/squad/new" },
  },
  geoloc_denied: {
    emoji: "📍",
    title: "Géoloc désactivée",
    subtitle: "Active la géoloc pour voir qui est près de toi.",
    cta: { label: "Choisir un quartier", command: "pick_neighborhood" },
  },
  matches: {
    emoji: "✨",
    title: "Pas encore de match",
    subtitle: "Swipe d'abord. Le reste suit.",
    cta: { label: "Swiper", href: "/browse" },
  },
  notifications: {
    emoji: "🔔",
    title: "Pas de notifications",
    subtitle: "Toutes tes alertes apparaîtront ici.",
    cta: null,
  },
  search_no_results: {
    emoji: "🔎",
    title: "Aucun résultat",
    subtitle: "Essaie un autre mot ou élargis ta recherche.",
    cta: null,
  },
};

/**
 * Adapt copy to the legacy `<EmptyState />` props shape:
 *   { emoji, title, subtitle?, actionLabel?, actionHref? }
 *
 * Commands without href are omitted — caller wraps with a handler (see docs).
 */
export function useEmptyState(key: EmptyStateKey) {
  return useMemo(() => {
    const copy = EMPTY_STATES[key];
    const action = copy.cta;
    return {
      emoji: copy.emoji,
      title: copy.title,
      subtitle: copy.subtitle,
      actionLabel: action?.href ? action.label : undefined,
      actionHref: action?.href,
      /** Exposed so callers can resolve commands (share/reset/etc.) themselves. */
      rawCta: action,
    } as const;
  }, [key]);
}

// ========================================
// CeSoir Smart Recommendation Engine
// Learns from user behavior to serve personalized content.
// Like Spotify's Discover Weekly — the user feels understood.
// ========================================

import type { ModeKey } from "./modes";
import { MODES } from "./modes";
import { type Profile } from "./mock-profiles";
import { type PopUpEvent } from "./popup-events";
import { calculateCompatibility, type CompatProfile } from "./compatibility";

// Mock profile/event arrays were removed 2026-04-20. The recommendation
// engine now seeds its scoring pipelines with empty arrays; once real data
// sources are wired (Supabase `profiles` + `events` tables), pass them into
// `getPersonalizedFeed` via a `dataset` argument rather than re-importing
// mocks.
const PROFILE_DATASET: Profile[] = [];
const EVENT_DATASET: PopUpEvent[] = [];

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type SocialStyle = "solo" | "duo" | "group" | "mixed";
export type BudgetTendency = "free" | "budget" | "moderate" | "premium";

export interface UserPreferences {
  topModes: ModeKey[];
  peakHours: number[];
  zones: string[];
  budget: BudgetTendency;
  socialStyle: SocialStyle;
  interests: string[];
}

export interface RecommendedProfile {
  profile: Profile;
  compatibility: number;
  reason: string;
  reasonIcon: string;
}

export interface RecommendedEvent {
  event: PopUpEvent;
  matchScore: number;
  reason: string;
  reasonIcon: string;
}

export interface RecommendedVenue {
  id: string;
  name: string;
  neighborhood: string;
  vibe: string;
  photo: string;
  reason: string;
  reasonIcon: string;
  rating: number;
}

export interface SmartNotification {
  id: string;
  type: "nearby" | "compatible" | "event" | "trending" | "timing";
  title: string;
  body: string;
  icon: string;
  priority: number;
  actionLabel?: string;
  actionRoute?: string;
}

export interface PersonalizedFeed {
  profiles: RecommendedProfile[];
  events: RecommendedEvent[];
  venues: RecommendedVenue[];
  trending: RecommendedEvent[];
}

// ─────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────

const PREFS_STORAGE_KEY = "cesoir_user_prefs";
const ACTIVITY_LOG_KEY = "cesoir_activity_log";

interface ActivityRecord {
  type: "mode_activation" | "event_attend" | "profile_view" | "venue_visit";
  mode?: ModeKey;
  zone?: string;
  hour: number;
  timestamp: number;
  isGroup?: boolean;
}

// ─────────────────────────────────────────
// Activity Logging
// ─────────────────────────────────────────

function loadActivityLog(): ActivityRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    return raw ? (JSON.parse(raw) as ActivityRecord[]) : [];
  } catch {
    return [];
  }
}

function saveActivityLog(log: ActivityRecord[]): void {
  if (typeof window === "undefined") return;
  // Keep last 500 records
  const trimmed = log.slice(-500);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmed));
}

export function logActivity(record: Omit<ActivityRecord, "timestamp" | "hour">): void {
  const log = loadActivityLog();
  const now = new Date();
  log.push({
    ...record,
    hour: now.getHours(),
    timestamp: Date.now(),
  });
  saveActivityLog(log);
}

// ─────────────────────────────────────────
// getUserPreferences — Analyze past behavior
// ─────────────────────────────────────────

export function getUserPreferences(_userId?: string): UserPreferences {
  const log = loadActivityLog();

  // --- Top Modes ---
  const modeCounts: Partial<Record<ModeKey, number>> = {};
  for (const record of log) {
    if (record.mode) {
      modeCounts[record.mode] = (modeCounts[record.mode] ?? 0) + 1;
    }
  }
  const sortedModes = (Object.entries(modeCounts) as [ModeKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([mode]) => mode);

  // Fallback: if no activity yet, use sensible defaults based on time
  const topModes = sortedModes.length > 0
    ? sortedModes.slice(0, 4)
    : getDefaultModes();

  // --- Peak Hours ---
  const hourCounts: Record<number, number> = {};
  for (const record of log) {
    hourCounts[record.hour] = (hourCounts[record.hour] ?? 0) + 1;
  }
  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([h]) => parseInt(h, 10));
  const peakHours = sortedHours.length > 0
    ? sortedHours.slice(0, 3)
    : [19, 20, 21]; // Default evening hours

  // --- Preferred Zones ---
  const zoneCounts: Record<string, number> = {};
  for (const record of log) {
    if (record.zone) {
      zoneCounts[record.zone] = (zoneCounts[record.zone] ?? 0) + 1;
    }
  }
  const sortedZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([zone]) => zone);
  const zones = sortedZones.length > 0
    ? sortedZones.slice(0, 3)
    : ["Le Marais", "Bastille", "Oberkampf"];

  // --- Budget Tendency ---
  const budget = inferBudget(topModes);

  // --- Social Style ---
  const groupCount = log.filter((r) => r.isGroup).length;
  const totalCount = log.length || 1;
  const groupRatio = groupCount / totalCount;
  let socialStyle: SocialStyle = "mixed";
  if (groupRatio > 0.7) socialStyle = "group";
  else if (groupRatio < 0.2) socialStyle = "solo";
  else if (groupRatio < 0.5) socialStyle = "duo";

  // --- Interests ---
  const interests = inferInterests(topModes);

  return {
    topModes,
    peakHours,
    zones,
    budget,
    socialStyle,
    interests,
  };
}

function getDefaultModes(): ModeKey[] {
  const hour = new Date().getHours();
  // Wave 15: 4 core modes only. TODO WAVE-16: expand once PMF validated.
  if (hour >= 22 || hour < 4) return ["night-owl", "solo-diner", "plus-one"];
  if (hour >= 18) return ["solo-diner", "plus-one", "foodie-quest"];
  if (hour >= 12) return ["foodie-quest", "plus-one"];
  return ["plus-one", "foodie-quest"];
}

function inferBudget(modes: ModeKey[]): BudgetTendency {
  // Wave 15: only active modes — killed modes removed.
  const budgetModes: Partial<Record<ModeKey, BudgetTendency>> = {
    "solo-diner": "moderate",
    "plus-one": "moderate",
    "night-owl": "budget",
    "foodie-quest": "premium",
  };
  const first = modes[0];
  if (first && budgetModes[first]) return budgetModes[first]!;
  return "moderate";
}

function inferInterests(modes: ModeKey[]): string[] {
  // Wave 15: only active modes.
  const modeInterests: Partial<Record<ModeKey, string[]>> = {
    "solo-diner": ["gastronomie", "vin", "conversation"],
    "plus-one": ["sorties", "evenements", "culture"],
    "night-owl": ["nuit", "musique", "aventure"],
    "foodie-quest": ["cuisine", "street-food", "decouverte culinaire"],
  };
  const interests = new Set<string>();
  for (const mode of modes) {
    const list = modeInterests[mode];
    if (list) list.forEach((i) => interests.add(i));
  }
  return Array.from(interests).slice(0, 8);
}

// ─────────────────────────────────────────
// Save / Load cached preferences
// ─────────────────────────────────────────

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

export function loadCachedPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserPreferences) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// getPersonalizedFeed — Generate recommendations
// ─────────────────────────────────────────

export function getPersonalizedFeed(prefs: UserPreferences): PersonalizedFeed {
  return {
    profiles: getRecommendedProfiles(prefs),
    events: getRecommendedEvents(prefs),
    venues: getRecommendedVenues(prefs),
    trending: getTrendingEvents(),
  };
}

// --- Recommended Profiles ---

function getRecommendedProfiles(prefs: UserPreferences): RecommendedProfile[] {
  const userProfile: CompatProfile = {
    modes: prefs.topModes,
    age: 28, // Default; real app would use actual user age
    langs: ["FR"],
  };

  const scored: RecommendedProfile[] = PROFILE_DATASET.map((profile) => {
    const profileCompat: CompatProfile = {
      modes: [profile.mode],
      age: profile.age,
      langs: profile.langs,
    };
    const compat = calculateCompatibility(userProfile, profileCompat);

    // Bonus for matching mode
    const modeMatch = prefs.topModes.includes(profile.mode);
    // Bonus for matching zone
    const zoneMatch = profile.neighborhood
      ? prefs.zones.some((z) => z.toLowerCase() === profile.neighborhood?.toLowerCase())
      : false;
    // Bonus for preferred time
    const timeMatch = prefs.peakHours.length > 0; // simplified

    const finalScore = Math.min(
      99,
      Math.round(compat + (modeMatch ? 10 : 0) + (zoneMatch ? 5 : 0) + (timeMatch ? 3 : 0)),
    );

    // Build reason
    let reason = "";
    let reasonIcon = "";
    if (modeMatch && zoneMatch) {
      const modeName = MODES[profile.mode]?.name ?? profile.mode;
      reason = `Aime ${modeName} dans ${profile.neighborhood}`;
      reasonIcon = "\uD83C\uDFAF"; // target emoji
    } else if (modeMatch) {
      const modeName = MODES[profile.mode]?.name ?? profile.mode;
      reason = `Parce que tu aimes ${modeName}`;
      reasonIcon = "\uD83C\uDFAF";
    } else if (zoneMatch) {
      reason = `Dans ton quartier`;
      reasonIcon = "\uD83D\uDCCD"; // pin emoji
    } else if (compat >= 70) {
      reason = `${finalScore}% compatible`;
      reasonIcon = "\u2728"; // sparkle
    } else {
      reason = `Profil interessant`;
      reasonIcon = "\uD83D\uDCA1"; // lightbulb
    }

    return {
      profile,
      compatibility: finalScore,
      reason,
      reasonIcon,
    };
  });

  // Sort by compatibility, take top 6
  return scored
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 6);
}

// --- Recommended Events ---

function getRecommendedEvents(prefs: UserPreferences): RecommendedEvent[] {
  const scored: RecommendedEvent[] = EVENT_DATASET.map((event) => {
    let score = 50; // base

    // Mode match
    if (prefs.topModes.includes(event.mode)) {
      score += 25;
    }

    // Zone match
    if (prefs.zones.some((z) => event.arrondissement.includes(z) || z.includes(event.arrondissement))) {
      score += 15;
    }

    // Availability (not full)
    if (event.currentAttendees < event.maxAttendees) {
      score += 10;
    }

    // Spots almost gone
    const spotsLeft = event.maxAttendees - event.currentAttendees;
    if (spotsLeft <= 3 && spotsLeft > 0) {
      score += 5;
    }

    const finalScore = Math.min(99, score);

    // Build reason
    let reason = "";
    let reasonIcon = "";
    const modeName = MODES[event.mode]?.name ?? event.mode;
    if (prefs.topModes.includes(event.mode)) {
      reason = `Parce que tu aimes ${modeName}`;
      reasonIcon = "\uD83C\uDFAF";
    } else if (spotsLeft <= 3 && spotsLeft > 0) {
      reason = `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""}`;
      reasonIcon = "\uD83D\uDD25"; // fire
    } else {
      reason = `${modeName} dans le ${event.arrondissement}`;
      reasonIcon = "\uD83D\uDCCD";
    }

    return {
      event,
      matchScore: finalScore,
      reason,
      reasonIcon,
    };
  });

  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

// --- Recommended Venues ---

const VENUE_DATA: Omit<RecommendedVenue, "reason" | "reasonIcon">[] = [
  { id: "v1", name: "Le Pastis", neighborhood: "Écusson", vibe: "Méridional créatif", photo: "", rating: 4.4 },
  { id: "v2", name: "Rooftop Belaroïa", neighborhood: "Port Marianne", vibe: "Rooftop & DJ", photo: "", rating: 4.6 },
  { id: "v3", name: "La Pleine Lune", neighborhood: "Figuerolles", vibe: "Bar à concerts underground", photo: "", rating: 4.5 },
  { id: "v4", name: "Le Rockstore", neighborhood: "Boutonnet", vibe: "Club rock mythique", photo: "", rating: 4.5 },
  { id: "v5", name: "Tamarillos", neighborhood: "Comédie", vibe: "Gastronomie végétale", photo: "", rating: 4.6 },
  { id: "v6", name: "Halle Tropisme", neighborhood: "Beaux-Arts", vibe: "Friche artistique", photo: "", rating: 4.6 },
  { id: "v7", name: "Le Petit Jardin", neighborhood: "Beaux-Arts", vibe: "Terrasse arborée", photo: "", rating: 4.5 },
  { id: "v8", name: "Café de l'Aqueduc", neighborhood: "Arceaux", vibe: "Terrasse face aux arches", photo: "", rating: 4.2 },
  { id: "v9", name: "Insensé", neighborhood: "Antigone", vibe: "Bistronomie sous arcades", photo: "", rating: 4.5 },
  { id: "v10", name: "Le Cherry Bomb", neighborhood: "Beaux-Arts", vibe: "Rock indé & bonne bière", photo: "", rating: 4.4 },
];

function getRecommendedVenues(prefs: UserPreferences): RecommendedVenue[] {
  const scored = VENUE_DATA.map((venue) => {
    const zoneMatch = prefs.zones.some(
      (z) => z.toLowerCase() === venue.neighborhood.toLowerCase(),
    );

    let reason = "";
    let reasonIcon = "";
    if (zoneMatch) {
      reason = `Dans ton quartier prefere`;
      reasonIcon = "\uD83D\uDCCD";
    } else {
      reason = `Quartier ${venue.neighborhood}`;
      reasonIcon = "\u2728";
    }

    return {
      ...venue,
      reason,
      reasonIcon,
      _zoneMatch: zoneMatch,
    };
  });

  // Prioritize zone matches, then by rating
  return scored
    .sort((a, b) => {
      if (a._zoneMatch !== b._zoneMatch) return a._zoneMatch ? -1 : 1;
      return b.rating - a.rating;
    })
    .map(({ _zoneMatch, ...rest }) => rest)
    .slice(0, 4);
}

// --- Trending Events ---

function getTrendingEvents(): RecommendedEvent[] {
  // Events with the most attendees relative to capacity
  const sorted = [...EVENT_DATASET]
    .sort((a, b) => {
      const ratioA = a.currentAttendees / a.maxAttendees;
      const ratioB = b.currentAttendees / b.maxAttendees;
      return ratioB - ratioA;
    });

  return sorted.slice(0, 3).map((event) => {
    const spotsLeft = event.maxAttendees - event.currentAttendees;
    const fillPercent = Math.round((event.currentAttendees / event.maxAttendees) * 100);
    return {
      event,
      matchScore: fillPercent,
      reason: spotsLeft <= 3
        ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""}`
        : `${fillPercent}% rempli`,
      reasonIcon: fillPercent >= 80 ? "\uD83D\uDD25" : "\uD83D\uDCC8", // fire or chart
    };
  });
}

// ─────────────────────────────────────────
// getSmartNotifications — Contextual push notifications
// ─────────────────────────────────────────

export function getSmartNotifications(prefs: UserPreferences): SmartNotification[] {
  const notifications: SmartNotification[] = [];
  const hour = new Date().getHours();

  // 1. Nearby activity (when user is usually active)
  if (prefs.peakHours.includes(hour) || prefs.peakHours.some((h) => Math.abs(h - hour) <= 1)) {
    const randomCount = 8 + Math.floor(Math.random() * 20);
    const topMode = prefs.topModes[0];
    const modeName = topMode ? MODES[topMode]?.name ?? topMode : "tes modes";
    notifications.push({
      id: "notif-nearby",
      type: "nearby",
      title: `${randomCount} personnes en mode ${modeName} près de toi`,
      body: `C'est ton heure preferee pour sortir — il y a du monde ce soir !`,
      icon: "\uD83D\uDCCD",
      priority: 8,
      actionLabel: "Voir",
      actionRoute: "/browse",
    });
  }

  // 2. High compatibility profile
  const profiles = getRecommendedProfiles(prefs);
  const topMatch = profiles[0];
  if (topMatch && topMatch.compatibility >= 80) {
    notifications.push({
      id: "notif-compatible",
      type: "compatible",
      title: `${topMatch.profile.name} (${topMatch.compatibility}% compatible) est active`,
      body: topMatch.profile.neighborhood
        ? `Vient d'arriver dans ${topMatch.profile.neighborhood}`
        : `Dispo ce soir — modes en commun`,
      icon: "\u2728",
      priority: 9,
      actionLabel: "Voir le profil",
      actionRoute: "/browse",
    });
  }

  // 3. Event matching preferences
  const events = getRecommendedEvents(prefs);
  const topEvent = events[0];
  if (topEvent) {
    const spotsLeft = topEvent.event.maxAttendees - topEvent.event.currentAttendees;
    notifications.push({
      id: "notif-event",
      type: "event",
      title: `${topEvent.event.title}`,
      body: spotsLeft <= 3
        ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""} — dépêche-toi !`
        : `Soirée ${MODES[topEvent.event.mode]?.name} dans le ${topEvent.event.arrondissement}`,
      icon: "\uD83C\uDF89", // party popper
      priority: 7,
      actionLabel: "Voir l'event",
      actionRoute: "/plans",
    });
  }

  // 4. Evening approaching
  if (hour >= 17 && hour <= 19) {
    const eventTime = 20 - hour;
    notifications.push({
      id: "notif-timing",
      type: "timing",
      title: `La soirée commence dans ${eventTime}h`,
      body: "Active un mode pour voir qui est dispo ce soir",
      icon: "\uD83D\uDD70\uFE0F", // clock
      priority: 6,
      actionLabel: "Choisir un mode",
      actionRoute: "/modes",
    });
  }

  // 5. Trending activity
  if (hour >= 20 && hour <= 23) {
    const zone = prefs.zones[0] ?? "Montpellier";
    notifications.push({
      id: "notif-trending",
      type: "trending",
      title: `Soirée animée à ${zone}`,
      body: `Beaucoup d'activité ce soir dans ton quartier préféré`,
      icon: "\uD83D\uDD25",
      priority: 5,
      actionLabel: "Explorer",
      actionRoute: "/map",
    });
  }

  // Sort by priority, return top 3
  return notifications
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

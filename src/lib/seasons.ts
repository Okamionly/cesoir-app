// ---------- Seasonal Engine ----------
// Detects current season/holiday and provides theme data,
// particle configs, and emoji sets for the entire app.

export type ParticleType =
  | "snowflakes"
  | "hearts"
  | "music-notes"
  | "leaves"
  | "fireworks"
  | "bats"
  | "confetti"
  | "petals"
  | "none";

export interface Season {
  name: string;
  gradient: [string, string];
  emoji: string;
  emojis: string[];
  particleType: ParticleType;
  specialMode: string | null;
  accent: string;
  accent2: string;
  greeting: string;
  isHoliday: boolean;
}

interface DateRange {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

interface HolidayDef {
  name: string;
  range: DateRange;
  season: Season;
}

// ── Date range check (supports year-wrapping) ──────────

function isInRange(date: Date, range: DateRange): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const current = m * 100 + d;
  const start = range.startMonth * 100 + range.startDay;
  const end = range.endMonth * 100 + range.endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Wraps around year end (e.g. Dec 20 → Jan 2)
  return current >= start || current <= end;
}

// ── Easter calculation (Anonymous Gregorian algorithm) ──

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isEasterPeriod(date: Date): boolean {
  const easter = getEasterDate(date.getFullYear());
  const start = new Date(easter);
  start.setDate(start.getDate() - 3); // 3 days before
  const end = new Date(easter);
  end.setDate(end.getDate() + 2); // 2 days after
  return date >= start && date <= end;
}

// ── Holidays (checked first, highest priority) ──────────

const HOLIDAYS: HolidayDef[] = [
  {
    name: "Nouvel An",
    range: { startMonth: 12, startDay: 31, endMonth: 1, endDay: 1 },
    season: {
      name: "Nouvel An",
      gradient: ["#F59E0B", "#8B5CF6"],
      emoji: "\uD83C\uDF89",
      emojis: ["\uD83C\uDF89", "\uD83C\uDF7E", "\u2728", "\uD83C\uDF86", "\uD83E\uDD42"],
      particleType: "fireworks",
      specialMode: "nouvel-an",
      accent: "#F59E0B",
      accent2: "#8B5CF6",
      greeting: "Bonne annee !",
      isHoliday: true,
    },
  },
  {
    name: "Noel",
    range: { startMonth: 12, startDay: 20, endMonth: 1, endDay: 2 },
    season: {
      name: "Noel",
      gradient: ["#EF4444", "#F59E0B"],
      emoji: "\uD83C\uDF84",
      emojis: ["\u2744\uFE0F", "\uD83C\uDF84", "\uD83C\uDF85", "\uD83C\uDF81", "\u2B50"],
      particleType: "snowflakes",
      specialMode: "noel",
      accent: "#EF4444",
      accent2: "#F59E0B",
      greeting: "Joyeux Noel !",
      isHoliday: true,
    },
  },
  {
    name: "Saint-Valentin",
    range: { startMonth: 2, startDay: 10, endMonth: 2, endDay: 15 },
    season: {
      name: "Saint-Valentin",
      gradient: ["#EC4899", "#F43F5E"],
      emoji: "\u2764\uFE0F",
      emojis: ["\uD83D\uDC95", "\uD83D\uDC98", "\u2764\uFE0F", "\uD83C\uDF39", "\uD83D\uDC8B"],
      particleType: "hearts",
      specialMode: "saint-valentin",
      accent: "#EC4899",
      accent2: "#F43F5E",
      greeting: "Bonne Saint-Valentin !",
      isHoliday: true,
    },
  },
  {
    name: "Fete de la Musique",
    range: { startMonth: 6, startDay: 21, endMonth: 6, endDay: 21 },
    season: {
      name: "Fete de la Musique",
      gradient: ["#8B5CF6", "#00FF88"],
      emoji: "\uD83C\uDFB5",
      emojis: ["\uD83C\uDFB5", "\uD83C\uDFB6", "\uD83C\uDFB8", "\uD83C\uDFA7", "\uD83C\uDFB9"],
      particleType: "music-notes",
      specialMode: "fete-musique",
      accent: "#8B5CF6",
      accent2: "#00FF88",
      greeting: "C'est la Fete de la Musique !",
      isHoliday: true,
    },
  },
  {
    name: "14 Juillet",
    range: { startMonth: 7, startDay: 13, endMonth: 7, endDay: 15 },
    season: {
      name: "14 Juillet",
      gradient: ["#2563EB", "#EF4444"],
      emoji: "\uD83C\uDDEB\uD83C\uDDF7",
      emojis: ["\uD83C\uDDEB\uD83C\uDDF7", "\uD83C\uDF86", "\u2728", "\uD83C\uDF89"],
      particleType: "confetti",
      specialMode: "14-juillet",
      accent: "#2563EB",
      accent2: "#EF4444",
      greeting: "Vive la France !",
      isHoliday: true,
    },
  },
  {
    name: "Halloween",
    range: { startMonth: 10, startDay: 25, endMonth: 11, endDay: 1 },
    season: {
      name: "Halloween",
      gradient: ["#F97316", "#111111"],
      emoji: "\uD83C\uDF83",
      emojis: ["\uD83C\uDF83", "\uD83D\uDC7B", "\uD83E\uDDDB", "\uD83E\uDD87", "\uD83D\uDD77\uFE0F"],
      particleType: "bats",
      specialMode: "halloween",
      accent: "#F97316",
      accent2: "#7C3AED",
      greeting: "Boo ! Joyeux Halloween !",
      isHoliday: true,
    },
  },
];

// ── Base seasons (fallback when no holiday) ─────────────

function getBaseSeason(date: Date): Season {
  const m = date.getMonth() + 1;

  // Check for Easter (variable date)
  if (isEasterPeriod(date)) {
    return {
      name: "Paques",
      gradient: ["#A7F3D0", "#FDE68A"],
      emoji: "\uD83D\uDC23",
      emojis: ["\uD83D\uDC23", "\uD83D\uDC30", "\uD83C\uDF38", "\uD83C\uDF37", "\uD83E\uDD5A"],
      particleType: "petals",
      specialMode: "paques",
      accent: "#22C55E",
      accent2: "#FBBF24",
      greeting: "Joyeuses Paques !",
      isHoliday: true,
    };
  }

  // Ete (Jun-Aug)
  if (m >= 6 && m <= 8) {
    return {
      name: "Ete",
      gradient: ["#F59E0B", "#06B6D4"],
      emoji: "\u2600\uFE0F",
      emojis: ["\u2600\uFE0F", "\uD83C\uDF34", "\uD83C\uDF0A", "\uD83C\uDF66", "\uD83D\uDE0E"],
      particleType: "none",
      specialMode: null,
      accent: "#F59E0B",
      accent2: "#06B6D4",
      greeting: "Profite de l'ete !",
      isHoliday: false,
    };
  }

  // Automne (Sep-Nov)
  if (m >= 9 && m <= 11) {
    return {
      name: "Automne",
      gradient: ["#F97316", "#92400E"],
      emoji: "\uD83C\uDF42",
      emojis: ["\uD83C\uDF42", "\uD83C\uDF41", "\uD83C\uDF43", "\uD83C\uDF44", "\u2615"],
      particleType: "leaves",
      specialMode: null,
      accent: "#F97316",
      accent2: "#92400E",
      greeting: "L'automne est beau ce soir",
      isHoliday: false,
    };
  }

  // Hiver (Dec-Feb)
  return {
    name: "Hiver",
    gradient: ["#06B6D4", "#8B5CF6"],
    emoji: "\u2744\uFE0F",
    emojis: ["\u2744\uFE0F", "\u26C4", "\uD83C\uDF28\uFE0F", "\uD83E\uDDE3", "\u2615"],
    particleType: "snowflakes",
    specialMode: null,
    accent: "#06B6D4",
    accent2: "#8B5CF6",
    greeting: "Les soirees d'hiver sont magiques",
    isHoliday: false,
  };
}

// ── Public API ──────────────────────────────────────────

/**
 * Returns the current Season object (holiday takes priority over base season).
 */
export function getCurrentSeason(date?: Date): Season {
  const now = date ?? new Date();

  // Holidays first — Nouvel An must beat Noel when Dec 31 / Jan 1
  for (const holiday of HOLIDAYS) {
    if (isInRange(now, holiday.range)) {
      return holiday.season;
    }
  }

  return getBaseSeason(now);
}

/**
 * Returns gradient + accent colors for the current season.
 */
export function getSeasonalTheme(date?: Date) {
  const season = getCurrentSeason(date);
  return {
    name: season.name,
    gradient: season.gradient,
    accent: season.accent,
    accent2: season.accent2,
    greeting: season.greeting,
    particleType: season.particleType,
  };
}

/**
 * Returns the emoji set for the current season.
 */
export function getSeasonalEmojis(date?: Date): string[] {
  return getCurrentSeason(date).emojis;
}

/**
 * Returns true if the current date falls on a holiday (not just a base season).
 */
export function isHoliday(date?: Date): boolean {
  return getCurrentSeason(date).isHoliday;
}

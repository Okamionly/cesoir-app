// ---------- Seasonal Theme Detector ----------

export interface SeasonalTheme {
  accent: string;
  accent2: string;
  icon: string;
  name: string;
  greeting: string;
}

interface DateRange {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

interface SeasonalEvent {
  name: string;
  range: DateRange;
  theme: SeasonalTheme;
}

// Check if a date falls within a date range (month/day only, ignoring year)
function isInRange(date: Date, range: DateRange): boolean {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();

  const startVal = range.startMonth * 100 + range.startDay;
  const endVal = range.endMonth * 100 + range.endDay;
  const currentVal = m * 100 + d;

  if (startVal <= endVal) {
    return currentVal >= startVal && currentVal <= endVal;
  }
  // Wraps around year end (e.g. Dec 20 - Jan 5)
  return currentVal >= startVal || currentVal <= endVal;
}

const EVENTS: SeasonalEvent[] = [
  {
    name: "Saint-Valentin",
    range: { startMonth: 2, startDay: 8, endMonth: 2, endDay: 15 },
    theme: {
      accent: "#ec4899",
      accent2: "#f43f5e",
      icon: "\u2764\uFE0F",
      name: "Saint-Valentin",
      greeting: "Bonne Saint-Valentin !",
    },
  },
  {
    name: "Halloween",
    range: { startMonth: 10, startDay: 25, endMonth: 11, endDay: 1 },
    theme: {
      accent: "#f97316",
      accent2: "#7c3aed",
      icon: "\uD83C\uDF83",
      name: "Halloween",
      greeting: "Boo ! Joyeux Halloween !",
    },
  },
  {
    name: "Noel",
    range: { startMonth: 12, startDay: 15, endMonth: 12, endDay: 26 },
    theme: {
      accent: "#ef4444",
      accent2: "#22c55e",
      icon: "\uD83C\uDF84",
      name: "Noel",
      greeting: "Joyeux Noel !",
    },
  },
  {
    name: "Nouvel An",
    range: { startMonth: 12, startDay: 27, endMonth: 1, endDay: 3 },
    theme: {
      accent: "#f59e0b",
      accent2: "#8B5CF6",
      icon: "\uD83C\uDF89",
      name: "Nouvel An",
      greeting: "Bonne annee !",
    },
  },
  {
    name: "Fete de la Musique",
    range: { startMonth: 6, startDay: 19, endMonth: 6, endDay: 22 },
    theme: {
      accent: "#8B5CF6",
      accent2: "#00FF88",
      icon: "\uD83C\uDFB5",
      name: "Fete de la Musique",
      greeting: "C'est la Fete de la Musique !",
    },
  },
];

// Seasonal fallbacks (spring, summer, autumn, winter)
function getSeasonFallback(date: Date): SeasonalTheme {
  const m = date.getMonth() + 1;

  if (m >= 3 && m <= 5) {
    return {
      accent: "#22c55e",
      accent2: "#f59e0b",
      icon: "\uD83C\uDF38",
      name: "Printemps",
      greeting: "Le printemps est la !",
    };
  }
  if (m >= 6 && m <= 8) {
    return {
      accent: "#f59e0b",
      accent2: "#06b6d4",
      icon: "\u2600\uFE0F",
      name: "Ete",
      greeting: "Profite de l'ete !",
    };
  }
  if (m >= 9 && m <= 11) {
    return {
      accent: "#f97316",
      accent2: "#92400e",
      icon: "\uD83C\uDF42",
      name: "Automne",
      greeting: "L'automne est beau ce soir",
    };
  }
  // Winter (Dec, Jan, Feb)
  return {
    accent: "#06b6d4",
    accent2: "#8B5CF6",
    icon: "\u2744\uFE0F",
    name: "Hiver",
    greeting: "Les soirees d'hiver sont magiques",
  };
}

/**
 * Detects the current season or holiday and returns the appropriate theme.
 * Holiday themes take priority over season defaults.
 */
export function getSeasonalTheme(date?: Date): SeasonalTheme {
  const now = date ?? new Date();

  // Check holidays first (higher priority)
  for (const event of EVENTS) {
    if (isInRange(now, event.range)) {
      return event.theme;
    }
  }

  // Fall back to season
  return getSeasonFallback(now);
}

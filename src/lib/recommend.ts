import type { ModeKey } from "./modes";

/**
 * Recommend modes based on time of day, day of week, and weather conditions.
 * Returns up to 3 recommended mode keys, best first.
 */
export function getRecommendedModes(options?: {
  hour?: number;
  dayOfWeek?: number; // 0=Sunday
  weather?: "clear" | "rain" | "cold" | "hot";
}): ModeKey[] {
  const now = new Date();
  const hour = options?.hour ?? now.getHours();
  const day = options?.dayOfWeek ?? now.getDay();
  const weather = options?.weather ?? "clear";

  const isWeekend = day === 0 || day === 6;
  const isEvening = hour >= 18 && hour < 22;
  const isLateNight = hour >= 22 || hour < 4;
  const isAfternoon = hour >= 12 && hour < 18;
  const isMorning = hour >= 6 && hour < 12;

  const scores: Partial<Record<ModeKey, number>> = {};

  function add(mode: ModeKey, points: number) {
    scores[mode] = (scores[mode] ?? 0) + points;
  }

  // --- Time-based ---
  if (isLateNight) {
    add("night-owl", 10);
    add("gamer-night", 5);
  }
  if (isEvening) {
    add("solo-diner", 8);
    add("plus-one", 7);
    add("foodie-quest", 6);
    add("culture-club", 5);
  }
  if (isAfternoon) {
    add("fit-date", 7);
    add("dog-date", 6);
    add("culture-club", 6);
    add("langue", 5);
  }
  if (isMorning) {
    add("fit-date", 8);
    add("dog-date", 7);
    add("sober-tonight", 4);
  }

  // --- Day-based ---
  if (isWeekend) {
    add("tourist", 7);
    add("foodie-quest", 5);
    add("culture-club", 5);
    add("fit-date", 4);
  } else {
    add("solo-diner", 5);
    add("langue", 5);
    add("plus-one", 3);
  }

  // --- Weather-based ---
  switch (weather) {
    case "rain":
      add("gamer-night", 6);
      add("culture-club", 5);
      add("sober-tonight", 4);
      add("breakup", 3);
      break;
    case "cold":
      add("sober-tonight", 5);
      add("foodie-quest", 5);
      add("gamer-night", 4);
      break;
    case "hot":
      add("fit-date", 5);
      add("dog-date", 5);
      add("tourist", 4);
      break;
    case "clear":
    default:
      add("dog-date", 4);
      add("fit-date", 4);
      add("tourist", 3);
      break;
  }

  // --- Check for seasonal dates ---
  const month = now.getMonth();
  const date = now.getDate();
  // December holiday season
  if (month === 11 && date >= 20) add("seasonal", 10);
  // NYE
  if (month === 11 && date === 31) add("seasonal", 15);
  // Valentine's
  if (month === 1 && date === 14) add("seasonal", 12);

  // Sort by score descending, take top 3
  const sorted = (Object.entries(scores) as [ModeKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([mode]) => mode);

  return sorted.slice(0, 3);
}

import type { ModeKey } from "./modes";

export interface CompatProfile {
  modes: ModeKey[];
  langs?: string[];
  age: number;
  lat?: number;
  lng?: number;
}

/**
 * Calculate a compatibility score (0-100) between two profiles.
 * Factors: common modes (40%), language overlap (20%), age proximity (20%), distance (20%).
 */
export function calculateCompatibility(
  profileA: CompatProfile,
  profileB: CompatProfile,
): number {
  // --- 1. Common modes (40 pts) ---
  const commonModes = profileA.modes.filter(m => profileB.modes.includes(m));
  const totalModes = new Set([...profileA.modes, ...profileB.modes]).size;
  const modeScore = totalModes > 0 ? (commonModes.length / totalModes) * 40 : 0;

  // --- 2. Language overlap (20 pts) ---
  const langsA = profileA.langs ?? [];
  const langsB = profileB.langs ?? [];
  let langScore = 0;
  if (langsA.length > 0 && langsB.length > 0) {
    const commonLangs = langsA.filter(l =>
      langsB.some(lb => lb.toLowerCase() === l.toLowerCase()),
    );
    const totalLangs = new Set([...langsA, ...langsB].map(l => l.toLowerCase())).size;
    langScore = (commonLangs.length / totalLangs) * 20;
  } else {
    // No language data — neutral, give half points
    langScore = 10;
  }

  // --- 3. Age proximity (20 pts) ---
  const ageDiff = Math.abs(profileA.age - profileB.age);
  // 0 diff = 20pts, 20+ diff = 0pts
  const ageScore = Math.max(0, 20 - ageDiff);

  // --- 4. Distance (20 pts) ---
  let distScore = 10; // default if no coords
  if (
    profileA.lat != null &&
    profileA.lng != null &&
    profileB.lat != null &&
    profileB.lng != null
  ) {
    const distKm = haversineKm(
      profileA.lat,
      profileA.lng,
      profileB.lat,
      profileB.lng,
    );
    // 0km = 20pts, 10+km = 0pts
    distScore = Math.max(0, 20 - distKm * 2);
  }

  const total = modeScore + langScore + ageScore + distScore;
  return Math.round(Math.min(100, Math.max(0, total)));
}

/** Haversine formula — returns distance in km */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

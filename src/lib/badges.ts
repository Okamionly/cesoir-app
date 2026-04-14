// ---------- Badge System ----------

export interface Badge {
  key: BadgeKey;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export type BadgeKey =
  | "verified"
  | "regular"
  | "ambassador"
  | "foodie"
  | "polyglotte"
  | "night-owl"
  | "dog-lover"
  | "early-adopter";

export const BADGES: Record<BadgeKey, Badge> = {
  verified: {
    key: "verified",
    label: "Verified",
    icon: "✅",
    description: "Profil verifie par video",
    color: "#22c55e",
  },
  regular: {
    key: "regular",
    label: "Regular",
    icon: "🌟",
    description: "10+ meetups realises",
    color: "#f59e0b",
  },
  ambassador: {
    key: "ambassador",
    label: "Ambassador",
    icon: "👑",
    description: "Ambassadeur de la communaute",
    color: "#8B5CF6",
  },
  foodie: {
    key: "foodie",
    label: "Foodie",
    icon: "🍽️",
    description: "10+ diners Solo Diner",
    color: "#ef4444",
  },
  polyglotte: {
    key: "polyglotte",
    label: "Polyglotte",
    icon: "🌐",
    description: "3+ langues pratiquees",
    color: "#06b6d4",
  },
  "night-owl": {
    key: "night-owl",
    label: "Night Owl",
    icon: "🌙",
    description: "5+ sorties nocturnes",
    color: "#6366f1",
  },
  "dog-lover": {
    key: "dog-lover",
    label: "Dog Lover",
    icon: "🐶",
    description: "Fan de Dog Date",
    color: "#f59e0b",
  },
  "early-adopter": {
    key: "early-adopter",
    label: "Early Adopter",
    icon: "🚀",
    description: "Parmi les premiers utilisateurs",
    color: "#ec4899",
  },
};

export interface UserStats {
  meetupCount: number;
  soloDinerCount: number;
  languagesCount: number;
  nightOutCount: number;
  dogDateCount: number;
  joinedAt: string; // ISO date
  isAmbassador: boolean;
}

export interface UserProfile {
  is_verified: boolean;
}

const EARLY_ADOPTER_CUTOFF = new Date("2027-01-01").getTime();

export function calculateBadges(
  profile: UserProfile,
  stats: UserStats,
): Badge[] {
  const active: Badge[] = [];

  if (profile.is_verified) {
    active.push(BADGES.verified);
  }

  if (stats.meetupCount >= 10) {
    active.push(BADGES.regular);
  }

  if (stats.isAmbassador) {
    active.push(BADGES.ambassador);
  }

  if (stats.soloDinerCount >= 10) {
    active.push(BADGES.foodie);
  }

  if (stats.languagesCount >= 3) {
    active.push(BADGES.polyglotte);
  }

  if (stats.nightOutCount >= 5) {
    active.push(BADGES["night-owl"]);
  }

  if (stats.dogDateCount >= 1) {
    active.push(BADGES["dog-lover"]);
  }

  if (new Date(stats.joinedAt).getTime() < EARLY_ADOPTER_CUTOFF) {
    active.push(BADGES["early-adopter"]);
  }

  return active;
}

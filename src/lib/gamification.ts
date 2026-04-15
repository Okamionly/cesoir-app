/**
 * CeSoir Gamification System
 * Levels, XP thresholds, rewards, and progression logic.
 */

// ─────────────────────────────────────────
// LEVEL DEFINITIONS — 20 levels, escalating XP
// ─────────────────────────────────────────

export interface LevelDef {
  level: number;
  xpRequired: number;
  title: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1,  xpRequired: 0,     title: "Nouveau" },
  { level: 2,  xpRequired: 50,    title: "Curieux" },
  { level: 3,  xpRequired: 150,   title: "Explorateur" },
  { level: 4,  xpRequired: 300,   title: "Sociable" },
  { level: 5,  xpRequired: 500,   title: "Social" },
  { level: 6,  xpRequired: 800,   title: "Connecte" },
  { level: 7,  xpRequired: 1200,  title: "Populaire" },
  { level: 8,  xpRequired: 1700,  title: "Influent" },
  { level: 9,  xpRequired: 2300,  title: "Magnetique" },
  { level: 10, xpRequired: 3000,  title: "Nocturne" },
  { level: 11, xpRequired: 4000,  title: "Etoile" },
  { level: 12, xpRequired: 5200,  title: "Rayonnant" },
  { level: 13, xpRequired: 6500,  title: "Charismatique" },
  { level: 14, xpRequired: 8000,  title: "Mythique" },
  { level: 15, xpRequired: 10000, title: "Legendaire" },
  { level: 16, xpRequired: 12500, title: "Phenomenal" },
  { level: 17, xpRequired: 15000, title: "Transcendant" },
  { level: 18, xpRequired: 17500, title: "Celeste" },
  { level: 19, xpRequired: 20000, title: "Divin" },
  { level: 20, xpRequired: 25000, title: "Icone" },
];

// ─────────────────────────────────────────
// XP REWARDS PER ACTION
// ─────────────────────────────────────────

export type XPAction =
  | "complete_profile"
  | "first_match"
  | "first_soiree"
  | "send_message"
  | "receive_good_review"
  | "daily_login"
  | "complete_challenge"
  | "invite_friend";

export interface XPRewardDef {
  action: XPAction;
  amount: number;
  label: string;
  description: string;
}

export const XP_REWARDS: Record<XPAction, XPRewardDef> = {
  complete_profile: {
    action: "complete_profile",
    amount: 50,
    label: "Profil complet",
    description: "Complete ton profil a 100%",
  },
  first_match: {
    action: "first_match",
    amount: 30,
    label: "Premier match",
    description: "Ton tout premier match",
  },
  first_soiree: {
    action: "first_soiree",
    amount: 40,
    label: "Premiere soiree",
    description: "Ta premiere rencontre IRL",
  },
  send_message: {
    action: "send_message",
    amount: 2,
    label: "Message envoye",
    description: "Envoie un message",
  },
  receive_good_review: {
    action: "receive_good_review",
    amount: 20,
    label: "Bonne review",
    description: "Recois une review positive",
  },
  daily_login: {
    action: "daily_login",
    amount: 5,
    label: "Connexion du jour",
    description: "Connecte-toi chaque jour",
  },
  complete_challenge: {
    action: "complete_challenge",
    amount: 0, // variable — set at call site
    label: "Challenge complete",
    description: "Termine un challenge quotidien",
  },
  invite_friend: {
    action: "invite_friend",
    amount: 100,
    label: "Ami invite",
    description: "Invite un ami qui rejoint CeSoir",
  },
};

/**
 * Get the fixed XP amount for a given action.
 * For complete_challenge, pass the variable amount separately.
 */
export function getXPForAction(action: XPAction): number {
  return XP_REWARDS[action].amount;
}

// ─────────────────────────────────────────
// LEVEL CALCULATION
// ─────────────────────────────────────────

export interface LevelInfo {
  level: number;
  title: string;
  currentXP: number;
  nextLevelXP: number;
  /** 0 to 1 progress toward next level */
  progress: number;
  /** Total XP the user has */
  totalXP: number;
}

/**
 * Calculate the user's current level and progress from total XP.
 */
export function calculateLevel(totalXP: number): LevelInfo {
  let current = LEVELS[0];
  let nextIdx = 1;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      nextIdx = i + 1;
      break;
    }
  }

  // If max level, set progress to 1
  if (nextIdx >= LEVELS.length) {
    return {
      level: current.level,
      title: current.title,
      currentXP: totalXP - current.xpRequired,
      nextLevelXP: 0,
      progress: 1,
      totalXP,
    };
  }

  const next = LEVELS[nextIdx];
  const xpInLevel = totalXP - current.xpRequired;
  const xpNeeded = next.xpRequired - current.xpRequired;
  const progress = xpNeeded > 0 ? Math.min(xpInLevel / xpNeeded, 1) : 1;

  return {
    level: current.level,
    title: current.title,
    currentXP: xpInLevel,
    nextLevelXP: xpNeeded,
    progress,
    totalXP,
  };
}

/**
 * Check whether adding XP would cause a level-up.
 * Returns the new level number if leveled up, or null.
 */
export function checkLevelUp(
  currentXP: number,
  xpToAdd: number,
): { oldLevel: number; newLevel: number; newTitle: string } | null {
  const oldInfo = calculateLevel(currentXP);
  const newInfo = calculateLevel(currentXP + xpToAdd);

  if (newInfo.level > oldInfo.level) {
    return {
      oldLevel: oldInfo.level,
      newLevel: newInfo.level,
      newTitle: newInfo.title,
    };
  }
  return null;
}

// ─────────────────────────────────────────
// LEVEL REWARDS — what you unlock per level
// ─────────────────────────────────────────

export interface LevelReward {
  type: "badge" | "feature" | "boost" | "cosmetic";
  label: string;
  description: string;
  icon: string;
}

const LEVEL_REWARDS: Record<number, LevelReward[]> = {
  2: [
    { type: "badge", label: "Badge Curieux", description: "Ton premier badge !", icon: "\u{1F31F}" },
  ],
  3: [
    { type: "feature", label: "Super Like", description: "Debloque les Super Likes", icon: "\u{2B50}" },
  ],
  4: [
    { type: "cosmetic", label: "Cadre Violet", description: "Cadre de profil violet", icon: "\u{1F7E3}" },
  ],
  5: [
    { type: "badge", label: "Badge Social", description: "Reconnu comme social", icon: "\u{1F91D}" },
    { type: "feature", label: "Mode Priorite", description: "Apparais en premier dans le feed", icon: "\u{1F680}" },
  ],
  7: [
    { type: "badge", label: "Badge Populaire", description: "Tu es populaire !", icon: "\u{1F525}" },
    { type: "boost", label: "Boost x2", description: "Double les points karma pendant 24h", icon: "\u{26A1}" },
  ],
  10: [
    { type: "badge", label: "Badge Nocturne", description: "Maitre de la nuit", icon: "\u{1F319}" },
    { type: "feature", label: "Profil Verifie+", description: "Badge de verification premium", icon: "\u{2705}" },
    { type: "cosmetic", label: "Aura Neon", description: "Aura neon sur ton profil", icon: "\u{1F4A0}" },
  ],
  12: [
    { type: "boost", label: "Boost Soiree", description: "Cree des soirees avec plus de places", icon: "\u{1F389}" },
  ],
  15: [
    { type: "badge", label: "Badge Legendaire", description: "Tu es une legende", icon: "\u{1F451}" },
    { type: "feature", label: "Acces VIP", description: "Acces aux soirees exclusives", icon: "\u{1F48E}" },
    { type: "cosmetic", label: "Cadre Dore", description: "Cadre de profil dore", icon: "\u{1F31F}" },
  ],
  18: [
    { type: "boost", label: "XP x3", description: "Triple XP pendant 48h", icon: "\u{1F4AB}" },
  ],
  20: [
    { type: "badge", label: "Badge Icone", description: "Tu es une icone de CeSoir", icon: "\u{1F3C6}" },
    { type: "feature", label: "Createur de Modes", description: "Cree tes propres modes", icon: "\u{2728}" },
    { type: "cosmetic", label: "Profil Holographique", description: "Effet holographique sur ton profil", icon: "\u{1F308}" },
  ],
};

/**
 * Get the rewards unlocked at a specific level.
 */
export function getLevelRewards(level: number): LevelReward[] {
  return LEVEL_REWARDS[level] ?? [];
}

/**
 * Get all rewards unlocked up to and including a level.
 */
export function getAllRewardsUpTo(level: number): { level: number; rewards: LevelReward[] }[] {
  return Object.entries(LEVEL_REWARDS)
    .filter(([lvl]) => Number(lvl) <= level)
    .map(([lvl, rewards]) => ({ level: Number(lvl), rewards }))
    .sort((a, b) => a.level - b.level);
}

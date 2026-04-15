export interface Achievement {
  key: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface AchievementStats {
  matchCount: number;
  messageCount: number;
  meetupCount: number;
  conversationCount: number;
  modesUsed: number;
  daysActive: number;
  profileComplete: boolean;
  firstReview: boolean;
  referralCount: number;
  streakMax: number;
}

interface AchievementDef {
  key: string;
  label: string;
  description: string;
  icon: string;
  check: (stats: AchievementStats) => boolean;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: "first-match",
    label: "Premier Match",
    description: "Tu as eu ton premier match !",
    icon: "\u2764\uFE0F",
    check: s => s.matchCount >= 1,
  },
  {
    key: "first-message",
    label: "Premier Message",
    description: "Tu as envoye ton premier message",
    icon: "\uD83D\uDCAC",
    check: s => s.messageCount >= 1,
  },
  {
    key: "first-meetup",
    label: "Premier RDV",
    description: "Tu as rencontre quelqu'un IRL !",
    icon: "\uD83E\uDD1D",
    check: s => s.meetupCount >= 1,
  },
  {
    key: "ten-conversations",
    label: "Bavard",
    description: "10 conversations engagees",
    icon: "\uD83D\uDDE3\uFE0F",
    check: s => s.conversationCount >= 10,
  },
  {
    key: "mode-explorer",
    label: "Mode Explorer",
    description: "Tu as utilise 5 modes differents",
    icon: "\uD83E\uDDED",
    check: s => s.modesUsed >= 5,
  },
  {
    key: "week-streak",
    label: "Assidu",
    description: "7 jours consecutifs sur CeSoir",
    icon: "\uD83D\uDD25",
    check: s => s.streakMax >= 7,
  },
  {
    key: "profile-complete",
    label: "Profil Complet",
    description: "Ton profil est 100% rempli",
    icon: "\u2705",
    check: s => s.profileComplete,
  },
  {
    key: "first-review",
    label: "Critique",
    description: "Tu as laisse ton premier feedback",
    icon: "\u2B50",
    check: s => s.firstReview,
  },
  {
    key: "ambassador",
    label: "Ambassadeur",
    description: "Tu as invite 5 amis",
    icon: "\uD83D\uDC51",
    check: s => s.referralCount >= 5,
  },
  {
    key: "thirty-days",
    label: "Veteran",
    description: "30 jours d'activite sur CeSoir",
    icon: "\uD83C\uDFC6",
    check: s => s.daysActive >= 30,
  },
];

/**
 * Check which achievements are unlocked based on user stats.
 */
export function checkAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENT_DEFS.map(def => ({
    key: def.key,
    label: def.label,
    description: def.description,
    icon: def.icon,
    unlocked: def.check(stats),
  }));
}

/**
 * Get only newly unlocked achievements (for notification purposes).
 */
export function getNewlyUnlocked(
  stats: AchievementStats,
  previouslyUnlocked: string[],
): Achievement[] {
  return checkAchievements(stats).filter(
    a => a.unlocked && !previouslyUnlocked.includes(a.key),
  );
}

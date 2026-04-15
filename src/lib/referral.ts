const REFERRAL_KEY = "cesoir_referral";
const INVITES_KEY = "cesoir_invites";

export type ReferralTier = "none" | "bronze" | "argent" | "or" | "diamant";

export interface ReferralInfo {
  code: string;
  tier: ReferralTier;
  tierLabel: string;
  tierIcon: string;
  inviteCount: number;
  nextTier: { name: string; remaining: number } | null;
}

const TIERS: { min: number; key: ReferralTier; label: string; icon: string }[] = [
  { min: 25, key: "diamant", label: "Diamant", icon: "\uD83D\uDC8E" },
  { min: 10, key: "or", label: "Or", icon: "\uD83E\uDD47" },
  { min: 5, key: "argent", label: "Argent", icon: "\uD83E\uDD48" },
  { min: 1, key: "bronze", label: "Bronze", icon: "\uD83E\uDD49" },
];

/**
 * Generate a unique referral code for a given user ID.
 * Deterministic: same userId always yields the same code.
 */
export function generateReferralCode(userId: string): string {
  // Simple hash-based code generation
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const code = `CESOIR-${Math.abs(hash).toString(36).toUpperCase().slice(0, 6)}`;
  return code;
}

/**
 * Track a new invitation (stores in localStorage for demo).
 * In production, this would call an API.
 */
export function trackInvite(referrerCode: string, inviteeId: string): void {
  if (typeof window === "undefined") return;
  const invites = getInvites(referrerCode);
  if (!invites.includes(inviteeId)) {
    invites.push(inviteeId);
    localStorage.setItem(`${INVITES_KEY}_${referrerCode}`, JSON.stringify(invites));
  }
}

function getInvites(code: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${INVITES_KEY}_${code}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function computeTier(count: number): { key: ReferralTier; label: string; icon: string } {
  for (const tier of TIERS) {
    if (count >= tier.min) return tier;
  }
  return { key: "none", label: "Aucun", icon: "" };
}

function computeNextTier(count: number): { name: string; remaining: number } | null {
  // Find the next tier above current count
  const sorted = [...TIERS].reverse(); // ascending by min
  for (const tier of sorted) {
    if (count < tier.min) {
      return { name: tier.label, remaining: tier.min - count };
    }
  }
  return null; // Already at max
}

/**
 * Get full referral info for a user.
 */
export function getReferralInfo(userId: string): ReferralInfo {
  const code = generateReferralCode(userId);
  const invites = getInvites(code);
  const count = invites.length;
  const tier = computeTier(count);
  const nextTier = computeNextTier(count);

  return {
    code,
    tier: tier.key,
    tierLabel: tier.label,
    tierIcon: tier.icon,
    inviteCount: count,
    nextTier,
  };
}

/**
 * Save referral code to localStorage (so the user can see it later).
 */
export function saveMyReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFERRAL_KEY, code);
}

/**
 * Get the user's own saved referral code.
 */
export function getMyReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRAL_KEY);
}

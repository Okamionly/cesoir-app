// ---------- Conversation Quality Score ----------

export interface ScoreMessage {
  senderId: string;
  content: string;
  timestamp: number; // ms
}

export interface ScoreBreakdown {
  total: number;
  lengthScore: number;
  reciprocityScore: number;
  responseTimeScore: number;
  engagementScore: number;
  label: string;
}

/**
 * Scores a conversation from 0-100 based on:
 * - Message length (are people writing real messages?)
 * - Reciprocity (is it balanced or one-sided?)
 * - Response time (are they responding quickly?)
 * - Engagement (questions asked, emojis used)
 *
 * "Bonne conversation!" badge if score > 70
 */
export function scoreConversation(messages: ScoreMessage[]): number {
  if (messages.length < 4) return 0; // Too few messages to score

  const breakdown = getScoreBreakdown(messages);
  return breakdown.total;
}

export function getScoreBreakdown(messages: ScoreMessage[]): ScoreBreakdown {
  if (messages.length < 4) {
    return {
      total: 0,
      lengthScore: 0,
      reciprocityScore: 0,
      responseTimeScore: 0,
      engagementScore: 0,
      label: "Trop tot",
    };
  }

  const lengthScore = scoreMsgLength(messages);
  const reciprocityScore = scoreReciprocity(messages);
  const responseTimeScore = scoreResponseTime(messages);
  const engagementScore = scoreEngagement(messages);

  // Weighted average
  const total = Math.round(
    lengthScore * 0.25 +
    reciprocityScore * 0.30 +
    responseTimeScore * 0.20 +
    engagementScore * 0.25,
  );

  const clamped = Math.max(0, Math.min(100, total));

  return {
    total: clamped,
    lengthScore,
    reciprocityScore,
    responseTimeScore,
    engagementScore,
    label: getLabel(clamped),
  };
}

// ---------- Sub-scores ----------

function scoreMsgLength(messages: ScoreMessage[]): number {
  const avgLen =
    messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;

  // <10 chars avg = low effort, 50+ chars = great
  if (avgLen >= 80) return 100;
  if (avgLen >= 50) return 85;
  if (avgLen >= 30) return 70;
  if (avgLen >= 15) return 50;
  return 20;
}

function scoreReciprocity(messages: ScoreMessage[]): number {
  const senders = new Map<string, number>();
  for (const m of messages) {
    senders.set(m.senderId, (senders.get(m.senderId) ?? 0) + 1);
  }

  if (senders.size < 2) return 0; // Monologue

  const counts = Array.from(senders.values());
  const max = Math.max(...counts);
  const min = Math.min(...counts);

  // Ratio of min/max — 1.0 = perfectly balanced
  const ratio = min / max;

  if (ratio >= 0.8) return 100;
  if (ratio >= 0.6) return 80;
  if (ratio >= 0.4) return 60;
  if (ratio >= 0.2) return 35;
  return 10;
}

function scoreResponseTime(messages: ScoreMessage[]): number {
  if (messages.length < 2) return 50;

  const delays: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].senderId !== messages[i - 1].senderId) {
      delays.push(messages[i].timestamp - messages[i - 1].timestamp);
    }
  }

  if (delays.length === 0) return 50;

  const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  const minutes = avgDelay / 60_000;

  // <2min = great, <10min = good, <30min = ok
  if (minutes <= 2) return 100;
  if (minutes <= 5) return 85;
  if (minutes <= 10) return 70;
  if (minutes <= 30) return 50;
  if (minutes <= 60) return 30;
  return 10;
}

function scoreEngagement(messages: ScoreMessage[]): number {
  let questions = 0;
  let emojis = 0;

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  for (const m of messages) {
    if (m.content.includes("?")) questions++;
    const emojiMatches = m.content.match(emojiRegex);
    if (emojiMatches) emojis += emojiMatches.length;
  }

  const questionRate = questions / messages.length;
  const emojiRate = emojis / messages.length;

  let score = 50; // baseline

  // Questions show interest
  if (questionRate >= 0.3) score += 25;
  else if (questionRate >= 0.15) score += 15;

  // Some emojis = friendly, too many = spammy
  if (emojiRate >= 0.3 && emojiRate <= 2) score += 20;
  else if (emojiRate > 0 && emojiRate < 0.3) score += 10;

  return Math.min(100, score);
}

// ---------- Labels ----------

function getLabel(score: number): string {
  if (score >= 85) return "Conversation au top !";
  if (score >= 70) return "Bonne conversation !";
  if (score >= 50) return "Ca avance bien";
  if (score >= 30) return "Debut prometteur";
  return "A rechauffer";
}

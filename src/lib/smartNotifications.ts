// ---------- Smart Notifications ----------

export type NotificationType =
  | "match"
  | "message"
  | "like"
  | "nearby"
  | "reminder"
  | "system";

export interface UserNotifPrefs {
  enabled: boolean;
  quietHoursStart: number; // 0-23
  quietHoursEnd: number;   // 0-23
  disabledTypes: NotificationType[];
  maxPerDay: number;
}

interface NotifRecord {
  type: NotificationType;
  timestamp: number;
}

const STORAGE_KEY = "cesoir_notif_log";
const PREFS_KEY = "cesoir_notif_prefs";
const DEFAULT_MAX_PER_DAY = 5;

// ---------- Persistence ----------

function loadNotifLog(): NotifRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotifRecord[]) : [];
  } catch {
    return [];
  }
}

function saveNotifLog(log: NotifRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

export function loadNotifPrefs(): UserNotifPrefs {
  if (typeof window === "undefined") {
    return getDefaultPrefs();
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as UserNotifPrefs) : getDefaultPrefs();
  } catch {
    return getDefaultPrefs();
  }
}

export function saveNotifPrefs(prefs: UserNotifPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function getDefaultPrefs(): UserNotifPrefs {
  return {
    enabled: true,
    quietHoursStart: 1,  // 1 AM
    quietHoursEnd: 8,    // 8 AM
    disabledTypes: [],
    maxPerDay: DEFAULT_MAX_PER_DAY,
  };
}

// ---------- Core Logic ----------

function isQuietHours(prefs: UserNotifPrefs): boolean {
  const hour = new Date().getHours();
  const { quietHoursStart, quietHoursEnd } = prefs;

  if (quietHoursStart <= quietHoursEnd) {
    return hour >= quietHoursStart && hour < quietHoursEnd;
  }
  // Wraps midnight (e.g. 23 -> 7)
  return hour >= quietHoursStart || hour < quietHoursEnd;
}

function getTodayNotifCount(): number {
  const log = loadNotifLog();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const cutoff = todayStart.getTime();
  return log.filter((r) => r.timestamp >= cutoff).length;
}

function getMinIntervalMs(type: NotificationType): number {
  switch (type) {
    case "match":
      return 0; // Always instant
    case "message":
      return 30_000; // 30s between message notifs
    case "like":
      return 5 * 60_000; // 5min between like notifs
    case "nearby":
      return 15 * 60_000; // 15min between proximity alerts
    case "reminder":
      return 60 * 60_000; // 1h between reminders
    case "system":
      return 0;
    default:
      return 60_000;
  }
}

/**
 * Determines whether a notification should be sent right now.
 *
 * Rules:
 * 1. User has notifications enabled
 * 2. Type is not disabled by user
 * 3. Not in quiet hours
 * 4. Daily cap not exceeded (max 5/day by default)
 * 5. Minimum interval since last notif of same type respected
 */
export function shouldNotify(
  type: NotificationType,
  lastNotif: number | null,
  userPrefs: UserNotifPrefs,
): boolean {
  // 1) Global toggle
  if (!userPrefs.enabled) return false;

  // 2) Type disabled
  if (userPrefs.disabledTypes.includes(type)) return false;

  // 3) Quiet hours
  if (isQuietHours(userPrefs)) return false;

  // 4) Daily cap
  const maxPerDay = userPrefs.maxPerDay ?? DEFAULT_MAX_PER_DAY;
  if (getTodayNotifCount() >= maxPerDay) return false;

  // 5) Minimum interval
  if (lastNotif !== null) {
    const elapsed = Date.now() - lastNotif;
    if (elapsed < getMinIntervalMs(type)) return false;
  }

  return true;
}

/**
 * Record that a notification was sent (for rate-limiting).
 */
export function recordNotification(type: NotificationType): void {
  const log = loadNotifLog();
  log.push({ type, timestamp: Date.now() });

  // Keep only last 24h of records
  const cutoff = Date.now() - 24 * 60 * 60_000;
  const trimmed = log.filter((r) => r.timestamp >= cutoff);
  saveNotifLog(trimmed);
}

/**
 * Get the timestamp of the last notification of a given type.
 */
export function getLastNotifTimestamp(type: NotificationType): number | null {
  const log = loadNotifLog();
  const matching = log.filter((r) => r.type === type);
  if (matching.length === 0) return null;
  return Math.max(...matching.map((r) => r.timestamp));
}

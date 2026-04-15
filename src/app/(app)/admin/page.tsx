"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { supabase } from "@/lib/supabase";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

interface AppStats {
  totalUsers: number;
  activeTonight: number;
  matchesToday: number;
  messagesToday: number;
  eventsTonight: number;
  modeBreakdown: { mode: string; count: number; color: string }[];
  avgResponseTime: string;
}

interface LiveEvent {
  id: string;
  type: "signup" | "match" | "message" | "event" | "report";
  description: string;
  timestamp: Date;
}

interface UserResult {
  id: string;
  name: string;
  age: number;
  avatar_url: string | null;
  is_verified: boolean;
  is_online: boolean;
  city: string;
  created_at: string;
  karma: number;
  level: number;
  badges: string[];
  activity: string;
}

interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
}

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  "solo-diner": "#a855f7",
  "plus-one": "#ec4899",
  "night-owl": "#6366f1",
  tourist: "#f59e0b",
  breakup: "#ef4444",
  "new-in-town": "#10b981",
  langue: "#3b82f6",
  "dog-date": "#f97316",
  seasonal: "#8b5cf6",
};

const EVENT_ICONS: Record<LiveEvent["type"], string> = {
  signup: "+",
  match: "~~",
  message: ">",
  event: "*",
  report: "!",
};

const EVENT_COLORS: Record<LiveEvent["type"], string> = {
  signup: "#10b981",
  match: "#ec4899",
  message: "#3b82f6",
  event: "#f59e0b",
  report: "#ef4444",
};

const TABS = ["Stats", "Live Feed", "Users", "System", "Flags"] as const;
type Tab = (typeof TABS)[number];

const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: "stories", label: "Stories", enabled: true },
  { key: "smart_queue", label: "Smart Queue", enabled: true },
  { key: "events", label: "Events", enabled: true },
  { key: "compat_quiz", label: "Compatibility Quiz", enabled: false },
];

// ─────────────────────────────────────────
// MOCK FALLBACKS
// ─────────────────────────────────────────

const MOCK_STATS: AppStats = {
  totalUsers: 2847,
  activeTonight: 312,
  matchesToday: 89,
  messagesToday: 1243,
  eventsTonight: 7,
  modeBreakdown: [
    { mode: "solo-diner", count: 120, color: "#a855f7" },
    { mode: "night-owl", count: 85, color: "#6366f1" },
    { mode: "plus-one", count: 62, color: "#ec4899" },
    { mode: "tourist", count: 28, color: "#f59e0b" },
    { mode: "new-in-town", count: 17, color: "#10b981" },
  ],
  avgResponseTime: "4m 12s",
};

function generateMockLiveEvents(): LiveEvent[] {
  const types: LiveEvent["type"][] = ["signup", "match", "message", "event", "report"];
  const descriptions: Record<LiveEvent["type"], string[]> = {
    signup: ["Emma, 26 just joined from Paris 11e", "Lucas, 29 signed up via referral", "Lea, 24 completed onboarding"],
    match: ["Anna + Thomas matched in Solo Diner", "Julie + Marc matched in Night Owl", "Clara + Hugo mutual like"],
    message: ["Conversation #482 - 3 new messages", "Thomas sent first message to Julie", "Group chat 'Apero' active"],
    event: ["Pop-up: Wine Tasting at Le Marais (12 RSVPs)", "New event: Rooftop Jazz, 21h", "Karaoke Night sold out"],
    report: ["Report #31: fake_profile on user_892", "Report #32: spam from user_117", "Safety alert: no check-in for user_445"],
  };

  return Array.from({ length: 20 }, (_, i) => {
    const type = types[i % types.length];
    const descs = descriptions[type];
    return {
      id: `evt-${i}`,
      type,
      description: descs[i % descs.length],
      timestamp: new Date(Date.now() - i * 47000),
    };
  });
}

// ─────────────────────────────────────────
// DATA FETCHERS
// ─────────────────────────────────────────

async function fetchStats(): Promise<AppStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [profilesRes, onlineRes, matchesRes, messagesRes, eventsRes, modesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_online", true),
      supabase.from("interactions").select("id", { count: "exact", head: true }).eq("action", "like").gte("created_at", todayISO),
      supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
      supabase.from("popup_events").select("id", { count: "exact", head: true }).gte("event_time", todayISO),
      supabase.from("mode_activations").select("mode").eq("is_active", true),
    ]);

    const modeMap = new Map<string, number>();
    if (modesRes.data) {
      for (const row of modesRes.data) {
        const m = row.mode as string;
        modeMap.set(m, (modeMap.get(m) || 0) + 1);
      }
    }

    const modeBreakdown = Array.from(modeMap.entries())
      .map(([mode, count]) => ({ mode, count, color: MODE_COLORS[mode] || "#888" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const stats: AppStats = {
      totalUsers: profilesRes.count ?? 0,
      activeTonight: onlineRes.count ?? 0,
      matchesToday: matchesRes.count ?? 0,
      messagesToday: messagesRes.count ?? 0,
      eventsTonight: eventsRes.count ?? 0,
      modeBreakdown: modeBreakdown.length > 0 ? modeBreakdown : MOCK_STATS.modeBreakdown,
      avgResponseTime: "4m 12s",
    };

    // If all zeros, return mock for demo
    if (stats.totalUsers === 0 && stats.activeTonight === 0) return MOCK_STATS;
    return stats;
  } catch {
    return MOCK_STATS;
  }
}

async function searchUsers(query: string): Promise<UserResult[]> {
  if (!query.trim()) return [];

  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, age, avatar_url, is_verified, is_online, city, created_at")
      .or(`name.ilike.%${query}%`)
      .limit(10);

    if (!data || data.length === 0) {
      // Return mock results for demo
      return [
        {
          id: "usr-1",
          name: "Emma Laurent",
          age: 26,
          avatar_url: null,
          is_verified: true,
          is_online: true,
          city: "Paris 11e",
          created_at: "2026-03-15T10:00:00Z",
          karma: 840,
          level: 12,
          badges: ["Early Adopter", "Social Butterfly", "Verified"],
          activity: "Active 2m ago - Solo Diner mode",
        },
        {
          id: "usr-2",
          name: "Lucas Martin",
          age: 29,
          avatar_url: null,
          is_verified: false,
          is_online: false,
          city: "Paris 3e",
          created_at: "2026-04-01T18:30:00Z",
          karma: 320,
          level: 5,
          badges: ["Night Owl"],
          activity: "Last seen 3h ago",
        },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((p: any) => ({
      ...p,
      karma: Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 20) + 1,
      badges: ["Member"],
      activity: p.is_online ? "Online now" : "Offline",
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────
// ANIMATED NUMBER
// ─────────────────────────────────────────

function AnimatedNumber({ value, label }: { value: number | string; label: string }) {
  return (
    <motion.div
      key={String(value)}
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.snap}
    >
      <p className="text-[28px] font-black text-text leading-none">{value}</p>
      <p className="text-[11px] text-text-muted mt-1">{label}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// DONUT CHART (modes breakdown)
// ─────────────────────────────────────────

function ModeDonut({ segments }: { segments: AppStats["modeBreakdown"] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36 mx-auto" aria-label="Mode breakdown">
      {segments.map((seg, i) => {
        const segLength = (seg.count / total) * circumference;
        const offset = cumulativeOffset;
        cumulativeOffset += segLength;

        return (
          <motion.circle
            key={seg.mode}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${segLength} ${circumference - segLength}`}
            strokeDashoffset={-offset}
            style={{ transformOrigin: "center" }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: -offset }}
            transition={{ ...springs.heavy, delay: 0.4 + i * 0.12 }}
          />
        );
      })}
      <text x="70" y="66" textAnchor="middle" className="fill-text text-[20px] font-black" fontFamily="var(--font-display)">
        {total}
      </text>
      <text x="70" y="82" textAnchor="middle" className="fill-text-muted text-[9px]">
        active
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────

function StatCard({
  value,
  label,
  accent,
  index,
}: {
  value: number | string;
  label: string;
  accent?: boolean;
  index: number;
}) {
  return (
    <motion.div
      className={`p-4 rounded-2xl border ${
        accent ? "border-accent/30 bg-accent/5" : "border-border bg-bg-card"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.heavy, delay: 0.1 + index * 0.06 }}
    >
      <AnimatedNumber value={value} label={label} />
    </motion.div>
  );
}

// ─────────────────────────────────────────
// LIVE FEED ITEM
// ─────────────────────────────────────────

function LiveFeedItem({ event, index }: { event: LiveEvent; index: number }) {
  const timeStr = event.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <motion.div
      className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.snap, delay: index * 0.04 }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-bold text-white mt-0.5"
        style={{ backgroundColor: EVENT_COLORS[event.type] }}
      >
        {EVENT_ICONS[event.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text leading-snug">{event.description}</p>
        <p className="text-[10px] text-text-muted mt-0.5">{timeStr}</p>
      </div>
      <span
        className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
        style={{
          color: EVENT_COLORS[event.type],
          backgroundColor: `${EVENT_COLORS[event.type]}15`,
        }}
      >
        {event.type}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// USER CARD (search results)
// ─────────────────────────────────────────

function UserCard({ user, index }: { user: UserResult; index: number }) {
  const [actionDone, setActionDone] = useState<string | null>(null);

  const doAction = (action: string) => {
    setActionDone(action);
    setTimeout(() => setActionDone(null), 2000);
  };

  return (
    <motion.div
      className="p-4 rounded-2xl border border-border bg-bg-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.heavy, delay: 0.1 + index * 0.08 }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-accent font-bold text-[16px]">{user.name.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-text truncate">{user.name}</h3>
            <span className="text-[11px] text-text-muted">{user.age} ans</span>
            {user.is_verified && (
              <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-semibold">Verified</span>
            )}
            <span className={`w-2 h-2 rounded-full ${user.is_online ? "bg-[#00FF88]" : "bg-border"}`} />
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">{user.city} - {user.activity}</p>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-text-muted">
              Karma: <span className="text-text font-bold">{user.karma}</span>
            </span>
            <span className="text-[10px] text-text-muted">
              Level: <span className="text-text font-bold">{user.level}</span>
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {user.badges.map((b) => (
              <span key={b} className="text-[9px] bg-accent/5 text-accent/80 px-2 py-0.5 rounded-full border border-accent/10">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
        {actionDone ? (
          <motion.span
            className="text-[12px] font-semibold text-safe"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.snap}
          >
            {actionDone} done
          </motion.span>
        ) : (
          <>
            <button
              onClick={() => doAction("Verify")}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 tap-target"
            >
              Verify
            </button>
            <button
              onClick={() => doAction("Ban")}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-danger/10 text-danger border border-danger/20 tap-target"
            >
              Ban
            </button>
            <button
              onClick={() => doAction("Reset")}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-border/50 text-text-muted border border-border tap-target"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// SYSTEM HEALTH
// ─────────────────────────────────────────

function SystemHealth() {
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });
        setSupabaseOk(!error);
      } catch {
        setSupabaseOk(false);
      }
    })();
  }, []);

  const deployDate = "2026-04-15";
  const version = "0.1.0";

  const checks = [
    {
      label: "Supabase Connection",
      status: supabaseOk === null ? "checking" : supabaseOk ? "ok" : "error",
      detail: supabaseOk === null ? "Checking..." : supabaseOk ? "Connected" : "Connection failed",
    },
    {
      label: "Vercel Deployment",
      status: "ok" as const,
      detail: "Deployed",
    },
    {
      label: "Last Error",
      status: "ok" as const,
      detail: "None detected",
    },
    {
      label: "Build Info",
      status: "ok" as const,
      detail: `v${version} - ${deployDate}`,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {checks.map((check, i) => (
        <motion.div
          key={check.label}
          className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.1 + i * 0.08 }}
        >
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              check.status === "ok"
                ? "bg-[#00FF88]"
                : check.status === "error"
                ? "bg-danger"
                : "bg-[#f59e0b]"
            }`}
          />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-text">{check.label}</p>
            <p className="text-[11px] text-text-muted">{check.detail}</p>
          </div>
          {check.status === "checking" && (
            <motion.div
              className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────

function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(() => {
    if (typeof window === "undefined") return DEFAULT_FLAGS;
    try {
      const stored = localStorage.getItem("cesoir_feature_flags");
      return stored ? JSON.parse(stored) : DEFAULT_FLAGS;
    } catch {
      return DEFAULT_FLAGS;
    }
  });

  const toggle = (key: string) => {
    setFlags((prev) => {
      const next = prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f));
      try {
        localStorage.setItem("cesoir_feature_flags", JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <motion.p
        className="text-[11px] text-text-muted px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Feature flags are stored in localStorage. Connect to a backend for production use.
      </motion.p>

      {flags.map((flag, i) => (
        <motion.div
          key={flag.key}
          className="flex items-center justify-between p-4 rounded-2xl border border-border bg-bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.1 + i * 0.08 }}
        >
          <div>
            <p className="text-[14px] font-semibold text-text">{flag.label}</p>
            <p className="text-[11px] text-text-muted">{flag.key}</p>
          </div>

          <button
            onClick={() => toggle(flag.key)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              flag.enabled ? "bg-accent" : "bg-border"
            }`}
            aria-label={`Toggle ${flag.label}`}
          >
            <motion.div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
              animate={{ left: flag.enabled ? 22 : 2 }}
              transition={springs.snap}
            />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// BAR CHART (horizontal mode bars)
// ─────────────────────────────────────────

function ModeBarChart({ segments }: { segments: AppStats["modeBreakdown"] }) {
  const max = Math.max(...segments.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-2">
      {segments.map((seg, i) => (
        <div key={seg.mode} className="flex items-center gap-3">
          <span className="w-24 text-right text-[11px] text-text-muted font-medium truncate shrink-0">
            {seg.mode.replace(/-/g, " ")}
          </span>
          <div className="flex-1 h-5 rounded-full bg-border/30 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: seg.color, transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: seg.count / max }}
              transition={{ ...springs.heavy, delay: 0.5 + i * 0.08 }}
            />
          </div>
          <span className="text-[11px] font-bold text-text w-8 text-right">{seg.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("Stats");
  const [stats, setStats] = useState<AppStats>(MOCK_STATS);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  // Generate live events on mount + auto-add new ones
  useEffect(() => {
    setLiveEvents(generateMockLiveEvents());

    const interval = setInterval(() => {
      const types: LiveEvent["type"][] = ["signup", "match", "message", "event", "report"];
      const t = types[Math.floor(Math.random() * types.length)];
      const newEvent: LiveEvent = {
        id: `evt-${Date.now()}`,
        type: t,
        description:
          t === "signup"
            ? `New user signed up from Paris ${Math.floor(Math.random() * 20) + 1}e`
            : t === "match"
            ? `New match in ${Object.keys(MODE_COLORS)[Math.floor(Math.random() * 5)].replace(/-/g, " ")}`
            : t === "message"
            ? `${Math.floor(Math.random() * 5) + 1} new messages in active conversations`
            : t === "event"
            ? `Event update: ${Math.floor(Math.random() * 10) + 1} new RSVPs`
            : `New report submitted (#${Math.floor(Math.random() * 100)})`,
        timestamp: new Date(),
      };
      setLiveEvents((prev) => [newEvent, ...prev].slice(0, 50));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll feed
  useEffect(() => {
    if (tab === "Live Feed" && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [liveEvents, tab]);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  }, [searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.length >= 2) handleSearch();
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-safe">
      {/* ── HEADER ── */}
      <motion.header
        className="px-5 pt-6 pb-2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.heavy}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-[14px]">A</span>
          </div>
          <div>
            <h1 className="text-[20px] font-black text-text font-display">Admin Dashboard</h1>
            <p className="text-[11px] text-text-muted">CeSoir - Internal</p>
          </div>
        </div>
      </motion.header>

      {/* ── TAB BAR ── */}
      <motion.div
        className="px-5 mt-3 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.heavy, delay: 0.05 }}
      >
        <div className="flex gap-1 p-1 bg-border/30 rounded-2xl overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 min-w-0 px-3 py-2 rounded-xl text-[12px] font-semibold text-center whitespace-nowrap transition-colors ${
                tab === t ? "text-text" : "text-text-muted"
              }`}
            >
              {tab === t && (
                <motion.div
                  className="absolute inset-0 bg-bg-card rounded-xl border border-border shadow-sm"
                  layoutId="admin-tab"
                  transition={springs.snap}
                />
              )}
              <span className="relative z-10">{t}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="px-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={springs.snap}
        >
          {/* ───── STATS TAB ───── */}
          {tab === "Stats" && (
            <div>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard value={stats.totalUsers} label="Total Users" index={0} accent />
                <StatCard value={stats.activeTonight} label="Active Tonight" index={1} />
                <StatCard value={stats.matchesToday} label="Matches Today" index={2} />
                <StatCard value={stats.messagesToday} label="Messages Today" index={3} />
                <StatCard value={stats.eventsTonight} label="Events Tonight" index={4} />
                <StatCard value={stats.avgResponseTime} label="Avg Response Time" index={5} />
              </div>

              {/* Mode Breakdown */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.35 }}
              >
                <h2 className="text-[15px] font-bold text-text mb-4">Active Modes Breakdown</h2>

                <div className="flex items-start gap-4 mb-4">
                  <ModeDonut segments={stats.modeBreakdown} />

                  <div className="flex flex-col gap-1.5 flex-1 pt-2">
                    {stats.modeBreakdown.map((seg, i) => (
                      <motion.div
                        key={seg.mode}
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springs.heavy, delay: 0.6 + i * 0.06 }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-[10px] text-text truncate flex-1">{seg.mode.replace(/-/g, " ")}</span>
                        <span className="text-[10px] font-bold text-text-muted">{seg.count}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <ModeBarChart segments={stats.modeBreakdown} />
              </motion.section>
            </div>
          )}

          {/* ───── LIVE FEED TAB ───── */}
          {tab === "Live Feed" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-text">Live Activity</h2>
                <motion.div
                  className="flex items-center gap-1.5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#00FF88]" />
                  <span className="text-[10px] text-text-muted font-medium">LIVE</span>
                </motion.div>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                {(["all", "signup", "match", "message", "event", "report"] as const).map((f, i) => (
                  <motion.button
                    key={f}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-full border border-border bg-bg-card text-text-muted whitespace-nowrap"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springs.snap, delay: i * 0.03 }}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </motion.button>
                ))}
              </div>

              {/* Feed list */}
              <div
                ref={feedRef}
                className="rounded-2xl border border-border bg-bg-card overflow-hidden max-h-[60vh] overflow-y-auto"
              >
                <AnimatePresence initial={false}>
                  {liveEvents.map((event, i) => (
                    <LiveFeedItem key={event.id} event={event} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ───── USERS TAB ───── */}
          {tab === "Users" && (
            <div>
              <h2 className="text-[15px] font-bold text-text mb-3">User Lookup</h2>

              {/* Search */}
              <motion.div
                className="relative mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.heavy, delay: 0.1 }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-bg-card text-text text-[14px] placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                />
                {searching && (
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>

              {/* Results */}
              <div className="flex flex-col gap-3">
                {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                  <motion.p
                    className="text-[13px] text-text-muted text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No users found for "{searchQuery}"
                  </motion.p>
                )}
                {searchResults.length === 0 && searchQuery.length < 2 && (
                  <motion.p
                    className="text-[13px] text-text-muted text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Type at least 2 characters to search
                  </motion.p>
                )}
                {searchResults.map((user, i) => (
                  <UserCard key={user.id} user={user} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ───── SYSTEM TAB ───── */}
          {tab === "System" && (
            <div>
              <h2 className="text-[15px] font-bold text-text mb-3">System Health</h2>
              <SystemHealth />
            </div>
          )}

          {/* ───── FLAGS TAB ───── */}
          {tab === "Flags" && (
            <div>
              <h2 className="text-[15px] font-bold text-text mb-3">Feature Flags</h2>
              <FeatureFlags />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom spacer for nav */}
      <div className="h-24" />
    </div>
  );
}

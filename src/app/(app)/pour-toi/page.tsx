"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { MODES } from "@/lib/modes";
import {
  getUserPreferences,
  getPersonalizedFeed,
  savePreferences,
  type UserPreferences,
  type PersonalizedFeed,
  type RecommendedProfile,
  type RecommendedEvent,
  type RecommendedVenue,
} from "@/lib/recommendations";
import RecommendationCard from "@/components/app/RecommendationCard";
import SmartBanner from "@/components/app/SmartBanner";

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function PourToiPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [feed, setFeed] = useState<PersonalizedFeed | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load preferences and feed
  const loadFeed = useCallback(() => {
    const userPrefs = getUserPreferences();
    setPrefs(userPrefs);
    const personalizedFeed = getPersonalizedFeed(userPrefs);
    setFeed(personalizedFeed);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Pull-to-refresh simulation
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadFeed();
      setRefreshing(false);
    }, 800);
  }, [loadFeed]);

  if (!prefs || !feed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.snap}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="px-4 pt-12 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Pour toi</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {prefs.topModes.slice(0, 2).map((m) => MODES[m]?.name).join(" & ")}
              {prefs.zones[0] ? ` \u00B7 ${prefs.zones[0]}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-colors"
              aria-label="Rafraichir"
            >
              <motion.svg
                animate={refreshing ? { rotate: 360 } : {}}
                transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-3.2-6.87" />
                <path d="M21 3v6h-6" />
              </motion.svg>
            </button>

            {/* Preferences button */}
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.1] transition-colors"
              aria-label="Tes gouts"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Smart Banner */}
      <div className="mt-3">
        <SmartBanner />
      </div>

      {/* Preferences Panel */}
      <AnimatePresence>
        {showPrefs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.snap}
            className="mx-4 mb-4 overflow-hidden"
          >
            <PrefsPanel prefs={prefs} onUpdate={(p) => { setPrefs(p); savePreferences(p); loadFeed(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 1: Profils pour toi */}
      <Section
        title="Profils pour toi"
        subtitle={`${feed.profiles.length} personnes compatibles`}
        index={0}
      >
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {feed.profiles.map((rec, i) => (
            <RecommendationCard
              key={rec.profile.id}
              photo={rec.profile.photo}
              title={rec.profile.name}
              subtitle={`${rec.profile.age} ans \u00B7 ${rec.profile.distance} km`}
              reason={rec.reason}
              reasonIcon={rec.reasonIcon}
              compatibility={rec.compatibility}
              ctaLabel="Voir"
              onCta={() => {}}
              onClick={() => {}}
              accentColor={rec.profile.color}
              variant="standard"
              index={i}
            />
          ))}
        </div>
      </Section>

      {/* Section 2: Soirees recommandees */}
      <Section
        title="Soirees recommandees"
        subtitle="Correspondent a tes gouts"
        index={1}
      >
        <div className="px-4 space-y-3">
          {feed.events.map((rec, i) => (
            <EventCard key={rec.event.id} rec={rec} index={i} />
          ))}
        </div>
      </Section>

      {/* Section 3: Lieux a decouvrir */}
      <Section
        title="Lieux a decouvrir"
        subtitle={`Dans ${prefs.zones[0] ?? "Paris"} et alentours`}
        index={2}
      >
        <div className="grid grid-cols-2 gap-3 px-4">
          {feed.venues.map((venue, i) => (
            <VenueCard key={venue.id} venue={venue} index={i} />
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
  index,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay: 0.2 + index * 0.15 }}
      className="mb-8"
    >
      <div className="px-4 mb-3">
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// ─────────────────────────────────────────
// Event Card (wide variant)
// ─────────────────────────────────────────

function EventCard({ rec, index }: { rec: RecommendedEvent; index: number }) {
  const spotsLeft = rec.event.maxAttendees - rec.event.currentAttendees;
  const modeDef = MODES[rec.event.mode];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.gentle, delay: index * 0.1 }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:border-white/[0.15] transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Mode icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${modeDef?.color ?? "#8B5CF6"}20` }}
        >
          {modeDef?.icon ?? "\uD83C\uDF89"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-[#8B5CF6]/60 font-medium">
            Recommande pour toi
          </p>
          <h3 className="text-sm font-semibold text-white mt-0.5 line-clamp-1">
            {rec.event.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/40">
              {rec.event.time} \u00B7 {rec.event.venue}
            </span>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-2">
            {/* Reason tag */}
            <div className="flex items-center gap-1 bg-white/[0.06] rounded-full px-2 py-1">
              <span className="text-[10px]">{rec.reasonIcon}</span>
              <span className="text-[10px] text-white/60">{rec.reason}</span>
            </div>

            {/* Spots indicator */}
            <div className="flex items-center gap-1.5">
              {/* Attendee dots */}
              <div className="flex -space-x-1">
                {rec.event.attendees.slice(0, 3).map((a) => (
                  <img
                    key={a.id}
                    src={a.avatar}
                    alt={a.name}
                    className="w-5 h-5 rounded-full border border-black"
                    loading="lazy"
                  />
                ))}
              </div>
              <span className={`text-[10px] font-medium ${spotsLeft <= 3 ? "text-[#EF4444]" : "text-white/40"}`}>
                {spotsLeft} place{spotsLeft > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Venue Card
// ─────────────────────────────────────────

function VenueCard({ venue, index }: { venue: RecommendedVenue; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springs.gentle, delay: 0.1 + index * 0.08 }}
      whileTap={{ scale: 0.97 }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden cursor-pointer hover:border-white/[0.15] transition-colors"
    >
      {/* Gradient header */}
      <div
        className="h-20 relative"
        style={{
          background: `linear-gradient(135deg, #8B5CF620, #00FF8810)`,
        }}
      >
        {/* Rating */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <span className="text-[10px] text-yellow-400">{"\u2605"}</span>
          <span className="text-[10px] text-white/80 font-medium">{venue.rating}</span>
        </div>
      </div>

      <div className="p-3">
        <p className="text-[9px] uppercase tracking-wider text-[#8B5CF6]/60 font-medium">
          Recommande pour toi
        </p>
        <h3 className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
          {venue.name}
        </h3>
        <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">
          {venue.vibe}
        </p>

        {/* Reason */}
        <div className="flex items-center gap-1 mt-2 bg-white/[0.06] rounded-full px-2 py-1 w-fit">
          <span className="text-[10px]">{venue.reasonIcon}</span>
          <span className="text-[10px] text-white/60 truncate">{venue.reason}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Preferences Panel
// ─────────────────────────────────────────

function PrefsPanel({
  prefs,
  onUpdate,
}: {
  prefs: UserPreferences;
  onUpdate: (p: UserPreferences) => void;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
      <h3 className="text-sm font-bold text-white mb-3">Tes gouts</h3>

      {/* Top Modes */}
      <div className="mb-4">
        <p className="text-xs text-white/40 mb-2">Modes preferes</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODES) as Array<keyof typeof MODES>).map((modeKey) => {
            const mode = MODES[modeKey];
            const isActive = prefs.topModes.includes(modeKey);
            return (
              <button
                key={modeKey}
                onClick={() => {
                  const newModes = isActive
                    ? prefs.topModes.filter((m) => m !== modeKey)
                    : [...prefs.topModes, modeKey];
                  onUpdate({ ...prefs, topModes: newModes });
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isActive
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/40 hover:text-white/60"
                }`}
              >
                {mode.icon} {mode.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Zones */}
      <div className="mb-4">
        <p className="text-xs text-white/40 mb-2">Quartiers preferes</p>
        <div className="flex flex-wrap gap-2">
          {["Le Marais", "Bastille", "Montmartre", "Oberkampf", "Saint-Germain", "Belleville", "Canal Saint-Martin", "Pigalle"].map((zone) => {
            const isActive = prefs.zones.includes(zone);
            return (
              <button
                key={zone}
                onClick={() => {
                  const newZones = isActive
                    ? prefs.zones.filter((z) => z !== zone)
                    : [...prefs.zones, zone];
                  onUpdate({ ...prefs, zones: newZones });
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isActive
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/40 hover:text-white/60"
                }`}
              >
                {zone}
              </button>
            );
          })}
        </div>
      </div>

      {/* Social Style */}
      <div>
        <p className="text-xs text-white/40 mb-2">Style social</p>
        <div className="flex gap-2">
          {(["solo", "duo", "group", "mixed"] as const).map((style) => {
            const labels = { solo: "Solo", duo: "En duo", group: "Groupe", mixed: "Mixte" };
            const isActive = prefs.socialStyle === style;
            return (
              <button
                key={style}
                onClick={() => onUpdate({ ...prefs, socialStyle: style })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  isActive
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/20 text-white"
                    : "border-white/10 bg-white/[0.04] text-white/40 hover:text-white/60"
                }`}
              >
                {labels[style]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

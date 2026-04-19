"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { discoverVariants, springs, micro } from "@/lib/motion-design";
import { ModeKey, MODES, MODE_KEYS } from "@/lib/modes";
import { MOCK_PROFILES, type Profile } from "@/lib/mock-profiles";
import { MODE_ICONS, IconSearch, IconX } from "@/components/ui/Icons";
import CrossLinkCard from "@/components/app/CrossLinkCard";
import { useProfiles } from "@/lib/useProfiles";
import { useGeolocation } from "@/lib/useGeolocation";
import { Magnetic } from "@/components/motion/Magnetic";
import PageHeader from "@/components/ui/PageHeader";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type DistanceFilter = 1 | 3 | 5 | 10;
type AgeFilter = "18-25" | "25-35" | "35-45" | "45+";
type SortOption = "closest" | "active" | "new";

interface ActiveFilters {
  mode: ModeKey | "all";
  distance: DistanceFilter | null;
  age: AgeFilter | null;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const BATCH_SIZE = 20;

const DISTANCE_OPTIONS: DistanceFilter[] = [1, 3, 5, 10];

const AGE_OPTIONS: { label: string; value: AgeFilter }[] = [
  { label: "18-25", value: "18-25" },
  { label: "25-35", value: "25-35" },
  { label: "35-45", value: "35-45" },
  { label: "45+", value: "45+" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Plus proches", value: "closest" },
  { label: "Plus actifs", value: "active" },
  { label: "Nouveaux", value: "new" },
];

// Gradient palette for placeholder photos — generates consistent colors per profile
const GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-pink-500 to-rose-700",
  "from-indigo-500 to-blue-700",
  "from-emerald-500 to-green-700",
  "from-amber-500 to-orange-700",
  "from-cyan-500 to-teal-700",
  "from-fuchsia-500 to-pink-700",
  "from-sky-500 to-indigo-700",
];

function getGradient(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

// ─────────────────────────────────────────
// Filtering & Sorting logic
// ─────────────────────────────────────────

function matchesAge(age: number, filter: AgeFilter): boolean {
  switch (filter) {
    case "18-25": return age >= 18 && age <= 25;
    case "25-35": return age > 25 && age <= 35;
    case "35-45": return age > 35 && age <= 45;
    case "45+": return age > 45;
  }
}

function applyFilters(profiles: Profile[], filters: ActiveFilters): Profile[] {
  return profiles.filter((p) => {
    if (filters.mode !== "all" && p.mode !== filters.mode) return false;
    if (filters.distance !== null && p.distance > filters.distance) return false;
    if (filters.age !== null && !matchesAge(p.age, filters.age)) return false;
    return true;
  });
}

function applySort(profiles: Profile[], sort: SortOption): Profile[] {
  const sorted = [...profiles];
  switch (sort) {
    case "closest":
      return sorted.sort((a, b) => a.distance - b.distance);
    case "active":
      // Simulate "most active" — profiles with shorter availability times first
      return sorted.sort((a, b) => {
        const aActive = a.time.includes("maintenant") ? 0 : 1;
        const bActive = b.time.includes("maintenant") ? 0 : 1;
        return aActive - bActive;
      });
    case "new":
      // Simulate "newest" — reverse order (higher IDs are newer)
      return sorted.sort((a, b) => Number(b.id) - Number(a.id));
  }
}

// Simulate online status — deterministic based on profile ID
function isOnline(id: string): boolean {
  return Number(id) % 3 !== 0;
}

// Simulate verified status
function isVerified(id: string): boolean {
  return Number(id) % 4 === 0;
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function DiscoverPage() {
  const [filters, setFilters] = useState<ActiveFilters>({
    mode: "all",
    distance: null,
    age: null,
  });
  const [sort, setSort] = useState<SortOption>("closest");
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Real profiles via Supabase RPC (nearby_profiles); MOCK_PROFILES bootstrap when empty.
  const { latitude, longitude } = useGeolocation();
  const modeFilter = filters.mode === "all" ? undefined : filters.mode;
  const { profiles: realProfiles, isReal } = useProfiles(
    latitude ?? undefined,
    longitude ?? undefined,
    modeFilter,
  );
  const sourceProfiles: Profile[] = isReal && realProfiles.length > 0 ? realProfiles : MOCK_PROFILES;

  // Filter + sort profiles
  const filteredProfiles = useMemo(() => {
    const filtered = applyFilters(sourceProfiles, filters);
    return applySort(filtered, sort);
  }, [sourceProfiles, filters, sort]);

  const displayedProfiles = filteredProfiles.slice(0, displayCount);
  const hasMore = displayCount < filteredProfiles.length;

  // Count active filters
  const activeFilterCount = [
    filters.mode !== "all",
    filters.distance !== null,
    filters.age !== null,
  ].filter(Boolean).length;

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
  }, [filters, sort]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          // Simulate network delay for loading feel
          setTimeout(() => {
            setDisplayCount((prev) => Math.min(prev + BATCH_SIZE, filteredProfiles.length));
            setLoadingMore(false);
          }, 400);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, filteredProfiles.length]);

  const resetFilters = useCallback(() => {
    setFilters({ mode: "all", distance: null, age: null });
    setSort("closest");
  }, []);

  const removeFilter = useCallback((key: keyof ActiveFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "mode" ? "all" : null,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto pb-24">
      <PageHeader
        title="Decouvrir"
        titleClassName="text-[20px] font-black tracking-tight"
        rackFocus
        icon={
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        }
        hairlineVariant="vert-violet"
        actions={
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-muted"
            }`}
            whileTap={micro.tapScale}
            aria-label="Filtres"
          >
            <IconFilter size={18} />
            {activeFilterCount > 0 && (
              <motion.span
                className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full gradient-bg text-white text-[10px] font-bold flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springs.elastic}
              >
                {activeFilterCount}
              </motion.span>
            )}
          </motion.button>
        }
        slotBelowTitle={
          <div className="space-y-0">
            {/* Sort tabs */}
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    sort === opt.value
                      ? "gradient-bg text-white"
                      : "bg-border/30 text-text-muted hover:text-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-text-muted self-center">
                {filteredProfiles.length} profil{filteredProfiles.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Filter panel (collapsible) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springs.snap}
                  className="overflow-hidden border-t border-border/30 -mx-4"
                >
                  <div className="px-5 py-3 space-y-3">
                    <FilterSection label="Mode">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <motion.button
                          variants={discoverVariants.filterChip}
                          custom={0}
                          initial="hidden"
                          animate="visible"
                          onClick={() => setFilters((f) => ({ ...f, mode: "all" }))}
                          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                            filters.mode === "all"
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border text-text-muted"
                          }`}
                        >
                          Tous
                        </motion.button>
                        {MODE_KEYS.map((k, i) => {
                          const Icon = MODE_ICONS[k];
                          return (
                            <motion.button
                              key={k}
                              variants={discoverVariants.filterChip}
                              custom={i + 1}
                              initial="hidden"
                              animate="visible"
                              onClick={() => setFilters((f) => ({ ...f, mode: k }))}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                                filters.mode === k
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-border text-text-muted"
                              }`}
                            >
                              {Icon && <Icon size={12} />}
                              {MODES[k].name}
                            </motion.button>
                          );
                        })}
                      </div>
                    </FilterSection>

                    <FilterSection label="Distance">
                      <div className="flex gap-2">
                        {DISTANCE_OPTIONS.map((d, i) => (
                          <motion.button
                            key={d}
                            variants={discoverVariants.filterChip}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            onClick={() =>
                              setFilters((f) => ({
                                ...f,
                                distance: f.distance === d ? null : d,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                              filters.distance === d
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-text-muted"
                            }`}
                          >
                            {d}km
                          </motion.button>
                        ))}
                      </div>
                    </FilterSection>

                    <FilterSection label="Age">
                      <div className="flex gap-2">
                        {AGE_OPTIONS.map((opt, i) => (
                          <motion.button
                            key={opt.value}
                            variants={discoverVariants.filterChip}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            onClick={() =>
                              setFilters((f) => ({
                                ...f,
                                age: f.age === opt.value ? null : opt.value,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                              filters.age === opt.value
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-text-muted"
                            }`}
                          >
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </FilterSection>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter chips */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springs.snap}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 pt-2 overflow-x-auto no-scrollbar">
                    {filters.mode !== "all" && (
                      <ActiveChip
                        label={MODES[filters.mode].name}
                        onRemove={() => removeFilter("mode")}
                      />
                    )}
                    {filters.distance !== null && (
                      <ActiveChip
                        label={`${filters.distance}km`}
                        onRemove={() => removeFilter("distance")}
                      />
                    )}
                    {filters.age !== null && (
                      <ActiveChip
                        label={filters.age}
                        onRemove={() => removeFilter("age")}
                      />
                    )}
                    <button
                      onClick={resetFilters}
                      className="shrink-0 text-[10px] text-accent font-semibold px-2 py-1"
                    >
                      Tout effacer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

      {/* Trending ce soir */}
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[14px] font-bold text-text">Trending ce soir</h2>
          <Link href="/trending" className="text-[11px] text-accent font-semibold">
            Voir tout
          </Link>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {sourceProfiles.filter(p => p.distance < 3).slice(0, 6).map((p, i) => (
            <Link key={p.id} href={`/p/${p.id}`} className="shrink-0">
              <motion.div
                className="w-[100px] rounded-xl overflow-hidden border border-border/50 bg-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.snap, delay: i * 0.05 }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="relative aspect-square overflow-hidden">
                  {p.photo ? (
                    <img src={p.photo} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getGradient(p.id)}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-1.5 left-2">
                    <span className="text-[11px] font-bold text-white">{p.name}</span>
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <span className="text-[9px] text-accent font-semibold">{p.time}</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Plans link */}
      <div className="px-4 pb-4">
        <CrossLinkCard
          emoji="🔥"
          title="Plans ce soir"
          subtitle="Flash, soirees, events — rejoins-en un"
          href="/plans"
        />
      </div>

      {/* Profile grid */}
      {displayedProfiles.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 gap-3 px-4 pt-4"
          variants={discoverVariants.grid}
          initial="hidden"
          animate="visible"
          key={`${filters.mode}-${filters.distance}-${filters.age}-${sort}`}
        >
          {displayedProfiles.map((profile, i) => (
            <ProfileCard key={profile.id} profile={profile} index={i} />
          ))}
        </motion.div>
      ) : (
        <EmptyState onReset={resetFilters} />
      )}

      {/* Loading more indicator */}
      <AnimatePresence>
        {loadingMore && (
          <motion.div
            className="flex justify-center py-6"
            variants={discoverVariants.loadMore}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}

      {/* End of list */}
      {!hasMore && displayedProfiles.length > 0 && (
        <p className="text-center text-[11px] text-text-muted py-6">
          Tu as tout vu — {filteredProfiles.length} profil{filteredProfiles.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function ProfileCard({ profile, index }: { profile: Profile; index: number }) {
  const online = isOnline(profile.id);
  const verified = isVerified(profile.id);
  const modeDef = MODES[profile.mode];
  const ModeIcon = MODE_ICONS[profile.mode];

  return (
    <motion.div
      variants={discoverVariants.card}
      custom={index}
      whileHover="hover"
      whileTap="tap"
    >
      <Link
        href={`/p/${profile.id}`}
        className="block rounded-2xl overflow-hidden bg-bg border border-border/50 transition-colors hover:border-border"
      >
        {/* Photo area */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={`${profile.name}, ${profile.age} ans`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${getGradient(profile.id)}`}
            />
          )}

          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Online dot */}
          {online && (
            <div className="absolute top-2.5 right-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88] border-2 border-black/30" />
            </div>
          )}

          {/* Verified badge */}
          {verified && (
            <div className="absolute top-2.5 left-2.5">
              <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                <IconVerifiedCheck size={10} />
              </div>
            </div>
          )}

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-white leading-tight">
                {profile.name}
              </span>
              <span className="text-[12px] text-white/70">{profile.age}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-white/60">
                {profile.distance < 1
                  ? `${Math.round(profile.distance * 1000)}m`
                  : `${profile.distance.toFixed(1)}km`}
              </span>
            </div>
          </div>
        </div>

        {/* Mode badge */}
        <div className="px-2.5 py-2">
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
            style={{
              backgroundColor: `${modeDef.color}15`,
              color: modeDef.color,
              border: `1px solid ${modeDef.color}30`,
            }}
          >
            {ModeIcon && <ModeIcon size={10} />}
            {modeDef.name}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.button
      onClick={onRemove}
      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold"
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -10 }}
      transition={springs.snap}
      layout
    >
      {label}
      <IconX size={10} />
    </motion.button>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center px-8 pt-24"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
    >
      <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center mb-5">
        <IconSearch size={24} className="text-text-muted" />
      </div>
      <p className="text-[15px] font-bold text-text mb-1 text-center">
        Personne ne correspond a tes filtres
      </p>
      <p className="text-[12px] text-text-muted mb-6 text-center">
        Essaie d&apos;elargir tes criteres
      </p>
      <Magnetic strength={0.18} radius={90}>
        <button
          onClick={onReset}
          className="gradient-bg text-white px-6 py-2.5 rounded-full text-[13px] font-semibold shadow-[0_8px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_40px_rgba(139,92,246,0.5)] transition-shadow"
        >
          Reinitialiser les filtres
        </button>
      </Magnetic>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Inline icons (not in the shared icon set)
// ─────────────────────────────────────────

function IconFilter({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconVerifiedCheck({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M6 12l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

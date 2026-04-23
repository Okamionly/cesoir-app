"use client";

import { use, useMemo, useState, useCallback, useSyncExternalStore } from "react";
import { m } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MODES, type ModeKey, isKilledMode } from "@/lib/modes";
import { VENUES } from "@/lib/venues";
import { useProfiles } from "@/lib/useProfiles";
import { useEvents } from "@/lib/useEvents";
import { filterEventsByMode } from "@/lib/eventModeMapping";
import { EVENT_CATEGORY_LABELS } from "@/lib/events-types";
import { useGeolocation } from "@/lib/useGeolocation";
import { springs, ambient } from "@/lib/motion-design";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Magnetic } from "@/components/motion/Magnetic";
import { RackFocus } from "@/components/motion/RackFocus";
import { ArrowLeft, Calendar, ChevronRight as LucideChevronRight, Star, Zap } from "@/components/ui/lucide";

// ─────────────────────────────────────────
// External store — wall-clock ticker (react-hooks/purity-safe)
// ─────────────────────────────────────────

function subscribeNowTick(callback: () => void): () => void {
  const id = window.setInterval(callback, 5 * 60_000);
  return () => window.clearInterval(id);
}
function getNowMs(): number {
  return Date.now();
}
function getServerNowMs(): number {
  return 0;
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

// Local wrappers preserve previous call sites (no props needed at usage).
function BackArrow() {
  return <ArrowLeft size={22} strokeWidth={1.5} aria-hidden="true" />;
}

function StarIcon() {
  // Filled star (currentColor) — matches the original solid review look.
  return <Star size={12} fill="currentColor" stroke="none" aria-hidden="true" />;
}

function ChevronRight() {
  return <LucideChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />;
}

// ─────────────────────────────────────────
// Main page
// ─────────────────────────────────────────

export default function ModeDetailPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeSlug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  // Resolve mode data (key may be invalid — we still call all hooks below
  // first so the hook order stays stable across renders, then short-circuit
  // at render time if the mode doesn't resolve).
  const modeKey = modeSlug as ModeKey;
  const modeData = MODES[modeKey];

  // Real profiles for this mode — powers the count and avatar preview.
  const { latitude, longitude } = useGeolocation();
  const { profiles: modeProfiles } = useProfiles(
    latitude ?? undefined,
    longitude ?? undefined,
    modeKey,
  );

  // Mode-compatible Montpellier events (U4 — Wave 14)
  // Use category filtering via `filterEventsByMode` so each mode surfaces
  // the right vibe (techno for night-owl, live for culture-club, etc.).
  // Wall-clock via useSyncExternalStore keeps render pure and ticks every 5m.
  const { events: allEvents } = useEvents({ when: "all", category: null });
  const nowMs = useSyncExternalStore(subscribeNowTick, getNowMs, getServerNowMs);
  const compatibleEvents = useMemo(() => {
    if (!modeData || nowMs === 0) return [];
    const byMode = filterEventsByMode(allEvents, modeKey);
    // Show only events <48h away so "compatibles ce soir" isn't stale.
    return byMode
      .filter((ev) => {
        const t = new Date(ev.startAt).getTime();
        return !Number.isNaN(t) && t >= nowMs && t <= nowMs + 48 * 60 * 60 * 1000;
      })
      .slice(0, 5);
  }, [allEvents, modeKey, modeData, nowMs]);

  // Activate mode handler
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      if (user) {
        await supabase.from("mode_activations").insert({
          user_id: user.id,
          mode: modeKey,
          activated_at: new Date().toISOString(),
        });
      }
      setActivated(true);
      setTimeout(() => {
        router.push(`/browse?mode=${modeKey}`);
      }, 600);
    } catch {
      // Proceed to browse even if insert fails
      router.push(`/browse?mode=${modeKey}`);
    }
  }, [user, modeKey, router]);

  // If mode doesn't exist, show 404-like state (all hooks above have run).
  // Killed modes (Wave 15 PMF focus) show a friendlier message.
  if (!modeData) {
    const killed = isKilledMode(modeSlug);
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4" aria-hidden="true">
          {killed ? "🌱" : "🤷"}
        </span>
        <h1 className="text-xl font-bold mb-2">
          {killed ? "Bientot disponible" : "Mode introuvable"}
        </h1>
        <p className="text-sm text-text-muted mb-6 max-w-xs">
          {killed
            ? "On re-ouvre ce mode des qu'il a sa PMF. En attendant, essaye nos 4 modes actifs."
            : "Ce mode n'existe pas encore."}
        </p>
        <Link href="/modes" className="text-sm text-accent font-semibold">
          Retour aux modes
        </Link>
      </div>
    );
  }

  // Filter venues compatible with this mode (post-guard, modeKey is valid).
  const modeVenues = VENUES.filter((v) => v.compatible_modes.includes(modeKey)).slice(0, 3);
  const activeCount = modeProfiles.length;
  const avatarPreviews = modeProfiles.slice(0, 3);

  // Steps data
  const steps = [
    { icon: "⚡", title: "Active le mode", description: `Active "${modeData.name}" et montre ta disponibilite.` },
    { icon: "👀", title: "Decouvre les profils", description: "Parcours les personnes disponibles ce soir pres de toi." },
    { icon: "🎯", title: "Propose un plan", description: "Envoie une invitation et organisez votre soiree." },
  ];

  // Price range formatting
  const formatPrice = (range: 1 | 2 | 3) => "\u20AC".repeat(range);

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* ─── HERO SECTION ─── */}
      <m.section
        className="relative overflow-hidden"
        initial={{ opacity: 0, filter: "blur(20px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${modeData.color}20 0%, ${modeData.color}08 50%, transparent 100%)`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: modeData.color }}
        />

        {/* Back button — Magnetic */}
        <div className="relative z-10 px-4 pt-4">
          <Magnetic strength={0.18} radius={70}>
            <Link
              href="/modes"
              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors tap-target"
              aria-label="Retour aux modes"
            >
              <BackArrow />
              <span>Modes</span>
            </Link>
          </Magnetic>
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-6 pt-8 pb-10 text-center">
          {/* Floating emoji */}
          <m.div
            className="text-7xl mb-4 inline-block"
            animate={ambient.float(5)}
            aria-hidden="true"
          >
            {modeData.icon}
          </m.div>

          <m.h1
            className="text-3xl font-bold font-display mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springs.heavy }}
          >
            {modeData.name}
          </m.h1>

          <m.p
            className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...springs.heavy }}
          >
            {modeData.description}
          </m.p>

          {/* Tags */}
          <m.div
            className="flex flex-wrap justify-center gap-1.5 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            {modeData.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2.5 py-1 rounded-full border font-medium"
                style={{
                  borderColor: `${modeData.color}30`,
                  color: modeData.color,
                  background: `${modeData.color}08`,
                }}
              >
                {tag}
              </span>
            ))}
          </m.div>
        </div>
      </m.section>

      {/* ─── QUI EST LA CE SOIR ─── */}
      <section className="px-5 py-6" aria-labelledby="active-users-heading">
        <m.div
          className="bg-bg-card border border-border rounded-2xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...springs.heavy }}
        >
          <h2 id="active-users-heading" className="text-[15px] font-bold mb-3">
            Qui est la ce soir
          </h2>
          <div className="flex items-center gap-4">
            {/* Avatar stack */}
            <div className="flex -space-x-3">
              {avatarPreviews.map((profile, i) => (
                <m.div
                  key={profile.id}
                  className="relative"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.5 + i * 0.1,
                    ...springs.elastic,
                  }}
                >
                  <Image
                    src={profile.photo}
                    alt={profile.name}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full border-2 border-bg object-cover"
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg bg-safe"
                    aria-hidden="true"
                  />
                </m.div>
              ))}
              {activeCount > 3 && (
                <m.div
                  className="w-11 h-11 rounded-full border-2 border-bg flex items-center justify-center text-[10px] font-bold"
                  style={{ background: `${modeData.color}15`, color: modeData.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, ...springs.elastic }}
                >
                  +{activeCount - 3}
                </m.div>
              )}
            </div>

            {/* Count */}
            <div>
              <p className="text-2xl font-bold font-display" style={{ color: modeData.color }}>
                {activeCount}
              </p>
              <p className="text-[11px] text-text-muted">actifs maintenant</p>
            </div>

            {/* Live pulse */}
            <div className="ml-auto flex items-center gap-1.5">
              <m.div
                className="w-2 h-2 rounded-full bg-safe"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[10px] text-safe font-semibold">LIVE</span>
            </div>
          </div>
        </m.div>
      </section>

      {/* ─── EVENTS COMPATIBLES CE SOIR (U4 Wave 14) ─── */}
      {compatibleEvents.length > 0 && (
        <section className="px-5 py-2" aria-labelledby="compatible-events-heading">
          <div className="flex items-center justify-between mb-3">
            <m.h2
              id="compatible-events-heading"
              className="text-[15px] font-bold inline-flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <Zap size={14} strokeWidth={2} style={{ color: modeData.color }} aria-hidden="true" />
              Events compatibles ce soir
            </m.h2>
            <Link
              href="/events"
              className="text-[11px] font-semibold text-accent tap-target"
            >
              Tout voir
            </Link>
          </div>

          <div className="space-y-2">
            {compatibleEvents.map((event, i) => {
              const d = new Date(event.startAt);
              const timeLabel = Number.isNaN(d.getTime())
                ? ""
                : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              return (
                <m.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, ...springs.heavy }}
                >
                  <Link
                    href={`/events/${event.id}`}
                    className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-3.5 hover:border-accent/30 transition-colors tap-target"
                    aria-label={`${event.title} — ${timeLabel} ${event.venue.name}`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base overflow-hidden relative"
                      style={{ background: `${modeData.color}12` }}
                    >
                      {event.flyerUrl ? (
                        <Image
                          src={event.flyerUrl}
                          alt=""
                          fill
                          sizes="40px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      ) : (
                        <Calendar
                          size={16}
                          strokeWidth={2}
                          style={{ color: modeData.color }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold truncate">{event.title}</h3>
                      <p className="text-[11px] text-text-muted">
                        {event.venue.name}
                        {timeLabel ? ` · ${timeLabel}` : ""}
                      </p>
                      {event.categories.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {event.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase"
                              style={{
                                background: `${modeData.color}18`,
                                color: modeData.color,
                              }}
                            >
                              {EVENT_CATEGORY_LABELS[cat] ?? cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <LucideChevronRight
                      size={14}
                      strokeWidth={2}
                      className="text-text-muted shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                </m.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── COMMENT CA MARCHE ─── */}
      <section className="px-5 py-2" aria-labelledby="how-it-works-heading">
        <m.h2
          id="how-it-works-heading"
          className="text-[15px] font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Comment ca marche
        </m.h2>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <m.div
              key={i}
              className="flex items-start gap-4 bg-bg-card border border-border rounded-2xl p-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.1, ...springs.heavy }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: `${modeData.color}12` }}
              >
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: `${modeData.color}15`, color: modeData.color }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-[14px] font-bold">{step.title}</h3>
                </div>
                <p className="text-[12px] text-text-muted leading-relaxed">{step.description}</p>
              </div>
            </m.div>
          ))}
        </div>
      </section>

      {/* ─── LIEUX POPULAIRES ─── */}
      {modeVenues.length > 0 && (
        <section className="px-5 py-6" aria-labelledby="venues-heading">
          <m.h2
            id="venues-heading"
            className="text-[15px] font-bold mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Lieux populaires
          </m.h2>

          <div className="space-y-2.5">
            {modeVenues.map((venue, i) => (
              <m.div
                key={venue.id}
                className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.1, ...springs.heavy }}
              >
                {/* Venue type icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: `${modeData.color}10` }}
                >
                  {venue.type === "restaurant" && "🍽️"}
                  {venue.type === "bar" && "🍸"}
                  {venue.type === "concert" && "🎵"}
                  {venue.type === "cinema" && "🎬"}
                  {venue.type === "balade" && "🚶"}
                  {venue.type === "cafe" && "☕"}
                  {venue.type === "musee" && "🎨"}
                  {venue.type === "sport" && "💪"}
                </div>

                {/* Venue info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold truncate">{venue.name}</h3>
                  <p className="text-[11px] text-text-muted truncate">{venue.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5 text-warn">
                      <StarIcon />
                      <span className="text-[10px] font-semibold">{venue.rating}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{formatPrice(venue.priceRange)}</span>
                    <span className="text-[10px] text-text-muted">{venue.arrondissement}</span>
                  </div>
                </div>

                {/* Popular badge */}
                {venue.popular && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${modeData.color}12`, color: modeData.color }}
                  >
                    Populaire
                  </span>
                )}

                <ChevronRight />
              </m.div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials section removed — was seeded with mock users + randomuser.me avatars. */}
      {/* TODO: wire real `mode_reviews` from Supabase once the table ships. */}

      {/* ─── CTA: ACTIVER CE MODE — Magnetic + glow ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-4 bg-gradient-to-t from-bg via-bg/95 to-transparent">
        <Magnetic as="div" strength={0.14} radius={140}>
        <m.button
          onClick={handleActivate}
          disabled={activating || activated}
          className="w-full relative overflow-hidden rounded-2xl py-4 text-white font-bold text-base shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: activated
              ? "var(--color-safe)"
              : `linear-gradient(135deg, ${modeData.color}, ${modeData.color}CC)`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, ...springs.heavy }}
          whileHover={{ y: -3, boxShadow: `0 12px 40px ${modeData.color}40` }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow effect */}
          <m.div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 50% 50%, white, transparent 70%)`,
            }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          <span className="relative z-10 flex items-center justify-center gap-2">
            {activated ? (
              <>
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springs.elastic}
                >
                  ✓
                </m.span>
                Mode active !
              </>
            ) : activating ? (
              <>
                <m.span
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Activation...
              </>
            ) : (
              <>
                <span>{modeData.icon}</span>
                Activer {modeData.name}
              </>
            )}
          </span>
        </m.button>
        </Magnetic>
      </div>
    </div>
  );
}

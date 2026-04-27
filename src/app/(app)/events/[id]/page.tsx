"use client";

/**
 * /events/[id] — Soirees detail page.
 *
 * Stack of sections:
 *   1. Hero flyer (full-width) with gradient overlay + title/date/venue
 *   2. "A propos" description
 *   3. Line-up (optional)
 *   4. Venue + mini MapLibre
 *   5. "Qui y va" avatar stack (opens bottom sheet on tap)
 *   6. Categories chips + ticketing link
 *   7. Sticky EventRsvpBar (bottom)
 *
 * The RSVP bar sits above the global BottomNav — see BottomNav for the
 * matching 60px offset logic.
 */

import { use, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { m, useReducedMotion, type Transition } from "motion/react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonEventDetail } from "@/components/ui/skeletons";
import { BottomSheet } from "@/components/ui/BottomSheet";
import EventLineup from "@/components/events/EventLineup";
import EventVenueMap from "@/components/events/EventVenueMap";
import EventRsvpBar from "@/components/events/EventRsvpBar";
import { useEvent } from "@/lib/useEvents";
import { EVENT_CATEGORY_LABELS } from "@/lib/events-types";
import { springs } from "@/lib/motion-design";
import {
  MapPin,
  Clock,
  Share2,
  ChevronRight,
  Users,
  ArrowRight,
} from "@/components/ui/lucide";
import { haptics } from "@/lib/haptics";

const FRENCH_LONG_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);
  const reducedMotion = useReducedMotion();
  const { event, loading, error, setMyRsvp, savingRsvp } = useEvent(id);
  const [showAttendees, setShowAttendees] = useState(false);

  const handleShare = useCallback(async () => {
    if (!event) return;
    haptics.light();
    const shareData = {
      title: event.title,
      text: `${event.title} — ${event.venue.name}`,
      url: typeof window !== "undefined" ? window.location.href : "/events",
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled — no-op
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
    }
  }, [event]);

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader backHref="/events" title="Soirée" />
        <SkeletonEventDetail />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader backHref="/events" title="Soirée" />
        <EmptyState
          emoji="⚠️"
          title="Event introuvable"
          subtitle="Cet event a peut-être été annulé ou supprimé."
          actionLabel="Retour aux soirées"
          actionHref="/events"
        />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader backHref="/events" title="Soirée" />
        <EmptyState
          emoji="🌙"
          title="Event introuvable"
          actionLabel="Voir tous les events"
          actionHref="/events"
        />
      </div>
    );
  }

  const startDate = new Date(event.startAt);
  const formattedDate = FRENCH_LONG_DATE.format(startDate);
  const totalAttendees = event.counts.going + event.attendeePreview.length;

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader
        backHref="/events"
        title={event.title}
        hairlineVariant="green-violet"
        actions={
          <button
            type="button"
            onClick={handleShare}
            className="tap-target inline-flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-text-muted hover:text-text transition-colors"
            aria-label="Partager l'event"
          >
            <Share2 size={16} strokeWidth={2} aria-hidden />
          </button>
        }
      />

      {/* ─── Hero flyer ──────────────────────────────── */}
      <section className="relative w-full aspect-[16/10] overflow-hidden">
        {event.flyerUrl ? (
          <m.div
            className="absolute inset-0"
            initial={reducedMotion ? false : { scale: 1.06, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={event.flyerUrl}
              alt=""
              fill
              sizes="(max-width: 440px) 100vw, 440px"
              priority
              className="object-cover"
            />
          </m.div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(0,255,136,0.18))",
            }}
          >
            <span className="font-display text-5xl font-bold text-accent/55 tracking-widest">
              {event.title.slice(0, 3).toUpperCase()}
            </span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,10,0.85), rgba(10,10,10,0))",
          }}
        />

        {/* Hero caption */}
        <div className="absolute inset-x-0 bottom-0 p-5 space-y-2 text-white">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
            <Clock size={12} strokeWidth={2} aria-hidden />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight drop-shadow-md">
            {event.title}
          </h1>
          <div className="inline-flex items-center gap-1.5 text-[12px] text-white/85">
            <MapPin size={13} strokeWidth={2} aria-hidden />
            <span>
              {event.venue.name}
              {event.venue.neighborhood ? ` · ${event.venue.neighborhood}` : ""}
            </span>
          </div>
        </div>
      </section>

      <main className="px-4 py-5 space-y-6 pb-[160px]" aria-label="Détails de l'event">
        {/* ─── About ──────────────────────────────── */}
        {event.description && (
          <section aria-labelledby="about-heading">
            <h2
              id="about-heading"
              className="font-display text-sm font-bold text-text mb-2 uppercase tracking-wide"
            >
              A propos
            </h2>
            <p className="text-[14px] leading-relaxed text-text-muted whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}

        {/* ─── Lineup ──────────────────────────────── */}
        {event.lineup && event.lineup.length > 0 && (
          <section aria-labelledby="lineup-heading">
            <h2
              id="lineup-heading"
              className="font-display text-sm font-bold text-text mb-2 uppercase tracking-wide"
            >
              Line-up
            </h2>
            <EventLineup slots={event.lineup} />
          </section>
        )}

        {/* ─── Venue ──────────────────────────────── */}
        {event.venue.lat != null && event.venue.lng != null ? (
          <section aria-labelledby="venue-heading">
            <h2
              id="venue-heading"
              className="font-display text-sm font-bold text-text mb-2 uppercase tracking-wide"
            >
              Ou ca se passe
            </h2>
            <EventVenueMap
              name={event.venue.name}
              address={event.venue.address}
              lat={event.venue.lat}
              lng={event.venue.lng}
              subtitle={event.venue.address}
            />
          </section>
        ) : event.venue.address ? (
          <section aria-labelledby="venue-heading">
            <h2
              id="venue-heading"
              className="font-display text-sm font-bold text-text mb-2 uppercase tracking-wide"
            >
              Ou ca se passe
            </h2>
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-[14px] font-semibold text-text">
                {event.venue.name}
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                {event.venue.address}
              </p>
            </div>
          </section>
        ) : null}

        {/* ─── Who's going ──────────────────────────────── */}
        <section aria-labelledby="attendees-heading">
          <h2
            id="attendees-heading"
            className="font-display text-sm font-bold text-text mb-2 uppercase tracking-wide"
          >
            Qui y va
          </h2>
          <m.button
            type="button"
            onClick={() => setShowAttendees(true)}
            whileTap={{ scale: 0.97 }}
            transition={springs.micro as Transition}
            className="w-full flex items-center justify-between gap-3 rounded-2xl bg-card border border-border p-3.5 text-left hover:border-accent/30 transition-colors"
            disabled={totalAttendees === 0}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {event.attendeePreview.length > 0 ? (
                  <div className="flex -space-x-2">
                    {event.attendeePreview.slice(0, 3).map((a, i) => (
                      <div
                        key={a.userId}
                        className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-card bg-gradient-to-br from-accent/30 to-accent/10"
                        style={{ zIndex: 3 - i }}
                      >
                        {a.avatarUrl && (
                          <Image
                            src={a.avatarUrl}
                            alt={a.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-bg border border-border">
                    <Users size={16} strokeWidth={2} aria-hidden className="text-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text">
                  {totalAttendees === 0
                    ? "Sois le premier a rejoindre"
                    : totalAttendees === 1
                      ? "1 personne y va"
                      : `${totalAttendees} personnes y vont`}
                </p>
                {event.counts.maybe > 0 && (
                  <p className="text-[11px] text-text-muted">
                    {event.counts.maybe} peut-etre
                  </p>
                )}
              </div>
            </div>
            {totalAttendees > 0 && (
              <ChevronRight
                size={16}
                strokeWidth={2}
                aria-hidden
                className="text-text-muted"
              />
            )}
          </m.button>
        </section>

        {/* ─── Categories + tickets ──────────────────────────────── */}
        {(event.categories.length > 0 || event.ticketUrl) && (
          <section className="space-y-3">
            {event.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {event.categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-text-muted"
                  >
                    {EVENT_CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>
            )}

            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-text transition-colors hover:bg-accent/10"
              >
                <div>
                  <p className="text-[13px] font-semibold">Acheter une place</p>
                  <p className="text-[11px] text-text-muted">
                    Ouvre la billetterie externe
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="text-accent shrink-0"
                  aria-hidden
                />
              </a>
            )}
          </section>
        )}
      </main>

      {/* Sticky RSVP bar */}
      <EventRsvpBar
        eventId={event.id}
        status={event.myRsvp}
        onChange={(next) => {
          void setMyRsvp(next);
        }}
        saving={savingRsvp}
      />

      {/* Attendees sheet */}
      <BottomSheet
        open={showAttendees}
        onClose={() => setShowAttendees(false)}
        title="Qui y va"
        snapPoints={[0.4, 0.75, 1]}
        initialSnap={1}
      >
        {event.attendeePreview.length === 0 ? (
          <EmptyState
            emoji="🙌"
            title="Personne n'a encore confirme"
            subtitle="Sois le premier a dire que tu y seras."
          />
        ) : (
          <ul className="space-y-2">
            {event.attendeePreview.map((a) => (
              <li
                key={a.userId}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent/30 to-accent/10">
                  {a.avatarUrl && (
                    <Image
                      src={a.avatarUrl}
                      alt={a.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text truncate">
                    {a.name}
                  </p>
                </div>
                <Link
                  href={`/profile/${a.userId}` as Route}
                  className="inline-flex items-center rounded-full border border-border bg-bg px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
                >
                  Voir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>
    </div>
  );
}

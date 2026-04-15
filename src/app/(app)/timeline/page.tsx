"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { timelineVariants, springs } from "@/lib/motion-design";
import TimelineCard, { type TimelineEntry } from "@/components/app/TimelineCard";
import Link from "next/link";

// ─────────────────────────────────────────
// Month helpers
// ─────────────────────────────────────────

const MONTH_NAMES = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

interface MonthKey {
  month: number; // 0-based
  year: number;
}

function monthLabel(mk: MonthKey): string {
  return `${MONTH_NAMES[mk.month]} ${mk.year}`;
}

function prevMonth(mk: MonthKey): MonthKey {
  return mk.month === 0
    ? { month: 11, year: mk.year - 1 }
    : { month: mk.month - 1, year: mk.year };
}

function nextMonth(mk: MonthKey): MonthKey {
  return mk.month === 11
    ? { month: 0, year: mk.year + 1 }
    : { month: mk.month + 1, year: mk.year };
}

function monthKeyEq(a: MonthKey, b: MonthKey): boolean {
  return a.month === b.month && a.year === b.year;
}

// ─────────────────────────────────────────
// Mock data — 30 entries across 3 months
// ─────────────────────────────────────────

const MOCK_ENTRIES: TimelineEntry[] = [
  // Avril 2026
  { id: "t01", type: "soiree", date: "14 Avr", title: "Soiree avec Claire a Le Comptoir", subtitle: "Diner franco-japonais", venue: "Le Comptoir, Paris 6e", detail: "Un moment incroyable, la conversation a dure 3h!", memoryLink: "/memories", photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop" },
  { id: "t02", type: "match", date: "13 Avr", title: "Match avec Thomas", subtitle: "92% compatibilite", detail: "Centres communs: musique jazz, randonnee, cuisine asiatique." },
  { id: "t03", type: "badge", date: "12 Avr", title: "Badge debloque: Ice Breaker", subtitle: "10 premieres conversations lancees", detail: "Tu as lance 10 conversations! Continue comme ca." },
  { id: "t04", type: "review", date: "11 Avr", title: "Avis recu: 5/5", subtitle: "De Claire apres votre soiree", rating: 5, detail: "Super rencontre, tres bonne ambiance!" },
  { id: "t05", type: "soiree", date: "10 Avr", title: "Soiree avec Hugo a Cafe Flore", subtitle: "After-work decontracte", venue: "Cafe Flore, Paris 6e", detail: "On a parle startup et investissement pendant 2h.", memoryLink: "/memories" },
  { id: "t06", type: "streak", date: "9 Avr", title: "Streak de 7 jours!", subtitle: "Connecte chaque soir", count: 7, detail: "Une semaine complete de sorties!" },
  { id: "t07", type: "level", date: "8 Avr", title: "Niveau 5 atteint!", subtitle: "Explorateur Nocturne", count: 5, detail: "Tu debloques l'acces aux evenements premium." },
  { id: "t08", type: "match", date: "7 Avr", title: "Match avec Priya", subtitle: "87% compatibilite", detail: "Points communs: yoga, voyages, photographie." },
  { id: "t09", type: "event", date: "5 Avr", title: "Participe a Soiree Jazz Live", subtitle: "Sunset du Perchoir, Paris 11e", venue: "Le Perchoir, Paris 11e", detail: "Concert live avec 45 participants CeSoir." },
  { id: "t10", type: "soiree", date: "3 Avr", title: "Soiree avec Sarah a Oberkampf", subtitle: "Bar a cocktails", venue: "Le Syndicat, Paris 10e", memoryLink: "/memories" },

  // Mars 2026
  { id: "t11", type: "badge", date: "30 Mar", title: "Badge debloque: Night Owl", subtitle: "5 sorties apres 22h", detail: "Les meilleures soirees commencent tard!" },
  { id: "t12", type: "match", date: "29 Mar", title: "Match avec Karim", subtitle: "89% compatibilite", detail: "Passion commune pour le cinema d'auteur." },
  { id: "t13", type: "soiree", date: "28 Mar", title: "Soiree avec Lea a Belleville", subtitle: "Galerie d'art + diner", venue: "Galerie Perrotin, Paris 3e", detail: "Expo Takashi Murakami puis ramen.", memoryLink: "/memories", photo: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=400&h=200&fit=crop" },
  { id: "t14", type: "review", date: "27 Mar", title: "Avis recu: 4/5", subtitle: "De Hugo", rating: 4 },
  { id: "t15", type: "streak", date: "25 Mar", title: "Streak de 5 jours!", subtitle: "En feu cette semaine", count: 5 },
  { id: "t16", type: "soiree", date: "23 Mar", title: "Soiree avec Gabriel a Montmartre", subtitle: "Balade nocturne + vin", venue: "Sacre-Coeur, Paris 18e", memoryLink: "/memories" },
  { id: "t17", type: "event", date: "21 Mar", title: "Participe a Speed Meeting", subtitle: "WeWork La Fayette", venue: "WeWork, Paris 9e", detail: "15 mini-rencontres en 2h, 4 matchs!" },
  { id: "t18", type: "level", date: "19 Mar", title: "Niveau 4 atteint!", subtitle: "Noctambule", count: 4 },
  { id: "t19", type: "match", date: "17 Mar", title: "Match avec Amira", subtitle: "91% compatibilite" },
  { id: "t20", type: "soiree", date: "15 Mar", title: "Soiree avec Lucas a Nation", subtitle: "Escape Game", venue: "Escape Hunt, Paris 12e", detail: "On a resolu l'enigme en 48 min!", memoryLink: "/memories" },

  // Fevrier 2026
  { id: "t21", type: "badge", date: "28 Fev", title: "Badge debloque: Social Butterfly", subtitle: "20 rencontres differentes" },
  { id: "t22", type: "soiree", date: "26 Fev", title: "Soiree avec Ines a Bastille", subtitle: "Concert + cocktails", venue: "Badaboum, Paris 11e", memoryLink: "/memories" },
  { id: "t23", type: "match", date: "24 Fev", title: "Match avec Romain", subtitle: "85% compatibilite" },
  { id: "t24", type: "review", date: "22 Fev", title: "Avis recu: 5/5", subtitle: "De Lea", rating: 5, detail: "Soiree parfaite, on se revoit bientot!" },
  { id: "t25", type: "event", date: "20 Fev", title: "Participe a Afterwork Tech", subtitle: "Station F, Paris 13e", venue: "Station F, Paris 13e" },
  { id: "t26", type: "streak", date: "18 Fev", title: "Streak de 3 jours!", subtitle: "Bon debut!", count: 3 },
  { id: "t27", type: "soiree", date: "15 Fev", title: "Soiree avec Chloe au Marais", subtitle: "Brunch dominical", venue: "Cafe Charlot, Paris 3e", memoryLink: "/memories" },
  { id: "t28", type: "level", date: "12 Fev", title: "Niveau 3 atteint!", subtitle: "Aventurier", count: 3 },
  { id: "t29", type: "match", date: "8 Fev", title: "Match avec Yasmine", subtitle: "88% compatibilite" },
  { id: "t30", type: "soiree", date: "3 Fev", title: "Soiree avec Marc a Pigalle", subtitle: "Premiere soiree CeSoir!", venue: "Hotel Amour, Paris 9e", detail: "Le debut de l'aventure CeSoir.", memoryLink: "/memories" },
];

// Map entries into their months
function groupByMonth(entries: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const map = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const parts = entry.date.split(" ");
    const monthAbbr = parts[1];
    let monthIdx = -1;
    const abbrs = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
    abbrs.forEach((a, i) => {
      if (monthAbbr.startsWith(a)) monthIdx = i;
    });
    // Determine year from context (entries span Fev-Avr 2026)
    const year = 2026;
    const key = `${monthIdx}-${year}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

function getMonthEntries(mk: MonthKey, grouped: Map<string, TimelineEntry[]>): TimelineEntry[] {
  return grouped.get(`${mk.month}-${mk.year}`) ?? [];
}

function countByType(entries: TimelineEntry[], type: string): number {
  return entries.filter((e) => e.type === type).length;
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function TimelinePage() {
  const grouped = groupByMonth(MOCK_ENTRIES);

  // Current month shown
  const [current, setCurrent] = useState<MonthKey>({ month: 3, year: 2026 }); // Avril 2026
  const [direction, setDirection] = useState(0);

  // Track loaded months for infinite scroll
  const [loadedMonths, setLoadedMonths] = useState<MonthKey[]>([
    { month: 3, year: 2026 },
  ]);

  const entries = getMonthEntries(current, grouped);
  const soireeCount = countByType(entries, "soiree");
  const matchCount = countByType(entries, "match");

  const goNext = useCallback(() => {
    const n = nextMonth(current);
    // Don't go beyond Avril 2026
    if (n.year > 2026 || (n.year === 2026 && n.month > 3)) return;
    setDirection(1);
    setCurrent(n);
  }, [current]);

  const goPrev = useCallback(() => {
    const p = prevMonth(current);
    // Don't go before Fevrier 2026
    if (p.year < 2026 || (p.year === 2026 && p.month < 1)) return;
    setDirection(-1);
    setCurrent(p);
  }, [current]);

  // Simple infinite scroll: load older month when near bottom
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [olderEntries, setOlderEntries] = useState<TimelineEntry[]>([]);
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (intersections) => {
        if (intersections[0]?.isIntersecting && !hasLoadedAll) {
          // Find the oldest loaded month and load the one before
          const oldest = loadedMonths[loadedMonths.length - 1];
          const olderMk = prevMonth(oldest);
          const olderData = getMonthEntries(olderMk, grouped);
          if (olderData.length > 0) {
            setOlderEntries((prev) => [...prev, ...olderData]);
            setLoadedMonths((prev) => [...prev, olderMk]);
          } else {
            setHasLoadedAll(true);
          }
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadedMonths, hasLoadedAll, grouped]);

  // Can navigate?
  const canNext = !(current.year === 2026 && current.month === 3);
  const canPrev = !(current.year === 2026 && current.month === 1);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-bg-card"
          aria-label="Retour au profil"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </Link>
        <h1
          className="text-white font-bold text-[22px]"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
        >
          Mon Parcours
        </h1>
      </div>

      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          disabled={!canPrev}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-bg-card border border-border disabled:opacity-30 transition-opacity"
          aria-label="Mois precedent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.h2
            key={`${current.month}-${current.year}`}
            variants={timelineVariants.monthSlide}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            className="text-white font-bold text-[17px]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk')" }}
          >
            {monthLabel(current)}
          </motion.h2>
        </AnimatePresence>

        <button
          onClick={goNext}
          disabled={!canNext}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-bg-card border border-border disabled:opacity-30 transition-opacity"
          aria-label="Mois suivant"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>

      {/* ── Summary card ── */}
      <motion.div
        variants={timelineVariants.summary}
        initial="hidden"
        animate="visible"
        key={`summary-${current.month}-${current.year}`}
        className="rounded-2xl p-4 mb-6 bg-bg-card border border-border flex items-center gap-4"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(139,92,246,0.15)" }}
          aria-hidden="true"
        >
          <span className="text-[20px]">{"\uD83C\uDF19"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[15px]">
            Ce mois: {soireeCount} soiree{soireeCount !== 1 ? "s" : ""}, {matchCount} match{matchCount !== 1 ? "s" : ""}
          </p>
          <p className="text-text-muted text-[12px]">
            {entries.length} evenement{entries.length !== 1 ? "s" : ""} au total
          </p>
        </div>
      </motion.div>

      {/* ── Timeline ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`timeline-${current.month}-${current.year}`}
          variants={timelineVariants.monthSlide}
          custom={direction}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {entries.length > 0 ? (
            <div className="relative" role="list" aria-label="Chronologie du mois">
              {/* Vertical connecting line */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
                style={{
                  background: "linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.1))",
                  transformOrigin: "top",
                }}
                variants={timelineVariants.line}
                initial="hidden"
                animate="visible"
              />

              {/* Entries */}
              <motion.div
                className="flex flex-col gap-5 relative z-10"
                initial="hidden"
                animate="visible"
              >
                {entries.map((entry, i) => (
                  <TimelineCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    side={i % 2 === 0 ? "left" : "right"}
                  />
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-bg-card">
                <span className="text-[28px]">{"\uD83D\uDCC5"}</span>
              </div>
              <p className="text-white font-semibold text-[16px] mb-1">
                Rien ce mois-ci
              </p>
              <p className="text-[13px] text-text-muted">
                Pas encore d&apos;activite pour {monthLabel(current)}.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Infinite scroll sentinel ── */}
      <div ref={sentinelRef} className="h-1" />

      {/* ── Older months loaded via scroll ── */}
      {olderEntries.length > 0 && (
        <div className="mt-8 space-y-5" role="list" aria-label="Mois precedents">
          {olderEntries.map((entry, i) => (
            <TimelineCard
              key={`older-${entry.id}`}
              entry={entry}
              index={i}
              side={i % 2 === 0 ? "left" : "right"}
            />
          ))}
        </div>
      )}

      {hasLoadedAll && olderEntries.length > 0 && (
        <p className="text-center text-text-muted text-[12px] mt-6 pb-4">
          Debut de ton parcours CeSoir
        </p>
      )}
    </div>
  );
}

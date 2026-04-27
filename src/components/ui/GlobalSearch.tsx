"use client";

/**
 * GlobalSearch — floating search button + full-screen modal for users,
 * events, and venues.
 *
 * Mounted once via AppChrome (auth-gated). The button sits at the
 * top-right of the viewport (above TopNav on desktop, just below the
 * status bar on mobile via pt-safe). Tap → opens a BottomSheet at
 * full-screen height with:
 *   - Large input (auto-focused on open)
 *   - Recent searches (when query is empty), max 5
 *   - Categorized results: Profils / Soirées / Lieux (max 5 each)
 *   - Loading skeleton placeholders during search
 *   - Empty state below MIN_CHARS
 *
 * Recent searches persist in `localStorage["cesoir.global-search.recent"]`
 * (capped to 5, dedup, most-recent-first). Stored client-side only —
 * no server roundtrip — to keep the feature snappy and respect privacy.
 *
 * Each result row navigates to its detail surface and closes the modal:
 *   - Profile → /p/{id}
 *   - Event   → /events/{id}
 *   - Venue   → /map?venue={id}  (the map page reads this query param)
 *
 * A11y: the button is a `<button>` with aria-label. The modal contents
 * carry `role="search"`, the input has aria-label + aria-controls, and
 * the result groups are wrapped in `<ul role="listbox">` with each
 * row marked `role="option"`.
 *
 * Why not use an existing combobox library? CeSoir already ships
 * BottomSheet + motion/react + lucide; pulling in cmdk or similar
 * would add ~12kb for very little gain in this product surface.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "motion/react";
import { Search, X, ArrowLeft, Clock } from "@/components/ui/lucide";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SkeletonBlock, SkeletonText } from "@/components/ui/skeletons";
import { useGlobalSearch, type SearchResults } from "@/lib/useGlobalSearch";
import { haptics } from "@/lib/haptics";

// ---------------------------------------------------------------------------
// Recent searches — localStorage helper
// ---------------------------------------------------------------------------

const RECENT_KEY = "cesoir.global-search.recent";
const RECENT_MAX = 5;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function writeRecent(next: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage may be disabled (Safari private mode etc.) — ignore.
  }
}

function pushRecent(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readRecent();
  const current = readRecent();
  const dedup = [trimmed, ...current.filter((q) => q !== trimmed)].slice(
    0,
    RECENT_MAX,
  );
  writeRecent(dedup);
  return dedup;
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function ResultsSkeleton() {
  return (
    <div className="space-y-6 pt-4" aria-busy="true">
      {[0, 1, 2].map((group) => (
        <div key={group}>
          <SkeletonBlock className="mb-3 h-3 w-20" />
          <div className="space-y-3">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonText width="60%" />
                  <SkeletonText width="40%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center"
      role="status"
    >
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-bg-card">
        <Search size={24} className="text-text-muted" aria-hidden="true" />
      </div>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

function ResultGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section aria-labelledby={`gs-group-${title}`} className="mb-6 last:mb-0">
      <h3
        id={`gs-group-${title}`}
        className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
      >
        {title}
      </h3>
      <ul role="listbox" aria-label={title} className="space-y-1">
        {children}
      </ul>
    </section>
  );
}

interface RowProps {
  href: string;
  imageUrl?: string | null;
  imageAlt: string;
  title: string;
  subtitle: string;
  badge?: string | null;
  onSelect: () => void;
}

function Row({
  href,
  imageUrl,
  imageAlt,
  title,
  subtitle,
  badge,
  onSelect,
}: RowProps) {
  return (
    <li role="option" aria-selected="false">
      <Link
        href={href}
        onClick={onSelect}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-bg-card focus-visible:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-bg-card">
          {imageUrl ? (
            // next/image stays consistent with the rest of the app for
            // automatic optimization + lazy-load. Unoptimized=true on
            // ui-avatars URLs would be cheaper but we keep the default
            // pipeline so blur-up + resizing stay uniform.
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-text-muted">
              <Search size={16} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-text">
              {title}
            </p>
            {badge && (
              <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {badge}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-text-muted">{subtitle}</p>
        </div>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Helpers — formatting
// ---------------------------------------------------------------------------

function formatEventDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function venueIcon(type: string): string {
  switch (type) {
    case "restaurant":
      return "🍽️";
    case "bar":
      return "🍸";
    case "concert":
      return "🎤";
    case "cinema":
      return "🎬";
    case "balade":
      return "🌳";
    case "cafe":
      return "☕";
    case "musee":
      return "🏛️";
    case "sport":
      return "🧗";
    default:
      return "📍";
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    results,
    loading,
    reset,
  } = useGlobalSearch();

  // Load recents when the modal opens (lazy; avoid SSR access).
  useEffect(() => {
    if (open) {
      setRecent(readRecent());
      // Defer focus so the BottomSheet animation has placed the input
      // in the layout — focusing during transform causes mobile keyboards
      // to misalign on iOS Safari.
      const t = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Body-state cleanup when modal closes.
  const handleClose = useCallback(() => {
    setOpen(false);
    // Defer reset so the close animation doesn't flash empty UI.
    setTimeout(() => reset(), 250);
  }, [reset]);

  const handleOpen = useCallback(() => {
    haptics.light();
    setOpen(true);
  }, []);

  const handleSelectResult = useCallback(() => {
    if (query.trim().length >= 2) {
      const next = pushRecent(query);
      setRecent(next);
    }
    handleClose();
  }, [query, handleClose]);

  const handleRecentClick = useCallback(
    (term: string) => {
      setQuery(term);
    },
    [setQuery],
  );

  const handleClearRecent = useCallback(() => {
    writeRecent([]);
    setRecent([]);
  }, []);

  const handleClearInput = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, [setQuery]);

  const totalResults = useMemo(
    () =>
      results.profiles.length + results.events.length + results.venues.length,
    [results],
  );

  const showRecents = query.trim().length < 2 && recent.length > 0;
  const showEmptyHint = query.trim().length < 2 && recent.length === 0;
  const showNoResults =
    query.trim().length >= 2 && !loading && totalResults === 0;

  return (
    <>
      {/* Floating trigger button — top-right, fixed positioning so it's
          consistent across pages. Sits above BottomNav (z-[700]) and below
          BottomSheet backdrop (z-[850]). On desktop it stays anchored to
          the right edge of the 440px AppShell frame via `right-3` inside
          the standard fixed layer. */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Recherche globale"
        className="fixed right-3 top-3 z-[820] grid h-11 w-11 place-items-center rounded-full bg-bg/90 text-text shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-bg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:top-[68px]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Search size={20} aria-hidden="true" />
      </button>

      <BottomSheet open={open} onClose={handleClose}>
        <div role="search" aria-label="Recherche globale" className="-mx-6">
          {/* Header bar — back arrow, input, clear */}
          <div className="sticky top-0 z-10 flex items-center gap-2 bg-bg px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer la recherche"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-text transition-colors hover:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>

            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                autoComplete="off"
                spellCheck="false"
                aria-label="Rechercher un profil, une soirée ou un lieu"
                aria-controls="global-search-results"
                placeholder="Rechercher…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-2xl bg-bg-card pl-9 pr-10 text-base text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <AnimatePresence>
                {query.length > 0 && (
                  <m.button
                    key="clear"
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClearInput}
                    aria-label="Effacer la recherche"
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-bg text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X size={14} aria-hidden="true" />
                  </m.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Body */}
          <div id="global-search-results" className="px-4 pb-8">
            {showRecents && (
              <RecentSearches
                items={recent}
                onPick={handleRecentClick}
                onClear={handleClearRecent}
              />
            )}

            {showEmptyHint && (
              <EmptyState message="Tape un nom, un lieu, un mode…" />
            )}

            {loading && <ResultsSkeleton />}

            {!loading && query.trim().length >= 2 && (
              <ResultsBody
                results={results}
                onSelect={handleSelectResult}
              />
            )}

            {showNoResults && (
              <EmptyState
                message={`Aucun résultat pour « ${query.trim()} »`}
              />
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// ResultsBody / RecentSearches
// ---------------------------------------------------------------------------

function ResultsBody({
  results,
  onSelect,
}: {
  results: SearchResults;
  onSelect: () => void;
}) {
  return (
    <div className="pt-2">
      <ResultGroup title="Profils" count={results.profiles.length}>
        {results.profiles.map((p) => (
          <Row
            key={p.id}
            href={`/p/${p.id}`}
            imageUrl={p.photo}
            imageAlt={p.name}
            title={`${p.name}${p.age ? `, ${p.age}` : ""}`}
            subtitle={p.bio || p.mode}
            onSelect={onSelect}
          />
        ))}
      </ResultGroup>

      <ResultGroup title="Soirées" count={results.events.length}>
        {results.events.map((e) => (
          <Row
            key={e.id}
            href={`/events/${e.id}`}
            imageUrl={e.flyerUrl ?? null}
            imageAlt={e.title}
            title={e.title}
            subtitle={`${formatEventDate(e.startAt)} · ${e.venue.name}`}
            badge={e.counts.going > 0 ? `${e.counts.going}` : null}
            onSelect={onSelect}
          />
        ))}
      </ResultGroup>

      <ResultGroup title="Lieux" count={results.venues.length}>
        {results.venues.map((v) => (
          <Row
            key={v.id}
            href={`/map?venue=${v.id}`}
            imageUrl={null}
            imageAlt={v.name}
            title={`${venueIcon(v.type)} ${v.name}`}
            subtitle={`${v.arrondissement} · ${v.address}`}
            onSelect={onSelect}
          />
        ))}
      </ResultGroup>
    </div>
  );
}

function RecentSearches({
  items,
  onPick,
  onClear,
}: {
  items: string[];
  onPick: (term: string) => void;
  onClear: () => void;
}) {
  return (
    <section aria-label="Recherches récentes" className="pt-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Récentes
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-semibold text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:underline"
        >
          Effacer
        </button>
      </div>
      <ul className="space-y-1">
        {items.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onPick(term)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-bg-card focus-visible:bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Clock
                size={16}
                className="shrink-0 text-text-muted"
                aria-hidden="true"
              />
              <span className="truncate text-sm text-text">{term}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default GlobalSearch;

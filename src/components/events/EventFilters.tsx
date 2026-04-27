"use client";

import type { ReactNode } from "react";

/**
 * EventFilters — smart filter bar + bottom sheet for the Soirées listing.
 *
 * Layout (v2, 2026-04-27):
 *
 *   ┌────────────────────────────────────────────────┐
 *   │  [Date carousel] ← → … │ [Filtres N] button   │
 *   ├────────────────────────────────────────────────┤
 *   │  Smart combo chips  [Ce soir gratuit] [Près]…  │
 *   ├────────────────────────────────────────────────┤
 *   │  Active filter pills  [Techno ×] [Gratuit ×]   │
 *   └────────────────────────────────────────────────┘
 *
 * Bottom sheet (when "Filtres" tapped):
 *   - Multi-select category chips
 *   - Price range single-select
 *   - Distance single-select
 *   - Reset + "Voir N résultats" CTA
 */

import { useCallback, useMemo, useState } from "react";
import { m, AnimatePresence, type Transition } from "motion/react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { springs } from "@/lib/motion-design";
import {
  Filter,
  X,
  MapPin,
  Sparkles,
  Flame,
  Users,
  ChevronLeft,
  ChevronRight,
} from "@/components/ui/lucide";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_ORDER,
  DEFAULT_EVENT_FILTERS,
  countActiveFilters,
  type EventCategory,
  type EventFiltersState,
  type EventPriceRange,
  type EventDistanceBucket,
  type EventWhenFilter,
} from "@/lib/events-types";
import { app } from "@/lib/design-tokens";

// ─────────────────────────────────────────
// Date carousel helpers
// ─────────────────────────────────────────

interface DateSlot {
  id: EventWhenFilter;
  dayLabel: string; // "Auj.", "Dem.", "Sam.", "Dim."
  dateNum: string;  // "27", "28"…
  isTonight: boolean; // today after 18:00
}

function buildDateSlots(): DateSlot[] {
  const now = new Date();
  const hour = now.getHours();
  const isEvening = hour >= 18;

  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });

  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Weekend = next Sat + Sun
  const dow = now.getDay();
  const daysUntilSat = (6 - dow + 7) % 7 || 7;
  const sat = new Date(now);
  sat.setDate(sat.getDate() + daysUntilSat);

  const rawFmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  const numFmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric" });

  return [
    {
      id: "tonight",
      dayLabel: "Ce soir",
      dateNum: numFmt(today),
      isTonight: isEvening,
    },
    {
      id: "tomorrow",
      dayLabel: rawFmt(tomorrow).charAt(0).toUpperCase() + rawFmt(tomorrow).slice(1),
      dateNum: numFmt(tomorrow),
      isTonight: false,
    },
    {
      id: "weekend",
      dayLabel: "Week-end",
      dateNum: numFmt(sat),
      isTonight: false,
    },
    {
      id: "all",
      dayLabel: "Tout voir",
      dateNum: "∞",
      isTonight: false,
    },
  ];
}

// ─────────────────────────────────────────
// Smart combo chip definitions
// ─────────────────────────────────────────

interface SmartCombo {
  id: string;
  label: string;
  icon: ReactNode;
  patch: Partial<EventFiltersState>;
}

const SMART_COMBOS: SmartCombo[] = [
  {
    id: "free-tonight",
    label: "Ce soir gratuit",
    icon: <Sparkles size={12} aria-hidden />,
    patch: { when: "tonight", priceRange: "free" },
  },
  {
    id: "nearby",
    label: "Près de toi",
    icon: <MapPin size={12} aria-hidden />,
    patch: { distance: 2 },
  },
  {
    id: "intimate",
    label: "Premier RDV",
    icon: <Users size={12} aria-hidden />,
    patch: { categories: ["jazz", "apero", "live"] },
  },
  {
    id: "trending",
    label: "Tendance",
    icon: <Flame size={12} aria-hidden />,
    patch: { when: "tonight" },
  },
];

// ─────────────────────────────────────────
// Price range options
// ─────────────────────────────────────────

const PRICE_OPTIONS: Array<{ id: EventPriceRange; label: string }> = [
  { id: "free", label: "Gratuit" },
  { id: "low", label: "< 15€" },
  { id: "mid", label: "15–30€" },
  { id: "high", label: "30€+" },
];

// ─────────────────────────────────────────
// Distance options
// ─────────────────────────────────────────

const DISTANCE_OPTIONS: Array<{ id: EventDistanceBucket; label: string }> = [
  { id: 2, label: "< 2 km" },
  { id: 5, label: "< 5 km" },
  { id: 10, label: "< 10 km" },
  { id: 20, label: "< 20 km" },
];

// ─────────────────────────────────────────
// Haptic helper
// ─────────────────────────────────────────

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(6);
  }
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function DateSlotButton({
  slot,
  active,
  onClick,
}: {
  slot: DateSlot;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      aria-pressed={active}
      aria-label={`Filtrer par ${slot.dayLabel}`}
      onClick={() => { haptic(); onClick(); }}
      whileTap={{ scale: 0.92 }}
      transition={springs.snap as Transition}
      className={[
        "relative flex-shrink-0 flex flex-col items-center justify-center",
        "min-w-[60px] rounded-2xl px-3 py-2.5 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        "tap-target",
        active
          ? "text-white"
          : "bg-bg-card border border-border text-text-muted hover:text-text hover:border-accent/30",
      ].join(" ")}
      style={
        active
          ? { background: app.gradient }
          : {}
      }
    >
      {slot.isTonight && (
        <m.span
          aria-hidden
          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent-2"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span className={["text-[11px] font-bold leading-none", active ? "text-white" : ""].join(" ")}>
        {slot.dayLabel}
      </span>
      <span className={["text-[18px] font-display font-bold leading-tight mt-0.5", active ? "text-white/90" : "text-text"].join(" ")}>
        {slot.dateNum}
      </span>
    </m.button>
  );
}

function SmartComboChip({
  combo,
  active,
  onClick,
}: {
  combo: SmartCombo;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      aria-pressed={active}
      onClick={() => { haptic(); onClick(); }}
      whileTap={{ scale: 0.92 }}
      transition={springs.snap as Transition}
      className={[
        "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-[12px] font-semibold whitespace-nowrap transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        "tap-target",
        active
          ? "bg-accent text-white"
          : "bg-bg-card border border-border text-text-muted hover:text-text hover:border-accent/30",
      ].join(" ")}
    >
      {combo.icon}
      {combo.label}
    </m.button>
  );
}

function ActiveFilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={springs.snap as Transition}
      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-accent/10 border border-accent/25 text-accent text-[12px] font-semibold"
    >
      {label}
      <button
        type="button"
        aria-label={`Retirer le filtre ${label}`}
        onClick={() => { haptic(); onRemove(); }}
        className="rounded-full p-0.5 hover:bg-accent/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/60 transition-colors"
      >
        <X size={10} aria-hidden />
      </button>
    </m.div>
  );
}

// Sheet category chip
function SheetCategoryChip({
  cat,
  active,
  onClick,
}: {
  cat: EventCategory;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      aria-pressed={active}
      onClick={() => { haptic(); onClick(); }}
      whileTap={{ scale: 0.93 }}
      transition={springs.snap as Transition}
      className={[
        "inline-flex items-center rounded-full px-3.5 py-2",
        "text-[13px] font-semibold whitespace-nowrap transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        "tap-target",
        active
          ? "bg-accent text-white"
          : "bg-bg-card border border-border text-text-muted hover:text-text hover:border-accent/30",
      ].join(" ")}
    >
      {EVENT_CATEGORY_LABELS[cat]}
    </m.button>
  );
}

function SheetOptionChip<T>({
  value,
  label,
  active,
  onClick,
}: {
  value: T;
  label: string;
  active: boolean;
  onClick: (v: T) => void;
}) {
  return (
    <m.button
      type="button"
      aria-pressed={active}
      onClick={() => { haptic(); onClick(value); }}
      whileTap={{ scale: 0.93 }}
      transition={springs.snap as Transition}
      className={[
        "inline-flex items-center rounded-full px-4 py-2",
        "text-[13px] font-semibold whitespace-nowrap transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        "tap-target",
        active
          ? "bg-text text-bg"
          : "bg-bg-card border border-border text-text-muted hover:text-text hover:border-accent/30",
      ].join(" ")}
    >
      {label}
    </m.button>
  );
}

// ─────────────────────────────────────────
// FilterBadge — animated count on the button
// ─────────────────────────────────────────

function FilterBadge({ count }: { count: number }) {
  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <m.span
          key={count}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={springs.micro as Transition}
          className="inline-flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-white text-accent text-[10px] font-bold px-1 leading-none"
          aria-label={`${count} filtre${count > 1 ? "s" : ""} actif${count > 1 ? "s" : ""}`}
        >
          {count}
        </m.span>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export interface EventFiltersProps {
  value: EventFiltersState;
  onChange: (next: EventFiltersState) => void;
  /** Approximate count for the "Voir N résultats" CTA (comes from useEvents). */
  resultCount?: number;
}

export default function EventFilters({
  value,
  onChange,
  resultCount,
}: EventFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const dateSlots = useMemo(() => buildDateSlots(), []);
  const activeCount = useMemo(() => countActiveFilters(value), [value]);

  // ── Date carousel ──────────────────────────────────────
  const handleWhen = useCallback(
    (when: EventWhenFilter) => {
      onChange({ ...value, when });
    },
    [value, onChange],
  );

  // ── Smart combo chips ───────────────────────────────────
  const isComboActive = useCallback(
    (combo: SmartCombo): boolean => {
      const p = combo.patch;
      if (p.when && p.when !== value.when) return false;
      if (p.priceRange !== undefined && p.priceRange !== value.priceRange) return false;
      if (p.distance !== undefined && p.distance !== value.distance) return false;
      if (p.categories) {
        const required = p.categories as EventCategory[];
        const missing = required.some((c) => !value.categories.includes(c));
        if (missing) return false;
      }
      return true;
    },
    [value],
  );

  const handleCombo = useCallback(
    (combo: SmartCombo) => {
      const already = isComboActive(combo);
      if (already) {
        // Toggle off — reset only the fields this combo touches
        const next = { ...value };
        if ("when" in combo.patch) next.when = "all";
        if ("priceRange" in combo.patch) next.priceRange = null;
        if ("distance" in combo.patch) next.distance = null;
        if ("categories" in combo.patch) next.categories = [];
        next.category = next.categories[0] ?? null;
        onChange(next);
      } else {
        const cats =
          combo.patch.categories !== undefined
            ? (combo.patch.categories as EventCategory[])
            : value.categories;
        onChange({
          ...value,
          ...(combo.patch.when ? { when: combo.patch.when } : {}),
          ...(combo.patch.priceRange !== undefined ? { priceRange: combo.patch.priceRange } : {}),
          ...(combo.patch.distance !== undefined ? { distance: combo.patch.distance } : {}),
          categories: cats,
          category: cats[0] ?? value.category,
        });
      }
    },
    [value, onChange, isComboActive],
  );

  // ── Active pills ────────────────────────────────────────
  const activePills = useMemo(() => {
    const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];

    value.categories.forEach((cat) => {
      pills.push({
        key: `cat-${cat}`,
        label: EVENT_CATEGORY_LABELS[cat],
        onRemove: () => {
          const cats = value.categories.filter((c) => c !== cat);
          onChange({ ...value, categories: cats, category: cats[0] ?? null });
        },
      });
    });

    if (value.priceRange) {
      const opt = PRICE_OPTIONS.find((o) => o.id === value.priceRange);
      pills.push({
        key: "price",
        label: opt?.label ?? value.priceRange,
        onRemove: () => onChange({ ...value, priceRange: null }),
      });
    }

    if (value.distance !== null) {
      const opt = DISTANCE_OPTIONS.find((o) => o.id === value.distance);
      pills.push({
        key: "distance",
        label: opt?.label ?? `< ${value.distance} km`,
        onRemove: () => onChange({ ...value, distance: null }),
      });
    }

    return pills;
  }, [value, onChange]);

  // ── Sheet handlers ──────────────────────────────────────
  const [draft, setDraft] = useState<EventFiltersState>(value);

  const openSheet = useCallback(() => {
    setDraft(value);
    setSheetOpen(true);
  }, [value]);

  const applySheet = useCallback(() => {
    onChange({ ...draft, category: draft.categories[0] ?? null });
    setSheetOpen(false);
  }, [draft, onChange]);

  const resetSheet = useCallback(() => {
    setDraft(DEFAULT_EVENT_FILTERS);
  }, []);

  const toggleDraftCategory = useCallback((cat: EventCategory) => {
    setDraft((prev) => {
      const has = prev.categories.includes(cat);
      const cats = has
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: cats, category: cats[0] ?? null };
    });
  }, []);

  const setDraftPrice = useCallback((price: EventPriceRange) => {
    setDraft((prev) => ({
      ...prev,
      priceRange: prev.priceRange === price ? null : price,
    }));
  }, []);

  const setDraftDistance = useCallback((dist: EventDistanceBucket) => {
    setDraft((prev) => ({
      ...prev,
      distance: prev.distance === dist ? null : dist,
    }));
  }, []);

  const draftActiveCount = useMemo(() => countActiveFilters(draft), [draft]);

  // ── Render ──────────────────────────────────────────────
  return (
    <>
      {/* ── Row 1: Date carousel + Filter button ── */}
      <div className="flex items-center gap-3">
        {/* Date carousel — horizontal scroll, no scrollbar */}
        <div
          role="group"
          aria-label="Filtrer par date"
          className="flex gap-2 overflow-x-auto scrollbar-none flex-1 -mx-4 px-4"
        >
          {dateSlots.map((slot) => (
            <DateSlotButton
              key={slot.id}
              slot={slot}
              active={value.when === slot.id}
              onClick={() => handleWhen(slot.id)}
            />
          ))}
        </div>

        {/* Filtres button */}
        <m.button
          type="button"
          aria-label={`Ouvrir les filtres${activeCount > 0 ? `, ${activeCount} actifs` : ""}`}
          aria-expanded={sheetOpen}
          onClick={openSheet}
          whileTap={{ scale: 0.94 }}
          transition={springs.snap as Transition}
          className={[
            "flex-shrink-0 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5",
            "text-[13px] font-bold whitespace-nowrap transition-colors tap-target",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
            activeCount > 0
              ? "text-white"
              : "bg-bg-card border border-border text-text hover:border-accent/30",
          ].join(" ")}
          style={activeCount > 0 ? { background: app.gradient } : {}}
        >
          <Filter size={14} aria-hidden />
          Filtres
          <FilterBadge count={activeCount} />
        </m.button>
      </div>

      {/* ── Row 2: Smart combo chips ── */}
      <div
        role="group"
        aria-label="Suggestions de filtres combinés"
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pt-2"
      >
        {SMART_COMBOS.map((combo) => (
          <SmartComboChip
            key={combo.id}
            combo={combo}
            active={isComboActive(combo)}
            onClick={() => handleCombo(combo)}
          />
        ))}
      </div>

      {/* ── Row 3: Active filter pills ── */}
      <AnimatePresence>
        {activePills.length > 0 && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.snap as Transition}
            className="overflow-hidden"
          >
            <div
              role="group"
              aria-label="Filtres actifs"
              className="flex flex-wrap gap-2 pt-2"
            >
              <AnimatePresence>
                {activePills.map((pill) => (
                  <ActiveFilterPill
                    key={pill.key}
                    label={pill.label}
                    onRemove={pill.onRemove}
                  />
                ))}
              </AnimatePresence>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet ── */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtres"
        snapPoints={[0.5, 0.75, 0.92]}
        initialSnap={1}
      >
        <div className="space-y-6 pb-32">
          {/* Categories */}
          <section aria-labelledby="sheet-categories-heading">
            <h3
              id="sheet-categories-heading"
              className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-3"
            >
              Genre musical
            </h3>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORY_ORDER.map((cat) => (
                <SheetCategoryChip
                  key={cat}
                  cat={cat}
                  active={draft.categories.includes(cat)}
                  onClick={() => toggleDraftCategory(cat)}
                />
              ))}
            </div>
          </section>

          {/* Price */}
          <section aria-labelledby="sheet-price-heading">
            <h3
              id="sheet-price-heading"
              className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-3"
            >
              Prix d'entrée
            </h3>
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <SheetOptionChip<EventPriceRange>
                  key={opt.id ?? "null"}
                  value={opt.id}
                  label={opt.label}
                  active={draft.priceRange === opt.id}
                  onClick={setDraftPrice}
                />
              ))}
            </div>
          </section>

          {/* Distance */}
          <section aria-labelledby="sheet-distance-heading">
            <h3
              id="sheet-distance-heading"
              className="text-[12px] font-bold text-text-muted uppercase tracking-wider mb-3"
            >
              Distance
            </h3>
            <div className="flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((opt) => (
                <SheetOptionChip<EventDistanceBucket>
                  key={String(opt.id)}
                  value={opt.id}
                  label={opt.label}
                  active={draft.distance === opt.id}
                  onClick={setDraftDistance}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Sticky CTA row at bottom of sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-[852] flex items-center gap-3 px-6 pb-8 pt-4 bg-bg border-t border-border">
          <button
            type="button"
            onClick={resetSheet}
            className="flex-shrink-0 text-[14px] font-semibold text-text-muted underline underline-offset-2 tap-target focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Réinitialiser
          </button>
          <m.button
            type="button"
            onClick={applySheet}
            whileTap={{ scale: 0.97 }}
            transition={springs.snap as Transition}
            className="flex-1 flex items-center justify-center rounded-full py-3.5 text-[15px] font-bold text-white tap-target focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            style={{ background: app.gradient }}
          >
            {resultCount !== undefined
              ? `Voir ${resultCount} résultat${resultCount !== 1 ? "s" : ""}`
              : "Voir les résultats"}
            {draftActiveCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-white/25 text-[11px] font-bold">
                {draftActiveCount}
              </span>
            )}
          </m.button>
        </div>
      </BottomSheet>
    </>
  );
}

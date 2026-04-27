"use client";

/**
 * VenueDashboard — B2B owner-only dashboard (Wave 15 CRO 10/10).
 *
 * MVP surface (2026-04-23):
 *   - Admin legal strip (warns the user this is not the consumer app)
 *   - "Mes events" list (filter by creator or whitelist)
 *   - "Créer un event" button → inline form (modal-sheet style)
 *   - Analytics stub tiles (views / RSVPs / partnership status)
 *   - "Activer Featured" CTA — GATED by FEATURE_FLAGS.monetizationEnabled
 *
 * Security: the dashboard is already gated by middleware (NEXT_PUBLIC_VENUE_OWNERS).
 * This component assumes it only renders for whitelisted owners. RLS on `events`
 * is service_role-only writes at launch; the create-form uses the
 * /api/venues/events route which runs with service_role under the hood.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { MONETIZATION_ENABLED } from "@/lib/featureFlags";
import type { DbEventWithCounts, EventCategory } from "@/lib/supabase-types";
import { app } from "@/lib/design-tokens";

// ---- Types ---------------------------------------------------------------

interface EventAnalytics {
  views: number;
  rsvps: number;
  barPartnership: "active" | "pending" | "none";
}

interface CreateEventPayload {
  title: string;
  venueName: string;
  venueAddress: string;
  startsAt: string; // datetime-local string
  lineup: string;   // comma-separated
  flyerUrl: string;
  categories: EventCategory[];
}

const INITIAL_FORM: CreateEventPayload = {
  title: "",
  venueName: "",
  venueAddress: "",
  startsAt: "",
  lineup: "",
  flyerUrl: "",
  categories: [],
};

const CATEGORY_CHOICES: Array<{ value: EventCategory; label: string }> = [
  { value: "techno", label: "Techno" },
  { value: "house", label: "House" },
  { value: "hip_hop", label: "Hip-hop" },
  { value: "electro", label: "Electro" },
  { value: "rock", label: "Rock" },
  { value: "jazz", label: "Jazz" },
  { value: "rooftop", label: "Rooftop" },
  { value: "club", label: "Club" },
  { value: "bar", label: "Bar" },
  { value: "gratuit", label: "Gratuit" },
  { value: "apero", label: "Apéro" },
  { value: "afterwork", label: "Afterwork" },
];

// ---- Helpers -------------------------------------------------------------

function formatDateBadge(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// Deterministic mock analytics so each event has stable "views" / "rsvps"
// numbers across re-renders. Replace with a real query once we ship
// analytics tracking. Hash-then-mod (djb2) is fine for demo data.
function mockAnalytics(eventId: string): EventAnalytics {
  let h = 5381;
  for (let i = 0; i < eventId.length; i++) h = (h * 33) ^ eventId.charCodeAt(i);
  const views = 120 + (Math.abs(h) % 480);
  const rsvps = 8 + (Math.abs(h >> 2) % 62);
  const statuses: Array<EventAnalytics["barPartnership"]> = ["active", "pending", "none"];
  const partnership = statuses[Math.abs(h >> 5) % 3];
  return { views, rsvps, barPartnership: partnership };
}

// ---- Component -----------------------------------------------------------

export default function VenueDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<DbEventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featuredForEventId, setFeaturedForEventId] = useState<string | null>(null);

  // ---- Load "mes events" -----------------------------------------
  // Owners created via the dashboard set `source = 'partner'`. At MVP we
  // scope to all Montpellier events so the founder sees activity; swap to
  // `created_by` filtering once we add a `created_by` column (v2).
  const loadEvents = useCallback(async () => {
    setLoading(true);
    const { data, error: qErr } = await supabase
      .from("events_with_counts")
      .select("*")
      .eq("city_slug", "montpellier")
      .order("starts_at", { ascending: true })
      .limit(50);
    if (qErr) setError(qErr.message);
    else {
      setEvents((data ?? []) as DbEventWithCounts[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  // ---- Aggregate KPIs --------------------------------------------
  const kpis = useMemo(() => {
    const totalEvents = events.length;
    const totalRsvps = events.reduce((sum, e) => sum + (e.rsvp_count ?? 0), 0);
    const featured = events.filter((e) => e.featured).length;
    return { totalEvents, totalRsvps, featured };
  }, [events]);

  // ---- Create event ---------------------------------------------
  const [form, setForm] = useState<CreateEventPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        slug: slugify(`${form.title}-${Date.now().toString(36)}`),
        title: form.title.trim(),
        description: null,
        flyer_url: form.flyerUrl.trim() || null,
        venue_name: form.venueName.trim(),
        venue_address: form.venueAddress.trim() || null,
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: null,
        categories: form.categories,
        lineup: form.lineup
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        door_price_eur: null,
        ticket_url: null,
        city_slug: "montpellier",
        source: "partner" as const,
      };

      const res = await fetch("/api/venues/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      setForm(INITIAL_FORM);
      setShowCreate(false);
      await loadEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleCategory(cat: EventCategory) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  // ---- Featured activation --------------------------------------
  function handleFeaturedClick(eventId: string) {
    setFeaturedForEventId(eventId);
    setShowFeaturedModal(true);
  }

  // ---- Render ---------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* Admin strip */}
      <div
        role="banner"
        className="mb-6 -mx-5 px-5 py-2 text-center text-[11px] font-bold tracking-[0.2em] uppercase"
        style={{ background: "#111111", color: "#FFFFFF" }}
      >
        ADMIN · Dashboard Venues CeSoir — réservé aux propriétaires
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ color: app.violet }} aria-hidden>
            ☾
          </span>
          {/* 2026-04-27: dark-mode parity — title/subtitle use tokens. */}
          <h1 className="font-display text-2xl font-bold text-text">
            CeSoir Venues
          </h1>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {user?.email ?? "—"} · Montpellier
        </p>
      </header>

      {/* KPI tiles */}
      <section aria-label="KPIs" className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <KpiTile label="Mes events" value={kpis.totalEvents} />
        <KpiTile label="Total RSVPs" value={kpis.totalRsvps} />
        <KpiTile
          label="Featured actifs"
          value={kpis.featured}
          hint={!MONETIZATION_ENABLED ? "Monétisation désactivée" : undefined}
        />
      </section>

      {/* Create button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold">Mes events</h2>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-text text-text-inv px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {showCreate ? "Annuler" : "+ Créer un event"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <m.form
            key="create-form"
            onSubmit={handleCreate}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-6 overflow-hidden"
          >
            {/* 2026-04-27: dark-mode parity — neutrals → border/bg-card, text-neutral-900 → text-text. */}
            <div className="border border-border rounded-2xl p-5 bg-bg-card space-y-4">
              <h3 className="font-semibold text-text">Nouvel event</h3>

              <Field label="Titre">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                  maxLength={80}
                  className="w-full rounded-lg border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:border-text-muted"
                  placeholder="Ex: Techno Revolution w/ DJ XYZ"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Venue">
                  <input
                    value={form.venueName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, venueName: e.target.value }))
                    }
                    required
                    className="w-full rounded-lg border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:border-text-muted"
                    placeholder="Rockstore"
                  />
                </Field>
                <Field label="Adresse">
                  <input
                    value={form.venueAddress}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, venueAddress: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:border-text-muted"
                    placeholder="20 Rue de Verdun, Montpellier"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date & heure">
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startsAt: e.target.value }))
                    }
                    required
                    className="w-full rounded-lg border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:border-text-muted"
                  />
                </Field>
                <Field label="Flyer URL (optionnel)">
                  <input
                    value={form.flyerUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, flyerUrl: e.target.value }))
                    }
                    type="url"
                    className="w-full rounded-lg border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:border-text-muted"
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <Field label="Lineup (séparé par virgule)">
                <input
                  value={form.lineup}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, lineup: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:border-text-muted"
                  placeholder="DJ XYZ, MC Blue, B2B Set"
                />
              </Field>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                  Catégories
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_CHOICES.map((c) => {
                    const active = form.categories.includes(c.value);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => toggleCategory(c.value)}
                        className={[
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          // 2026-04-27: dark-mode parity — neutrals → text/bg/border tokens.
                          active
                            ? "bg-text text-text-inv border-text"
                            : "bg-bg text-text-muted border-border hover:border-text-muted",
                        ].join(" ")}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {formError && (
                <p className="text-xs text-danger" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full px-4 py-2 text-sm text-text-muted hover:text-text"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title || !form.venueName || !form.startsAt}
                  className="rounded-full bg-text text-text-inv px-5 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                >
                  {submitting ? "Publication..." : "Publier"}
                </button>
              </div>
            </div>
          </m.form>
        )}
      </AnimatePresence>

      {/* Events list */}
      <section aria-label="Liste des events" className="space-y-3">
        {loading && events.length === 0 ? (
          <div className="text-center py-12 text-sm text-text-muted">
            Chargement...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-danger">{error}</div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-10 text-center">
            <p className="text-sm text-text-muted mb-1">Aucun event pour l&apos;instant.</p>
            <p className="text-xs text-text-muted opacity-75">
              Clique sur &laquo; Créer un event &raquo; pour publier ta première soirée.
            </p>
          </div>
        ) : (
          events.map((event) => {
            const analytics = mockAnalytics(event.id);
            return (
              <article
                key={event.id}
                // 2026-04-27: dark-mode parity — bg-white → bg-bg-card, neutrals → border.
                className="border border-border rounded-2xl p-4 bg-bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text truncate">
                        {event.title}
                      </h3>
                      {event.featured && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ background: app.violet, color: "#fff" }}
                        >
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      {formatDateBadge(event.starts_at)} · {event.venue_name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-xs text-text-muted opacity-75 mb-0.5">RSVP</span>
                    <span className="font-semibold text-text">
                      {event.rsvp_count ?? 0}
                    </span>
                  </div>
                </div>

                {/* Analytics row */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Vues" value={analytics.views} />
                  <Stat label="RSVPs" value={analytics.rsvps} />
                  <Stat
                    label="Bar partnership"
                    value={
                      analytics.barPartnership === "active"
                        ? "Actif"
                        : analytics.barPartnership === "pending"
                          ? "En cours"
                          : "—"
                    }
                    small
                  />
                </div>

                {/* Featured CTA */}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleFeaturedClick(event.id)}
                    className={[
                      "rounded-full px-4 py-1.5 text-xs font-semibold border transition-opacity",
                      event.featured
                        ? "border-border text-text-muted opacity-60 cursor-default"
                        : "border-text bg-text text-text-inv hover:opacity-90",
                    ].join(" ")}
                    disabled={event.featured}
                  >
                    {event.featured ? "Déjà Featured" : "Activer Featured"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Featured gated modal */}
      <AnimatePresence>
        {showFeaturedModal && (
          <m.div
            key="featured-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowFeaturedModal(false)}
          >
            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              // 2026-04-27: dark-mode parity — modal panel uses bg-bg token.
              className="bg-bg rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 2026-04-27: dark-mode parity — modal title/copy/CTAs use tokens. */}
              <h3 className="font-display text-xl font-bold text-text mb-2">
                {MONETIZATION_ENABLED ? "Activer Featured" : "Bientôt disponible"}
              </h3>
              <p className="text-sm text-text-muted mb-4">
                {MONETIZATION_ENABLED
                  ? "Ton event sera épinglé en haut du feed Soirées pendant 7 jours. Paiement via Stripe."
                  : "La monétisation B2B arrive dans les prochaines semaines. Pour l'instant, tous les events sont organiques. Garde ton event actif et contacte-nous pour être prioritaire."}
              </p>
              {MONETIZATION_ENABLED ? (
                <button
                  type="button"
                  onClick={async () => {
                    // Placeholder — Stripe checkout route would be created when flag flips.
                    alert(
                      `Checkout Stripe (désactivé) pour event ${featuredForEventId}`,
                    );
                    setShowFeaturedModal(false);
                  }}
                  className="w-full rounded-full bg-text text-text-inv py-3 text-sm font-semibold hover:opacity-90"
                >
                  Payer 49 € · 7 jours Featured
                </button>
              ) : (
                <a
                  href="mailto:hello@cesoir.app?subject=Featured%20event%20Venues"
                  className="block text-center w-full rounded-full border border-border text-text py-3 text-sm font-semibold hover:border-text-muted"
                >
                  Nous contacter
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowFeaturedModal(false)}
                className="block mx-auto mt-3 text-xs text-text-muted"
              >
                Fermer
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Sub-components ------------------------------------------------------

function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  // 2026-04-27: dark-mode parity — KPI tile uses tokens for bg, border, text.
  return (
    <div className="border border-border rounded-2xl p-4 bg-bg-card">
      <div className="text-[11px] uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold text-text">
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-text-muted opacity-75">{hint}</div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: number | string;
  small?: boolean;
}) {
  // 2026-04-27: dark-mode parity — inner stat tile uses bg-bg + tokens.
  return (
    <div className="rounded-lg bg-bg px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-text-muted opacity-75">
        {label}
      </div>
      <div
        className={[
          "mt-0.5 font-semibold text-text",
          small ? "text-xs" : "text-sm",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

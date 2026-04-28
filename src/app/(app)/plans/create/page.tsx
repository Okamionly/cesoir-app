"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { m } from "motion/react";
import { springs } from "@/lib/motion-design";
import { usePlans, PLAN_TYPE_META, type PlanType } from "@/lib/usePlans";
import {
  PLAN_TEMPLATES,
  resolveTemplateWhen,
  type PlanTemplate,
} from "@/lib/planTemplates";
import type { ModeKey } from "@/lib/modes";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import PageLoader from "@/components/app/PageLoader";
import { WingmanPicker } from "@/components/plans/WingmanPicker";

const PUBLIC_TYPES: PlanType[] = ["flash", "soiree", "popup"];

function CreatePlanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const defaultType = (searchParams?.get("type") as PlanType) ?? "flash";
  const validatedDefault = PUBLIC_TYPES.includes(defaultType) ? defaultType : "flash";

  const [type, setType] = useState<PlanType>(validatedDefault);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [whenAt, setWhenAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const minWhenAt = useMemo(() => new Date().toISOString().slice(0, 16), []);
  const [maxParticipants, setMaxParticipants] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeKey | null>(null);
  // Wingman opt-in: when ON, we open the picker right after the plan
  // is created so the user can invite a friend in one flow.
  const [wantsWingman, setWantsWingman] = useState(false);
  const [wingmanPickerOpen, setWingmanPickerOpen] = useState(false);
  const [pickerPlanId, setPickerPlanId] = useState<string | null>(null);

  const { createPlan } = usePlans();

  // ── Template seeding ──────────────────────────────────────
  // Tapping a template fills the form with sensible defaults but
  // leaves every field editable. Re-tapping the same template is a
  // no-op (avoids overwriting user edits). Tapping a different one
  // re-seeds the title/when/mode only — venue and description are
  // preserved (the user may have written something useful).
  const applyTemplate = useCallback((tpl: PlanTemplate) => {
    if (templateId === tpl.id) return;
    setTemplateId(tpl.id);
    setMode(tpl.mode);
    setTitle(tpl.suggestedTitle);
    setWhenAt(resolveTemplateWhen(tpl.suggestedTime));
  }, [templateId]);

  const meta = PLAN_TYPE_META[type];
  const canSubmit = useMemo(() => title.trim().length > 2 && whenAt.length > 0, [title, whenAt]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const whenIso = new Date(whenAt).toISOString();
      const deadlineIso = type === "flash"
        ? new Date(Date.now() + 30 * 60_000).toISOString()
        : whenIso;

      const id = await createPlan({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        whereText: venue.trim(),
        venue: venue.trim() || undefined,
        whenAt: whenIso,
        deadline: deadlineIso,
        maxParticipants,
        mode: mode ?? undefined,
      });

      if (id) {
        toast("Plan créé — visible par tous les profils compatibles.", "success");
        if (wantsWingman) {
          // Open picker without leaving this screen — the user picks a
          // wingman, the modal closes, then they navigate to /plans/:id.
          setPickerPlanId(id);
          setWingmanPickerOpen(true);
        } else {
          router.push(`/plans/${id}`);
        }
        return;
      }

      // Failure: stay on the form so the user keeps their input.
      toast("Création échouée — réessaie.", "error");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast(`Création échouée — ${message}`, "error");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, title, description, venue, whenAt, type, maxParticipants, mode, createPlan, router, toast, wantsWingman]);

  const handlePickerClose = useCallback(() => {
    setWingmanPickerOpen(false);
    if (pickerPlanId) {
      router.push(`/plans/${pickerPlanId}`);
    }
  }, [router, pickerPlanId]);

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="Créer un plan" backHref="/plans" />

      <main className="px-5 pt-5 space-y-5 max-w-lg mx-auto">
        {/* Templates — tap to pre-fill the form. Single row, no scroll
            (flex-1 + min-w-0 distribution, same pattern as EventFilters v3).
            6 pills fit on a 390px viewport. Re-tap = no-op so we don't
            stomp on edits. */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block">
            Modèles
          </label>
          <div
            role="group"
            aria-label="Modèles de plan"
            className="flex items-stretch gap-1.5"
          >
            {PLAN_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const active = templateId === tpl.id;
              return (
                <m.button
                  key={tpl.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Modèle ${tpl.label}`}
                  onClick={() => applyTemplate(tpl)}
                  whileTap={{ scale: 0.94 }}
                  transition={springs.snap}
                  className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2.5 border text-[11px] font-semibold transition-all ${
                    active
                      ? "border-accent gradient-bg text-white shadow-glow"
                      : "border-border bg-card text-text-muted"
                  }`}
                >
                  <Icon
                    size={16}
                    aria-hidden
                    className={active ? "text-white" : "text-text"}
                  />
                  <span className="truncate w-full text-center">{tpl.label}</span>
                </m.button>
              );
            })}
          </div>
          {templateId && (
            <p className="text-[11px] text-text-muted mt-2">
              Modèle appliqué — tu peux tout modifier ci-dessous.
            </p>
          )}
        </div>

        {/* Type picker */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block">Type</label>
          <div className="flex gap-2">
            {PUBLIC_TYPES.map((t) => {
              const item = PLAN_TYPE_META[t];
              return (
                <m.button
                  key={t}
                  onClick={() => setType(t)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 px-3 py-3 rounded-2xl border text-[12px] font-semibold transition-all ${
                    type === t
                      ? "border-accent gradient-bg text-white shadow-glow"
                      : "border-border text-text-muted"
                  }`}
                >
                  <div className="text-xl mb-1" aria-hidden="true">{item.emoji}</div>
                  {item.label}
                </m.button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted mt-2">{meta.description}</p>
        </div>

        {/* Title */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block" htmlFor="plan-title">
            Titre *
          </label>
          <input
            id="plan-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Happy hour rooftop"
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
            maxLength={80}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block" htmlFor="plan-description">
            Description
          </label>
          <textarea
            id="plan-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Plus d'infos..."
            rows={3}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none resize-none"
            maxLength={300}
          />
        </div>

        {/* Venue */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block" htmlFor="plan-venue">
            Lieu
          </label>
          <input
            id="plan-venue"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Ex: Le Perchoir, 11e"
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
            maxLength={120}
          />
        </div>

        {/* When */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block" htmlFor="plan-when">
            Quand *
          </label>
          <input
            id="plan-when"
            type="datetime-local"
            value={whenAt}
            min={minWhenAt}
            onChange={(e) => setWhenAt(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>

        {/* Max participants */}
        <div>
          <label className="text-[11px] font-semibold text-text-muted uppercase mb-2 block">
            Participants max: {maxParticipants}
          </label>
          <input
            type="range"
            min={2}
            max={30}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
          />
        </div>

        {/* Wingman toggle */}
        <div>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 cursor-pointer">
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-text">
                Inviter un wingman
              </span>
              <span className="block text-[12px] text-text-muted leading-snug mt-0.5">
                Un ami CeSoir vient avec toi (max 4 personnes au total).
              </span>
            </span>
            <input
              type="checkbox"
              checked={wantsWingman}
              onChange={(e) => setWantsWingman(e.target.checked)}
              aria-label="Activer l'invitation wingman"
              className="w-5 h-5 accent-accent flex-shrink-0"
            />
          </label>
        </div>

        {/* Submit */}
        <m.button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          whileHover={canSubmit && !submitting ? { scale: 1.02 } : {}}
          whileTap={canSubmit && !submitting ? { scale: 0.97 } : {}}
          transition={springs.snap}
          className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${
            canSubmit && !submitting
              ? "gradient-bg text-white shadow-glow"
              : "border border-border text-text-muted/50 cursor-not-allowed"
          }`}
        >
          {submitting ? "Création..." : "Créer le plan"}
        </m.button>
      </main>

      {pickerPlanId && (
        <WingmanPicker
          open={wingmanPickerOpen}
          onClose={handlePickerClose}
          planId={pickerPlanId}
        />
      )}
    </div>
  );
}

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CreatePlanPageInner />
    </Suspense>
  );
}

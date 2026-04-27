"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { m } from "motion/react";
import { springs } from "@/lib/motion-design";
import { usePlans, PLAN_TYPE_META, type PlanType } from "@/lib/usePlans";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

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

  const { createPlan } = usePlans();

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
      });

      if (id) {
        toast("Plan créé — visible par tous les profils compatibles.", "success");
        router.push(`/plans/${id}`);
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
  }, [canSubmit, submitting, title, description, venue, whenAt, type, maxParticipants, createPlan, router, toast]);

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="Créer un plan" backHref="/plans" />

      <main className="px-5 pt-5 space-y-5 max-w-lg mx-auto">
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
    </div>
  );
}

export default function CreatePlanPage() {
  return (
    <Suspense fallback={null}>
      <CreatePlanPageInner />
    </Suspense>
  );
}

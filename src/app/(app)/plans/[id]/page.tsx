"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { usePlan, PLAN_TYPE_META } from "@/lib/usePlans";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  const { plan, loading, error, isInterested, toggleInterest } = usePlan(planId);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted text-sm">Chargement...</div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        <p className="text-text-muted text-sm">Plan introuvable</p>
        <Link href="/plans" className="text-accent text-sm mt-2 inline-block">
          Retour aux plans
        </Link>
      </div>
    );
  }

  const meta = PLAN_TYPE_META[plan.type];
  const isFull = plan.maxParticipants > 0 && plan.participants.length >= plan.maxParticipants;

  return (
    <div className="min-h-screen bg-bg pb-28">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-muted hover:text-accent transition-colors"
            aria-label="Retour"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-bold text-text truncate">{plan.title}</span>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5 max-w-lg mx-auto">
        {/* Hero */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-[32px]" aria-hidden="true">
            {meta.emoji}
          </div>
          <div className="flex-1">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent uppercase mb-1">
              {meta.label}
            </span>
            <h1 className="text-lg font-bold text-text leading-tight">{plan.title}</h1>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-text-soft leading-relaxed">{plan.description}</p>
        )}

        {/* Info block */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <div>
              <div className="text-[11px] text-text-muted font-semibold uppercase">Quand</div>
              <div className="text-sm text-text">{formatDateTime(plan.whenAt)}</div>
            </div>
          </div>

          {plan.venue && (
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent mt-0.5 shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <div>
                <div className="text-[11px] text-text-muted font-semibold uppercase">Ou</div>
                <div className="text-sm text-text">{plan.venue}</div>
                {plan.whereText && plan.whereText !== plan.venue && (
                  <div className="text-xs text-text-muted">{plan.whereText}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent mt-0.5 shrink-0">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <div>
              <div className="text-[11px] text-text-muted font-semibold uppercase">Participants</div>
              <div className="text-sm text-text">
                {plan.participants.length}
                {plan.maxParticipants > 0 ? ` / ${plan.maxParticipants}` : ""} interesses
              </div>
            </div>
          </div>
        </div>

        {/* Attendees */}
        {plan.participants.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold text-text-muted uppercase mb-2">Deja la</h2>
            <div className="flex flex-wrap gap-2">
              {plan.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-card border border-border rounded-full pl-1 pr-3 py-1">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                      {p.name[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className="text-[11px] text-text font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.button
          onClick={() => void toggleInterest()}
          disabled={isFull && !isInterested}
          whileHover={!isFull || isInterested ? { scale: 1.02 } : {}}
          whileTap={!isFull || isInterested ? { scale: 0.97 } : {}}
          transition={springs.snap}
          className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${
            isInterested
              ? "gradient-bg text-white shadow-glow"
              : isFull
                ? "border border-border text-text-muted/50 cursor-not-allowed"
                : "border border-accent text-accent hover:bg-accent/10"
          }`}
        >
          {isInterested ? "Inscrit \u2713 — cliquer pour se desinscrire" : isFull ? "Complet" : "J'y vais"}
        </motion.button>
      </main>
    </div>
  );
}

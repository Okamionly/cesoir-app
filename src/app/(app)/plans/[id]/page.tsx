"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { m } from "motion/react";
import { springs } from "@/lib/motion-design";
import { usePlan, PLAN_TYPE_META } from "@/lib/usePlans";
import PageHeader from "@/components/ui/PageHeader";
import { Clock, MapPin, Users } from "@/components/ui/lucide";

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
      <PageHeader title={plan.title} onBack={() => router.back()} />

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
            <Clock size={18} strokeWidth={2} className="text-accent mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] text-text-muted font-semibold uppercase">Quand</div>
              <div className="text-sm text-text">{formatDateTime(plan.whenAt)}</div>
            </div>
          </div>

          {plan.venue && (
            <div className="flex items-start gap-3">
              <MapPin size={18} strokeWidth={2} className="text-accent mt-0.5 shrink-0" />
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
            <Users size={18} strokeWidth={2} className="text-accent mt-0.5 shrink-0" />
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
                    <Image src={p.avatar} alt={p.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
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
        <m.button
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
        </m.button>
      </main>
    </div>
  );
}

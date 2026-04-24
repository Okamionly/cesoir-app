"use client";

import { useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import { Magnetic } from "@/components/motion/Magnetic";
import { usePlans, PLAN_TYPE_META, type PlanType } from "@/lib/usePlans";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/skeletons";
import PageHeader from "@/components/ui/PageHeader";
import { Plus } from "@/components/ui/lucide";

const TYPE_FILTERS: { key: PlanType | "all"; label: string; emoji: string }[] = [
  { key: "all", label: "Tous", emoji: "\uD83C\uDF1F" },
  { key: "flash", label: "Flash", emoji: "\u26A1" },
  { key: "soiree", label: "Soirees", emoji: "\uD83C\uDF7B" },
  { key: "popup", label: "Events", emoji: "\uD83C\uDF89" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springs.heavy },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
}

function PlansPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get("type") as PlanType | null;
  const activeType: PlanType | "all" =
    typeParam && ["flash", "soiree", "popup"].includes(typeParam) ? typeParam : "all";

  const { plans, loading, myInterest, toggleInterest } = usePlans({
    type: activeType === "all" ? undefined : activeType,
  });

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => new Date(a.whenAt).getTime() - new Date(b.whenAt).getTime()),
    [plans],
  );

  const setType = useCallback(
    (t: PlanType | "all") => {
      if (t === "all") router.push("/plans");
      else router.push(`/plans?type=${t}`);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Plans ce soir
            <span className="text-[10px] text-accent/70 font-medium ml-1">
              {sortedPlans.length}
            </span>
          </span>
        }
        icon={<span className="text-lg" aria-hidden="true">{"\u263E"}</span>}
        iconAnimation="float"
        rackFocus
        actions={
          <Magnetic strength={0.18} radius={80}>
            <Link href={`/plans/create${activeType !== "all" ? `?type=${activeType}` : ""}`}>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full gradient-bg text-white text-[11px] font-bold shadow-glow">
                <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
                Creer
              </span>
            </Link>
          </Magnetic>
        }
        slotBelowTitle={
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((tab) => (
              <m.button
                key={tab.key}
                onClick={() => setType(tab.key)}
                whileTap={{ scale: 0.92 }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border tap-target transition-all ${
                  activeType === tab.key
                    ? "border-accent gradient-bg text-white"
                    : "border-border text-text-muted"
                }`}
              >
                <span className="mr-1" aria-hidden="true">{tab.emoji}</span>
                {tab.label}
              </m.button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="px-4 pt-4">
          <SkeletonList count={4} itemHeight={112} />
        </div>
      ) : sortedPlans.length === 0 ? (
        <EmptyState
          emoji={"\u263E"}
          title="Aucun plan pour le moment"
          subtitle="Sois le premier a en creer un !"
          actionLabel="Creer un plan"
          actionHref={`/plans/create${activeType !== "all" ? `?type=${activeType}` : ""}`}
        />
      ) : (
        <m.div
          className="px-4 space-y-3 pt-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          role="list"
        >
          <AnimatePresence mode="popLayout">
            {sortedPlans.map((plan) => {
              const meta = PLAN_TYPE_META[plan.type];
              const isInterested = myInterest.has(plan.id);
              const isFull = plan.maxParticipants > 0 && plan.participants.length >= plan.maxParticipants;

              return (
                <m.div key={plan.id} variants={cardVariants} layout role="listitem">
                  <m.div
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/plans/${plan.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/plans/${plan.id}`);
                      }
                    }}
                    aria-label={`Voir ${plan.title}`}
                    className="bg-card border border-border rounded-2xl p-4 hover:border-accent/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40"
                    whileHover={{ y: -3, boxShadow: "0 8px 25px color-mix(in srgb, var(--color-text) 15%, transparent)", transition: springs.gentle }}
                    whileTap={{ scale: 0.98, transition: springs.micro }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-[22px] shrink-0" aria-hidden="true">
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[14px] font-bold text-text leading-tight">{plan.title}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/15 text-accent uppercase">
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-text-muted font-medium">
                            {formatTime(plan.whenAt)}
                          </span>
                          {plan.venue && (
                            <>
                              <span className="text-text-muted/40">·</span>
                              <span className="text-[11px] text-text-muted truncate">
                                {plan.venue}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="text-[10px] text-text-muted font-medium">
                            {plan.participants.length}
                            {plan.maxParticipants > 0 ? `/${plan.maxParticipants}` : ""} interesses
                          </span>
                          <div className="flex-1" />
                          <m.button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void toggleInterest(plan.id);
                            }}
                            disabled={isFull && !isInterested}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                              isInterested
                                ? "gradient-bg text-white shadow-glow"
                                : isFull
                                  ? "border border-border text-text-muted/50 cursor-not-allowed"
                                  : "border border-accent/30 text-accent hover:bg-accent/10"
                            }`}
                            whileHover={!isFull || isInterested ? { scale: 1.05 } : {}}
                            whileTap={!isFull || isInterested ? { scale: 0.92 } : {}}
                          >
                            {isInterested ? "Inscrit \u2713" : isFull ? "Complet" : "J'y vais"}
                          </m.button>
                        </div>
                      </div>
                    </div>
                  </m.div>
                </m.div>
              );
            })}
          </AnimatePresence>
        </m.div>
      )}
    </div>
  );
}

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansPageInner />
    </Suspense>
  );
}

"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { springs } from "@/lib/motion-design";
import { RackFocus } from "@/components/motion/RackFocus";
import { Magnetic } from "@/components/motion/Magnetic";
import { usePlans, PLAN_TYPE_META, type PlanType } from "@/lib/usePlans";

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

export default function PlansPage() {
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
      <header className="relative sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <RackFocus duration={0.5}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <motion.span
                className="text-lg"
                aria-hidden="true"
                animate={{ rotate: [0, 4, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                {"\u263E"}
              </motion.span>
              <h1 className="text-base font-display font-bold text-text">Plans ce soir</h1>
              <span className="text-[10px] text-accent/70 font-medium ml-1">
                {sortedPlans.length}
              </span>
            </div>
            <Magnetic strength={0.18} radius={80}>
              <Link href={`/plans/create${activeType !== "all" ? `?type=${activeType}` : ""}`}>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full gradient-bg text-white text-[11px] font-bold shadow-glow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Creer
                </span>
              </Link>
            </Magnetic>
          </div>
        </RackFocus>

        <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
          {TYPE_FILTERS.map((tab) => (
            <motion.button
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
            </motion.button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="px-4 space-y-3 pt-4" role="status" aria-label="Chargement">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : sortedPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4 text-3xl">
            {"\u263E"}
          </div>
          <p className="text-sm font-semibold text-text-muted">Aucun plan pour le moment</p>
          <p className="text-xs text-text-muted mt-1">Sois le premier a en creer un !</p>
          <Link href={`/plans/create${activeType !== "all" ? `?type=${activeType}` : ""}`}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-full gradient-bg text-white text-xs font-bold shadow-glow"
            >
              Creer un plan
            </motion.span>
          </Link>
        </div>
      ) : (
        <motion.div
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
                <motion.div key={plan.id} variants={cardVariants} layout role="listitem">
                  <motion.div
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
                    whileHover={{ y: -3, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", transition: springs.gentle }}
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
                          <motion.button
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
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

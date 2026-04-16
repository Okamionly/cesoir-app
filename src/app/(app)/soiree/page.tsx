"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useSoiree, SOIREE_TYPES, BUDGET_OPTIONS } from "@/lib/useSoiree";
import type { SoireeType, BudgetRange } from "@/lib/useSoiree";
import { PARIS_ARRONDISSEMENTS } from "@/lib/popup-events";
import SoireeCard from "@/components/app/SoireeCard";
import Link from "next/link";

// ---------- Filter types ----------

type ViewTab = "a-venir" | "mes-soirees" | "invitations";

const VIEW_TABS: { key: ViewTab; label: string }[] = [
  { key: "a-venir", label: "A venir" },
  { key: "mes-soirees", label: "Mes soirees" },
  { key: "invitations", label: "Invitations" },
];

// ---------- Page ----------

export default function SoireePage() {
  const { soirees, actions } = useSoiree();
  const [viewTab, setViewTab] = useState<ViewTab>("a-venir");
  const [filterType, setFilterType] = useState<SoireeType | "tous">("tous");
  const [filterArr, setFilterArr] = useState<string>("tous");
  const [filterBudget, setFilterBudget] = useState<BudgetRange | "tous">("tous");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...soirees];

    // Tab filter
    if (viewTab === "mes-soirees") {
      list = list.filter((s) => s.creatorId === "current-user");
    } else if (viewTab === "invitations") {
      list = list.filter((s) => s.attendees.some((a) => a.userId === "current-user" && a.status === "pending"));
    }

    // Type filter
    if (filterType !== "tous") {
      list = list.filter((s) => s.type === filterType);
    }

    // Arrondissement filter
    if (filterArr !== "tous") {
      list = list.filter((s) => s.arrondissement === filterArr);
    }

    // Budget filter
    if (filterBudget !== "tous") {
      list = list.filter((s) => s.budget === filterBudget);
    }

    // Sort: soonest first
    list.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    return list;
  }, [soirees, viewTab, filterType, filterArr, filterBudget]);

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-text">Soirees</h1>
              <p className="text-sm text-text-muted mt-0.5">Organisez, rejoignez, vivez</p>
            </div>
            <Link
              href="/soiree/create"
              className="flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Creer
            </Link>
          </div>

          {/* View tabs */}
          <div className="flex gap-1 bg-bg-card rounded-xl p-1">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewTab(tab.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewTab === tab.key
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtres
            {(filterType !== "tous" || filterArr !== "tous" || filterBudget !== "tous") && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.snap}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  {/* Type filter */}
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1.5">Type</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setFilterType("tous")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filterType === "tous" ? "bg-accent text-white" : "bg-bg-card text-text-muted border border-border"
                        }`}
                      >
                        Tous
                      </button>
                      {SOIREE_TYPES.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setFilterType(t.key)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            filterType === t.key ? "bg-accent text-white" : "bg-bg-card text-text-muted border border-border"
                          }`}
                        >
                          {t.emoji} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Arrondissement filter */}
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1.5">Arrondissement</p>
                    <select
                      value={filterArr}
                      onChange={(e) => setFilterArr(e.target.value)}
                      className="w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-sm text-text"
                    >
                      <option value="tous">Tous</option>
                      {PARIS_ARRONDISSEMENTS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {/* Budget filter */}
                  <div>
                    <p className="text-xs font-medium text-text-muted mb-1.5">Budget</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setFilterBudget("tous")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filterBudget === "tous" ? "bg-accent text-white" : "bg-bg-card text-text-muted border border-border"
                        }`}
                      >
                        Tous
                      </button>
                      {BUDGET_OPTIONS.map((b) => (
                        <button
                          key={b.key}
                          onClick={() => setFilterBudget(b.key)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            filterBudget === b.key ? "bg-accent text-white" : "bg-bg-card text-text-muted border border-border"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Soiree list */}
      <div className="px-4 pt-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.heavy}
              className="text-center py-16"
            >
              <div className="text-4xl mb-3">
                {viewTab === "mes-soirees" ? "\uD83C\uDF1F" : viewTab === "invitations" ? "\uD83D\uDCE8" : "\uD83C\uDF19"}
              </div>
              <p className="text-text-muted text-sm">
                {viewTab === "mes-soirees"
                  ? "Vous n'avez pas encore cree de soiree"
                  : viewTab === "invitations"
                    ? "Aucune invitation en attente"
                    : "Aucune soiree ne correspond a vos filtres"}
              </p>
              {viewTab !== "a-venir" && (
                <Link
                  href="/soiree/create"
                  className="inline-flex items-center gap-1.5 mt-4 bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
                >
                  Creer ma soiree
                </Link>
              )}
            </motion.div>
          ) : (
            filtered.map((s, i) => (
              <SoireeCard
                key={s.id}
                soiree={s}
                index={i}
                onJoin={(id) => {
                  const target = soirees.find((x) => x.id === id);
                  if (target?.isPrivate) {
                    actions.requestJoin(id);
                  } else {
                    actions.joinSoiree(id);
                  }
                }}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Floating CTA */}
      <Link href="/soiree/create">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.elastic}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-glow"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>
      </Link>
    </div>
  );
}

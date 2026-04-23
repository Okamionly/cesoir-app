"use client";

/**
 * RunwayCalculator — interactive CFO runway tool (owner-only).
 *
 * Wave 15 · CFO 10/10 · 2026-04-23.
 * Exposes the 3-scenario model from `docs/finance/COST_PROJECTION.md` as a
 * live calculator. User edits starting cash, monthly burn, and optional
 * revenue ramp; gets runway in months + break-even + gate dates back.
 *
 * Stateful:
 *   - localStorage key `cesoir_runway_v1`: persists last-used inputs.
 *   - `export JSON` button: one-click copy to clipboard.
 *
 * No network calls. Pure derived state — safe for read-only owners.
 */

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cesoir_runway_v1";

interface RunwayInputs {
  startingCashEur: number;
  monthlyFixedBurnEur: number;
  humanCostsEur: number;
  monthlyRevenueStartMonth: number;
  monthlyRevenueStartEur: number;
  monthlyRevenueGrowthPct: number;
  horizonMonths: number;
}

const DEFAULTS: RunwayInputs = {
  startingCashEur: 25_000,
  monthlyFixedBurnEur: 150,
  humanCostsEur: 600,
  monthlyRevenueStartMonth: 6,
  monthlyRevenueStartEur: 225,
  monthlyRevenueGrowthPct: 25,
  horizonMonths: 24,
};

interface MonthlyRow {
  month: number;
  burn: number;
  revenue: number;
  net: number;
  cumulativeCash: number;
}

function computeProjection(inputs: RunwayInputs): MonthlyRow[] {
  const rows: MonthlyRow[] = [];
  let cash = inputs.startingCashEur;
  let revenue = 0;

  for (let m = 0; m < inputs.horizonMonths; m++) {
    if (m >= inputs.monthlyRevenueStartMonth) {
      if (revenue === 0) {
        revenue = inputs.monthlyRevenueStartEur;
      } else {
        revenue = revenue * (1 + inputs.monthlyRevenueGrowthPct / 100);
      }
    }
    const burn = inputs.monthlyFixedBurnEur + inputs.humanCostsEur;
    const net = revenue - burn;
    cash += net;
    rows.push({
      month: m,
      burn,
      revenue,
      net,
      cumulativeCash: cash,
    });
  }
  return rows;
}

function findRunwayMonth(rows: MonthlyRow[]): number | null {
  const zero = rows.findIndex((r) => r.cumulativeCash <= 0);
  return zero === -1 ? null : zero;
}

function findBreakEvenMonth(rows: MonthlyRow[]): number | null {
  const be = rows.findIndex((r) => r.net >= 0);
  return be === -1 ? null : be;
}

function loadSaved(): RunwayInputs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<RunwayInputs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveInputs(inputs: RunwayInputs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    /* noop */
  }
}

function formatEur(v: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function monthToDateLabel(monthOffset: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return d.toLocaleString("fr-FR", { month: "short", year: "numeric" });
}

export default function RunwayCalculator() {
  const [inputs, setInputs] = useState<RunwayInputs>(DEFAULTS);

  useEffect(() => {
    setInputs(loadSaved());
  }, []);

  useEffect(() => {
    saveInputs(inputs);
  }, [inputs]);

  const rows = useMemo(() => computeProjection(inputs), [inputs]);
  const runwayMonth = useMemo(() => findRunwayMonth(rows), [rows]);
  const breakEvenMonth = useMemo(() => findBreakEvenMonth(rows), [rows]);

  function update<K extends keyof RunwayInputs>(key: K, value: RunwayInputs[K]): void {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleExport(): void {
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      inputs,
      runwayMonths: runwayMonth,
      breakEvenMonth,
      rows,
    };
    const json = JSON.stringify(payload, null, 2);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(json);
    }
    // Fallback : open in a new window so user can copy manually.
    if (typeof window !== "undefined") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cesoir-runway-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function handleReset(): void {
    setInputs(DEFAULTS);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6 text-[#111]">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">
          Runway calculator · CeSoir
        </h1>
        <p className="text-sm text-neutral-600">
          Modèle scénario paramétrable. Sauvegarde locale automatique.
          Source de vérité côté docs :{" "}
          <code className="rounded bg-neutral-100 px-1">docs/finance/COST_PROJECTION.md</code>.
        </p>
      </header>

      {/* Inputs */}
      <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-2">
        <NumberInput
          label="Cash de départ (€)"
          value={inputs.startingCashEur}
          onChange={(v) => update("startingCashEur", v)}
        />
        <NumberInput
          label="Burn mensuel fixed (€)"
          value={inputs.monthlyFixedBurnEur}
          onChange={(v) => update("monthlyFixedBurnEur", v)}
        />
        <NumberInput
          label="Coûts humains / DPO (€)"
          value={inputs.humanCostsEur}
          onChange={(v) => update("humanCostsEur", v)}
        />
        <NumberInput
          label="Revenu démarre au mois #"
          value={inputs.monthlyRevenueStartMonth}
          onChange={(v) => update("monthlyRevenueStartMonth", v)}
        />
        <NumberInput
          label="Revenu mensuel initial (€)"
          value={inputs.monthlyRevenueStartEur}
          onChange={(v) => update("monthlyRevenueStartEur", v)}
        />
        <NumberInput
          label="Croissance mensuelle revenu (%)"
          value={inputs.monthlyRevenueGrowthPct}
          onChange={(v) => update("monthlyRevenueGrowthPct", v)}
        />
        <NumberInput
          label="Horizon (mois)"
          value={inputs.horizonMonths}
          onChange={(v) => update("horizonMonths", v)}
        />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Runway estimé"
          value={
            runwayMonth === null
              ? "> horizon"
              : `${runwayMonth} mois (${monthToDateLabel(runwayMonth)})`
          }
          tone={runwayMonth !== null && runwayMonth < 6 ? "danger" : "ok"}
        />
        <KpiCard
          label="Break-even mensuel"
          value={
            breakEvenMonth === null
              ? "non atteint"
              : `M+${breakEvenMonth} (${monthToDateLabel(breakEvenMonth)})`
          }
          tone={breakEvenMonth !== null ? "ok" : "warn"}
        />
        <KpiCard
          label="Gate post-Seed (12 mois)"
          value={
            runwayMonth === null
              ? "confortable"
              : runwayMonth < 12
                ? "à risque — lever"
                : "ok"
          }
          tone={runwayMonth !== null && runwayMonth < 12 ? "warn" : "ok"}
        />
      </div>

      {/* Monthly table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="p-2 font-medium">Mois</th>
              <th className="p-2 font-medium">Revenus</th>
              <th className="p-2 font-medium">Burn</th>
              <th className="p-2 font-medium">Net</th>
              <th className="p-2 font-medium">Cash cumulé</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.month}
                className={
                  r.cumulativeCash <= 0
                    ? "bg-red-50 text-red-900"
                    : r.net >= 0
                      ? "bg-green-50/40"
                      : ""
                }
              >
                <td className="p-2">M+{r.month}</td>
                <td className="p-2">{formatEur(r.revenue)}</td>
                <td className="p-2">{formatEur(r.burn)}</td>
                <td className="p-2">{formatEur(r.net)}</td>
                <td className="p-2 font-semibold">
                  {formatEur(r.cumulativeCash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C3AED]"
        >
          Exporter JSON
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Réinitialiser
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-600">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30"
      />
    </label>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <div
      className={`rounded-lg border p-4 ${toneClass}`}
      aria-label={`${label} : ${value}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide opacity-75">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

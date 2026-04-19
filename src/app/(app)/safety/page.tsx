"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs, ambient } from "@/lib/motion-design";
import { haptics } from "@/lib/haptics";
import { useSafety } from "@/lib/useSafety";
import TrustedCircle from "@/components/app/TrustedCircle";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

// ------------------------------------------------------------------
// Static data
// ------------------------------------------------------------------

const safetyTips = [
  "Retrouvez-vous toujours dans un lieu public et anime",
  "Prevenez un(e) ami(e) de votre rendez-vous (lieu, heure, nom)",
  "Utilisez le bouton SOS si vous vous sentez en danger",
  "Ne partagez jamais vos informations financieres",
  "Faites confiance a votre instinct -- si ca semble bizarre, partez",
  "Signalez tout comportement suspect via l'app",
];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function formatTimeLeft(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function actionIcon(type: string): string {
  switch (type) {
    case "sos":
      return "!";
    case "checkin":
      return "\u2713"; // checkmark
    case "report":
      return "\u26A0"; // warning
    case "alert_sent":
      return "\u2757"; // exclamation
    default:
      return "\u2022";
  }
}

function actionColor(type: string): string {
  switch (type) {
    case "sos":
    case "alert_sent":
      return "var(--color-danger)";
    case "checkin":
      return "var(--color-safe)";
    case "report":
      return "var(--color-warn)";
    default:
      return "var(--color-accent)";
  }
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export default function SafetyPage() {
  const {
    triggerSOS,
    startCheckIn,
    checkIn,
    cancelCheckIn,
    isCheckInActive,
    checkInTimeLeft,
    sosActive,
    recentActions,
    trustedContacts,
  } = useSafety();

  const [showTips, setShowTips] = useState(false);
  const [sosConfirm, setSosConfirm] = useState(false);

  const handleSOSPress = () => {
    haptics.heavy();
    setSosConfirm(true);
  };

  const handleSOSConfirm = async () => {
    haptics.error();
    setSosConfirm(false);
    await triggerSOS();
  };

  const handleStartCheckIn = () => {
    haptics.medium();
    startCheckIn(30);
  };

  const handleCheckIn = () => {
    haptics.success();
    checkIn();
  };

  const handleCancelCheckIn = () => {
    haptics.light();
    cancelCheckIn();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <PageHeader
        title="Securite"
        tone="white"
        rackFocus
        hairlineVariant="green-violet"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-safe)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
        iconAnimation="glow-green"
      />

      <main className="px-5 py-6 max-w-lg mx-auto pb-32">
        {/* ── Hero ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.heavy}
        >
          <h1
            className="text-[28px] font-bold leading-tight mb-3"
            style={{
              color: "var(--color-text)",
              fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            }}
          >
            Ta securite est notre
            <br />
            <span style={{ color: "var(--color-safe)" }}>priorite absolue.</span>
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--color-text-soft)" }}>
            Tous tes outils de securite au meme endroit. SOS, check-in,
            contacts de confiance.
          </p>
        </motion.div>

        {/* ── SOS Button (big, red, prominent) ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springs.heavy, delay: 0.1 }}
        >
          <motion.button
            type="button"
            onClick={handleSOSPress}
            disabled={sosActive}
            className="w-full relative overflow-hidden rounded-2xl py-6 flex flex-col items-center gap-3 text-white font-bold shadow-lg disabled:opacity-70"
            style={{ backgroundColor: "var(--color-danger)" }}
            whileTap={{ scale: 0.97 }}
            aria-label="Declencher l'alerte SOS"
          >
            {/* Breathing pulse behind the button */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-bg) 10%, transparent)" }}
              animate={ambient.breathe(3)}
            />

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </motion.div>

            <span className="text-lg relative z-10">
              {sosActive ? "SOS en cours..." : "SOS Urgence"}
            </span>
            <span
              className="text-xs relative z-10"
              style={{ color: "color-mix(in srgb, var(--color-bg) 70%, transparent)" }}
            >
              Envoie ta position a tes contacts
            </span>
          </motion.button>
        </motion.div>

        {/* SOS confirmation dialog */}
        <AnimatePresence>
          {sosConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-6"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={springs.heavy}
                className="w-full max-w-sm rounded-2xl p-6 text-center"
                style={{ backgroundColor: "var(--color-bg)" }}
                role="alertdialog"
                aria-label="Confirmer l'alerte SOS"
              >
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-danger) 10%, transparent)" }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-danger)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  Confirmer l&apos;alerte SOS ?
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--color-text-soft)" }}>
                  Ta position sera envoyee a tous tes contacts de confiance
                  ({trustedContacts.length} contact
                  {trustedContacts.length !== 1 ? "s" : ""}).
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSosConfirm(false)}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-text) 5%, transparent)",
                      color: "var(--color-text-soft)",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSOSConfirm}
                    className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--color-danger)" }}
                  >
                    Confirmer SOS
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Check-in Status ── */}
        <motion.div
          className="mb-6 rounded-2xl p-5"
          style={{
            backgroundColor: isCheckInActive
              ? "color-mix(in srgb, var(--color-safe) 6%, transparent)"
              : "color-mix(in srgb, var(--color-accent) 4%, transparent)",
            border: `1px solid ${isCheckInActive ? "color-mix(in srgb, var(--color-safe) 15%, transparent)" : "color-mix(in srgb, var(--color-accent) 10%, transparent)"}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isCheckInActive
                    ? "color-mix(in srgb, var(--color-safe) 15%, transparent)"
                    : "color-mix(in srgb, var(--color-accent) 10%, transparent)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isCheckInActive ? "var(--color-safe)" : "var(--color-accent)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h2
                  className="text-sm font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  Check-in de securite
                </h2>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-soft)" }}
                >
                  {isCheckInActive
                    ? `Prochain dans ${formatTimeLeft(checkInTimeLeft)}`
                    : "Pas de check-in actif"}
                </p>
              </div>
            </div>

            {isCheckInActive && (
              <motion.div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--color-safe)" }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-label="Check-in actif"
              />
            )}
          </div>

          {isCheckInActive ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCheckIn}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-safe)" }}
              >
                Je vais bien
              </button>
              <button
                type="button"
                onClick={handleCancelCheckIn}
                className="rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-danger) 8%, transparent)",
                  color: "var(--color-danger)",
                }}
              >
                Arreter
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartCheckIn}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Activer le check-in (30 min)
            </button>
          )}
        </motion.div>

        {/* ── Trusted Circle ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.3 }}
        >
          <h2
            className="text-[11px] uppercase tracking-[0.2em] font-bold mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cercle de confiance
          </h2>
          <TrustedCircle />
        </motion.div>

        {/* ── Recent Safety Actions Log ── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.4 }}
        >
          <h2
            className="text-[11px] uppercase tracking-[0.2em] font-bold mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Historique de securite
          </h2>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-text) 2%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-text) 6%, transparent)",
            }}
          >
            {recentActions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Aucune action recente.
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-border)" }}>
                  Tes alertes SOS et check-ins apparaitront ici.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--color-text) 4%, transparent)" }}>
                {recentActions.slice(0, 8).map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: actionColor(action.type) }}
                      aria-hidden="true"
                    >
                      {actionIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-text)" }}
                      >
                        {action.description}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {formatTimestamp(action.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Report History Link ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.45 }}
        >
          <Link
            href="/settings"
            className="flex items-center justify-between rounded-2xl p-4"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-text) 2%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-text) 6%, transparent)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-warn) 10%, transparent)" }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-warn)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  Mes signalements
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-soft)" }}>
                  Voir l&apos;historique des profils signales
                </p>
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </motion.div>

        {/* ── Safety Tips (collapsible) ── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.5 }}
        >
          <button
            type="button"
            onClick={() => {
              haptics.light();
              setShowTips(!showTips);
            }}
            className="w-full flex items-center justify-between rounded-2xl p-4"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-safe) 4%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-safe) 10%, transparent)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-safe) 10%, transparent)" }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-safe)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Conseils de securite
              </span>
            </div>
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ rotate: showTips ? 180 : 0 }}
              transition={springs.snap}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          </button>

          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.heavy}
                className="overflow-hidden"
              >
                <div
                  className="rounded-b-2xl p-5 space-y-3 -mt-1"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-safe) 4%, transparent)",
                    borderLeft: "1px solid color-mix(in srgb, var(--color-safe) 10%, transparent)",
                    borderRight: "1px solid color-mix(in srgb, var(--color-safe) 10%, transparent)",
                    borderBottom: "1px solid color-mix(in srgb, var(--color-safe) 10%, transparent)",
                  }}
                  role="list"
                >
                  {safetyTips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3"
                      role="listitem"
                    >
                      <span
                        className="font-bold text-[13px] shrink-0 mt-0.5"
                        style={{ color: "var(--color-safe)" }}
                        aria-hidden="true"
                      >
                        {"\u2713"}
                      </span>
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{ color: "color-mix(in srgb, var(--color-text) 85%, transparent)" }}
                      >
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Emergency Numbers ── */}
        <motion.div
          className="mb-6 rounded-2xl p-5 text-center"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-text) 2%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-text) 6%, transparent)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.heavy, delay: 0.55 }}
        >
          <p
            className="text-[11px] uppercase tracking-widest font-bold mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Urgence
          </p>
          <a
            href="tel:3919"
            className="text-[24px] font-black block mb-1"
            style={{ color: "var(--color-danger)" }}
          >
            3919
          </a>
          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            Violences conjugales -- appel gratuit et anonyme
          </p>
        </motion.div>

        {/* Back link */}
        <Link
          href="/browse"
          className="block text-center text-[13px] font-semibold mb-20 tap-target py-2"
          style={{ color: "var(--color-accent)" }}
        >
          {"\u2190"} Retour a l&apos;exploration
        </Link>
      </main>
    </div>
  );
}

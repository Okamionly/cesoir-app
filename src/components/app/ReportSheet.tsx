"use client";

import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { IconX } from "@/components/ui/Icons";

const reasons = [
  { value: "fake_profile", label: "Faux profil", icon: "🎭" },
  { value: "harassment", label: "Harcelement", icon: "⚠️" },
  { value: "inappropriate_content", label: "Contenu inapproprie", icon: "🚫" },
  { value: "spam", label: "Spam", icon: "📢" },
  { value: "underage", label: "Mineur(e)", icon: "🔞" },
  { value: "scam", label: "Arnaque", icon: "💰" },
  { value: "other", label: "Autre", icon: "❓" },
];

interface ReportSheetProps {
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
  onReport: (reason: string, details: string) => Promise<void>;
}

export default function ReportSheet({ profileName, isOpen, onClose, onReport }: ReportSheetProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSending(true);
    await onReport(reason, details);
    setSending(false);
    setSent(true);
    setTimeout(onClose, 1500);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <m.div
            className="w-full max-w-lg bg-bg border-t border-border rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold">Signaler {profileName}</h2>
              <button onClick={onClose} className="tap-target p-1" aria-label="Fermer">
                <IconX size={20} className="text-text-muted" />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-[15px] font-bold mb-1">Signalement envoye</p>
                <p className="text-[13px] text-text-muted">Notre equipe va examiner ce profil.</p>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-text-muted mb-4">Pourquoi signales-tu ce profil ?</p>

                <div className="space-y-2 mb-4">
                  {reasons.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      aria-pressed={reason === r.value}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all tap-target ${
                        reason === r.value ? "border-accent bg-accent/5" : "border-border"
                      }`}
                    >
                      <span aria-hidden="true">{r.icon}</span>
                      <span className={`text-[13px] font-medium ${reason === r.value ? "text-accent" : "text-text"}`}>{r.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label htmlFor="report-details" className="block text-[11px] font-semibold text-text-muted mb-1">Details (optionnel)</label>
                  <textarea
                    id="report-details"
                    rows={3}
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Decris le probleme..."
                    className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!reason || sending}
                  className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm active:scale-[0.98] transition-transform disabled:opacity-40 tap-target"
                >
                  {sending ? "Envoi..." : "Envoyer le signalement"}
                </button>

                <p className="text-[10px] text-text-muted text-center mt-3">
                  Ce profil sera aussi bloque automatiquement.
                </p>
              </>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

"use client";

/**
 * BioAssistantModal — Wave 17, AI bio assistant with 5-question wizard.
 *
 * UX flow:
 *   1. Modal opens (driven by `open` prop). The user sees the first of 5
 *      short questions (cuisine, samedi ideal, ...). Each input is capped
 *      at 100 characters with a live counter.
 *   2. Tapping "Suivant" advances to the next question. Tapping "Retour"
 *      goes back. After question 5, the "Generer" button calls
 *      POST /api/profile/bio-assistant with all 5 Q&A pairs.
 *   3. The endpoint returns a draft bio. We render it in an editable
 *      textarea. The user can:
 *        - "Accepter" — save the bio to profiles.bio + close the modal.
 *        - "Regenerer" — re-call the API with the same answers.
 *        - "Modifier" — focus the textarea (already editable, but the
 *          button is here to make the affordance obvious).
 *
 * Persistence: a single Supabase update on profiles.bio when the user
 * accepts. The parent /profile page is informed via `onBioSaved` so it
 * can reflect the new bio in its hero section without a full reload.
 *
 * A11y:
 *   * `<dialog>`-like role + aria-modal + Escape-to-close.
 *   * Focus moves into the modal on open and to the next field on advance.
 *   * Inputs all have associated <label>s.
 *   * Tap targets >= 44px.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { ChevronLeft, X, RotateCw, Check, Pencil } from "@/components/ui/lucide";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// ── Constants ────────────────────────────────────────────────────────────────

/** Hard cap per answer. Defence-in-depth — server enforces too. */
const ANSWER_MAX_LENGTH = 100;

/** Final bio is editable up to this length so users don't blow past the column. */
const BIO_MAX_LENGTH = 1200;

/** Ordered list of the 5 wizard questions (must match the spec). */
const QUESTIONS: Array<{ id: string; question: string; placeholder: string }> = [
  {
    id: "cuisine",
    question: "Quelle cuisine adores-tu en ce moment ?",
    placeholder: "Ramen, italienne, marocaine...",
  },
  {
    id: "samedi",
    question: "Ton samedi ideal ?",
    placeholder: "Brunch, marche, ciné, soirée...",
  },
  {
    id: "vibration",
    question: "Le dernier truc qui t'a fait rire / pleurer / vibrer ?",
    placeholder: "Un film, un livre, une rencontre...",
  },
  {
    id: "teleport",
    question:
      "Si tu pouvais teleporter quelqu'un avec toi maintenant, ou l'emmenerais-tu ?",
    placeholder: "Un cafe a Lisbonne, le bord de mer...",
  },
  {
    id: "fact",
    question: "Un fait random sur toi qu'on apprend en deuxieme date ?",
    placeholder: "Tu collectionnes les vinyles, tu fais du parapente...",
  },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface BioAssistantModalProps {
  /** Drives mount + initial state hydration. */
  open: boolean;
  /** Called when the user dismisses the modal (X, Escape, backdrop, or save). */
  onClose: () => void;
  /** Notifies the parent of a freshly saved bio so it can reflect it locally. */
  onBioSaved: (bio: string) => void;
  /** Authenticated user id — used for the supabase update. */
  userId: string | null | undefined;
}

interface ApiResponse {
  ok?: boolean;
  data?: {
    bio: string;
    fallbackUsed: boolean;
  };
  error?: string;
  code?: string;
}

type Phase = "wizard" | "loading" | "review" | "saving";

// ── Component ────────────────────────────────────────────────────────────────

export default function BioAssistantModal({
  open,
  onClose,
  onBioSaved,
  userId,
}: BioAssistantModalProps) {
  // Wizard state — answers parallel to QUESTIONS order.
  const [answers, setAnswers] = useState<string[]>(() =>
    QUESTIONS.map(() => ""),
  );
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("wizard");
  const [draftBio, setDraftBio] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /** Currently focused textarea — used to focus the bio editor on review. */
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bioRef = useRef<HTMLTextAreaElement | null>(null);

  // Re-hydrate whenever the modal (re)opens — closing without saving discards.
  useEffect(() => {
    if (open) {
      setAnswers(QUESTIONS.map(() => ""));
      setStep(0);
      setPhase("wizard");
      setDraftBio("");
      setErrorMsg(null);
    }
  }, [open]);

  // Escape-to-close — only trap when actually open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open (mobile is the dominant target).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Autofocus the active wizard input when the step changes.
  useEffect(() => {
    if (!open) return;
    if (phase !== "wizard") return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, phase, step]);

  // Autofocus the bio textarea when entering review.
  useEffect(() => {
    if (phase !== "review") return;
    const t = setTimeout(() => bioRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [phase]);

  // ── API call ────────────────────────────────────────────────────────────

  const callBioAssistant = useCallback(async () => {
    setPhase("loading");
    setErrorMsg(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const payloadBody = {
      answers: QUESTIONS.map((q, i) => ({
        question: q.question,
        answer: answers[i] ?? "",
      })),
    };

    try {
      const res = await fetch("/api/profile/bio-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payloadBody),
      });
      const payload = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!res.ok || !payload?.data?.bio) {
        logger.warn("bio_assistant_client_api_rejected", {
          status: res.status,
          code: payload?.code,
        });
        setErrorMsg(
          payload?.error ?? "Impossible de generer la bio. Reessaie ?",
        );
        setPhase("wizard");
        return;
      }
      setDraftBio(payload.data.bio);
      setPhase("review");
    } catch (err) {
      logger.warn("bio_assistant_client_fetch_failed", { err: String(err) });
      setErrorMsg("Connexion impossible. Verifie ton reseau et reessaie.");
      setPhase("wizard");
    }
  }, [answers]);

  // ── Save ────────────────────────────────────────────────────────────────

  const saveBio = useCallback(async () => {
    if (!userId) {
      setErrorMsg("Session introuvable — reconnecte-toi.");
      return;
    }
    const cleaned = draftBio.trim().slice(0, BIO_MAX_LENGTH);
    if (cleaned.length === 0) {
      setErrorMsg("La bio ne peut pas etre vide.");
      return;
    }
    setPhase("saving");
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: cleaned })
        .eq("id", userId);
      if (error) throw error;
      onBioSaved(cleaned);
      onClose();
    } catch (err) {
      logger.warn("bio_assistant_save_failed", { err: String(err) });
      setErrorMsg("Erreur lors de la sauvegarde. Reessaie ?");
      setPhase("review");
    }
  }, [draftBio, userId, onBioSaved, onClose]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const updateAnswer = useCallback((value: string) => {
    setAnswers((cur) => {
      const copy = cur.slice();
      copy[step] = value.slice(0, ANSWER_MAX_LENGTH);
      return copy;
    });
  }, [step]);

  const goNext = useCallback(() => {
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    void callBioAssistant();
  }, [step, callBioAssistant]);

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!open) return null;

  const currentQuestion = QUESTIONS[step];
  const currentAnswer = answers[step] ?? "";
  const canAdvance = currentAnswer.trim().length > 0;
  const isLastStep = step === QUESTIONS.length - 1;
  const allAnswered = answers.every((a) => a.trim().length > 0);

  return (
    <AnimatePresence>
      <m.div
        key="bio-assistant-modal"
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Assistant de bio"
      >
        <m.div
          className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[80vh] flex flex-col bg-bg sm:rounded-3xl rounded-t-3xl border-t border-border sm:border shadow-2xl overflow-hidden"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              {phase === "wizard" && step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  aria-label="Retour"
                >
                  <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight text-text truncate">
                  Aide-moi a ecrire ma bio
                </p>
                {phase === "wizard" && (
                  <p className="text-[11px] text-text-muted">
                    Etape {step + 1} / {QUESTIONS.length}
                  </p>
                )}
                {phase === "review" && (
                  <p className="text-[11px] text-text-muted">
                    Ta bio generee — modifie ou accepte
                  </p>
                )}
                {phase === "loading" && (
                  <p className="text-[11px] text-text-muted">Generation en cours…</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-bg-card transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {phase === "wizard" && currentQuestion && (
              <div className="flex flex-col gap-3">
                <label
                  htmlFor={`bio-q-${currentQuestion.id}`}
                  className="text-[14px] font-semibold tracking-tight text-text leading-snug"
                >
                  {currentQuestion.question}
                </label>
                <textarea
                  id={`bio-q-${currentQuestion.id}`}
                  ref={inputRef}
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  maxLength={ANSWER_MAX_LENGTH}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-bg-card border border-border text-[14px] text-text placeholder:text-text-muted/70 resize-none focus:border-accent/60 focus:outline-none transition-colors"
                  aria-describedby={`bio-q-${currentQuestion.id}-counter`}
                />
                <div
                  id={`bio-q-${currentQuestion.id}-counter`}
                  className="text-[11px] text-text-muted text-right tabular-nums"
                  aria-live="polite"
                >
                  {currentAnswer.length} / {ANSWER_MAX_LENGTH}
                </div>
                {errorMsg && (
                  <p className="text-[12px] text-red-500" role="alert">
                    {errorMsg}
                  </p>
                )}
              </div>
            )}

            {phase === "loading" && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div
                  className="w-10 h-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
                  aria-hidden="true"
                />
                <p className="text-[13px] text-text-muted text-center">
                  L'assistant ecrit ta bio…
                </p>
              </div>
            )}

            {phase === "review" && (
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="bio-draft"
                  className="text-[14px] font-semibold tracking-tight text-text leading-snug"
                >
                  Ta bio (modifiable)
                </label>
                <textarea
                  id="bio-draft"
                  ref={bioRef}
                  value={draftBio}
                  onChange={(e) =>
                    setDraftBio(e.target.value.slice(0, BIO_MAX_LENGTH))
                  }
                  rows={8}
                  maxLength={BIO_MAX_LENGTH}
                  className="w-full px-4 py-3 rounded-2xl bg-bg-card border border-border text-[14px] text-text leading-relaxed resize-none focus:border-accent/60 focus:outline-none transition-colors"
                />
                <div
                  className="text-[11px] text-text-muted text-right tabular-nums"
                  aria-live="polite"
                >
                  {draftBio.length} / {BIO_MAX_LENGTH}
                </div>
                {errorMsg && (
                  <p className="text-[12px] text-red-500" role="alert">
                    {errorMsg}
                  </p>
                )}
              </div>
            )}

            {phase === "saving" && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div
                  className="w-10 h-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
                  aria-hidden="true"
                />
                <p className="text-[13px] text-text-muted text-center">
                  Sauvegarde en cours…
                </p>
              </div>
            )}
          </div>

          {/* ── Footer actions ───────────────────────────────────────── */}
          <div className="px-5 py-4 border-t border-border flex flex-wrap items-center justify-end gap-2">
            {phase === "wizard" && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-text text-bg text-[13px] font-semibold tracking-tight hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
              >
                {isLastStep ? "Generer ma bio" : "Suivant"}
              </button>
            )}

            {phase === "review" && (
              <>
                <button
                  type="button"
                  onClick={() => bioRef.current?.focus()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-text-muted hover:text-text hover:border-text/30 text-[13px] font-medium transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <Pencil size={14} strokeWidth={1.6} aria-hidden="true" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (allAnswered) void callBioAssistant();
                  }}
                  disabled={!allAnswered}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-border text-text-muted hover:text-text hover:border-text/30 text-[13px] font-medium transition-colors tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCw size={14} strokeWidth={1.6} aria-hidden="true" />
                  Regenerer
                </button>
                <button
                  type="button"
                  onClick={saveBio}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-text text-bg text-[13px] font-semibold tracking-tight hover:opacity-90 transition-all tap-target focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
                >
                  <Check size={14} strokeWidth={1.8} aria-hidden="true" />
                  Accepter
                </button>
              </>
            )}
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}

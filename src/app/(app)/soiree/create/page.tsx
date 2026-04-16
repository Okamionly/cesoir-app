"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

type SoireeType = "diner" | "bar" | "jeux" | "pique-nique" | "cinema" | "degustation" | "karaoke" | "mystere";

const SOIREE_TYPES: { id: SoireeType; emoji: string; name: string; suggestion: string }[] = [
  { id: "diner", emoji: "🍽️", name: "Diner chez moi", suggestion: "Diner intime ce soir" },
  { id: "bar", emoji: "🍸", name: "Sortie bar", suggestion: "Tournee des bars" },
  { id: "jeux", emoji: "🎮", name: "Soiree jeux", suggestion: "Game night" },
  { id: "pique-nique", emoji: "🧺", name: "Pique-nique", suggestion: "Pique-nique au parc" },
  { id: "cinema", emoji: "🎬", name: "Soiree cinema", suggestion: "Movie night" },
  { id: "degustation", emoji: "🍷", name: "Degustation", suggestion: "Degustation de vins" },
  { id: "karaoke", emoji: "🎤", name: "Karaoke", suggestion: "Soiree karaoke" },
  { id: "mystere", emoji: "🎭", name: "Soiree mystere", suggestion: "Surprise..." },
];

const ARRONDISSEMENTS = ["1er", "2e", "3e", "4e", "5e", "6e", "7e", "8e", "9e", "10e", "11e", "12e", "13e", "14e", "15e", "16e", "17e", "18e", "19e", "20e"];
const TIME_SLOTS = ["18h", "19h", "20h", "21h", "22h", "23h", "00h", "01h"];
const BUDGETS = ["Gratuit", "<10€", "10-20€", "20-50€", "50€+"];
const DRESS_CODES = ["Casual", "Smart casual", "Chic", "Costume"];
const AMBIANCES = ["Chill", "Energique", "Romantique", "Festive", "Intime", "Decouverte"];
const BRING_OPTIONS = ["A boire", "A manger", "Rien"];

export default function CreateSoireePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form state
  const [type, setType] = useState<SoireeType | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<"ce-soir" | "demain" | "autre">("ce-soir");
  const [time, setTime] = useState("20h");
  const [venue, setVenue] = useState("");
  const [arrondissement, setArrondissement] = useState("11e");
  const [isAtHome, setIsAtHome] = useState(false);
  const [maxPlaces, setMaxPlaces] = useState(6);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("Gratuit");
  const [dressCode, setDressCode] = useState("Casual");
  const [ambiance, setAmbiance] = useState("Chill");
  const [bringWhat, setBringWhat] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const selectedType = SOIREE_TYPES.find((t) => t.id === type);

  function selectType(t: SoireeType) {
    setType(t);
    const suggestion = SOIREE_TYPES.find((s) => s.id === t)?.suggestion ?? "";
    if (!title) setTitle(suggestion);
    setStep(2);
  }

  function toggleBring(option: string) {
    setBringWhat((prev) => prev.includes(option) ? prev.filter((b) => b !== option) : [...prev, option]);
  }

  async function publish() {
    setPublishing(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    router.push("/soiree");
  }

  const canContinue = () => {
    if (step === 1) return !!type;
    if (step === 2) return !!title && !!time && (!!venue || isAtHome);
    if (step === 3) return true;
    return true;
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => step === 1 ? router.back() : setStep((s) => s - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text"
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[15px] font-semibold text-text">Creer une soiree</h1>
          <div className="text-[12px] text-text-muted font-medium">{step}/4</div>
        </div>
        {/* Progress */}
        <div className="h-0.5 bg-border">
          <motion.div
            className="h-full gradient-bg"
            initial={{ width: "25%" }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={springs.heavy}
          />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* STEP 1: Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5 pt-6"
          >
            <h2 className="text-[24px] font-bold text-text mb-2">Quel type de soiree ?</h2>
            <p className="text-[14px] text-text-muted mb-6">Choisis l&apos;ambiance que tu veux creer</p>

            <div className="grid grid-cols-2 gap-3">
              {SOIREE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectType(t.id)}
                  className={`p-5 rounded-2xl border-2 transition-all text-left ${
                    type === t.id ? "border-accent bg-accent/5" : "border-border bg-bg-card hover:border-accent/30"
                  }`}
                >
                  <div className="text-[36px] mb-2">{t.emoji}</div>
                  <div className="text-[14px] font-semibold text-text">{t.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5 pt-6 space-y-6"
          >
            <div>
              <h2 className="text-[24px] font-bold text-text mb-2">Les details</h2>
              <p className="text-[14px] text-text-muted">Donne envie aux autres</p>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="Ex: Diner italien chez moi"
                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-[15px] text-text outline-none focus:border-accent transition-colors"
              />
              <div className="text-[11px] text-text-muted mt-1">{title.length}/60</div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Quand</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(["ce-soir", "demain", "autre"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`py-2.5 rounded-lg text-[13px] font-medium border ${
                      date === d ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                    }`}
                  >
                    {d === "ce-soir" ? "Ce soir" : d === "demain" ? "Demain" : "Autre"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium border ${
                      time === t ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Lieu</label>
              <button
                onClick={() => setIsAtHome(!isAtHome)}
                className={`w-full py-2.5 mb-2 rounded-lg text-[13px] font-medium border ${
                  isAtHome ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                }`}
              >
                Chez moi
              </button>
              {!isAtHome && (
                <>
                  <input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ex: Bar Le Perchoir"
                    className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-[15px] text-text outline-none focus:border-accent transition-colors mb-2"
                  />
                  <select
                    value={arrondissement}
                    onChange={(e) => setArrondissement(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-[15px] text-text outline-none focus:border-accent"
                  >
                    {ARRONDISSEMENTS.map((a) => (
                      <option key={a} value={a}>Paris {a}</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">
                Places disponibles : {maxPlaces}
              </label>
              <input
                type="range"
                min={2}
                max={20}
                value={maxPlaces}
                onChange={(e) => setMaxPlaces(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>2</span><span>10</span><span>20</span>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Budget par personne</label>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      budget === b ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Description (optionnel)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Decris l&apos;ambiance..."
                className="w-full px-4 py-3 bg-bg-card border border-border rounded-xl text-[14px] text-text outline-none focus:border-accent resize-none"
              />
              <div className="text-[11px] text-text-muted mt-1">{description.length}/300</div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Ambiance */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5 pt-6 space-y-6"
          >
            <div>
              <h2 className="text-[24px] font-bold text-text mb-2">L&apos;ambiance</h2>
              <p className="text-[14px] text-text-muted">Pour que tout le monde sache a quoi s&apos;attendre</p>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Dress code</label>
              <div className="grid grid-cols-2 gap-2">
                {DRESS_CODES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDressCode(d)}
                    className={`py-2.5 rounded-lg text-[13px] font-medium border ${
                      dressCode === d ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">Ambiance musicale</label>
              <div className="flex flex-wrap gap-2">
                {AMBIANCES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmbiance(a)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      ambiance === a ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2 block">A ramener</label>
              <div className="flex flex-wrap gap-2">
                {BRING_OPTIONS.map((b) => (
                  <button
                    key={b}
                    onClick={() => toggleBring(b)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${
                      bringWhat.includes(b) ? "bg-accent text-white border-accent" : "bg-bg-card text-text border-border"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-card border border-border rounded-xl">
              <div>
                <div className="text-[14px] font-semibold text-text">Soiree privee</div>
                <div className="text-[11px] text-text-muted">Sur invitation seulement</div>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-11 h-6 rounded-full relative transition-colors ${isPrivate ? "bg-accent" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Preview */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-5 pt-6"
          >
            <h2 className="text-[24px] font-bold text-text mb-2">Preview</h2>
            <p className="text-[14px] text-text-muted mb-6">Tout est bon ?</p>

            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-32 gradient-bg flex items-center justify-center">
                <span className="text-[64px]">{selectedType?.emoji}</span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="text-[20px] font-bold text-text">{title || "Sans titre"}</h3>
                <p className="text-[13px] text-text-muted">{selectedType?.name}</p>

                <div className="flex items-center gap-2 text-[13px] text-text">
                  <span>📅</span>
                  <span>{date === "ce-soir" ? "Ce soir" : date === "demain" ? "Demain" : "Autre"} a {time}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text">
                  <span>📍</span>
                  <span>{isAtHome ? "Chez le createur" : `${venue}, Paris ${arrondissement}`}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text">
                  <span>👥</span>
                  <span>{maxPlaces} places</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-text">
                  <span>💰</span>
                  <span>{budget}</span>
                </div>

                {description && (
                  <p className="text-[13px] text-text-muted leading-relaxed border-t border-border pt-3">{description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">{dressCode}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent">{ambiance}</span>
                  {isPrivate && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600">Privee</span>}
                  {bringWhat.map((b) => (
                    <span key={b} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg text-text-muted border border-border">+ {b}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg/95 backdrop-blur-xl border-t border-border">
        <button
          onClick={() => step === 4 ? publish() : setStep((s) => s + 1)}
          disabled={!canContinue() || publishing}
          className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {publishing ? "Publication..." : step === 4 ? "Publier ma soiree" : "Continuer"}
        </button>
      </div>
    </div>
  );
}

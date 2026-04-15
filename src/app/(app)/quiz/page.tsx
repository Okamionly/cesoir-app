"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { quizVariants, springs } from "@/lib/motion-design";
import Link from "next/link";

interface QuizQuestion {
  question: string;
  options: { label: string; icon: string; value: string }[];
}

const QUESTIONS: QuizQuestion[] = [
  { question: "Vendredi soir ideal ?", options: [
    { label: "Restaurant", icon: "\uD83C\uDF7D", value: "restaurant" },
    { label: "Cinema", icon: "\uD83C\uDFAC", value: "cinema" },
    { label: "Maison", icon: "\uD83C\uDFE0", value: "home" },
    { label: "Club", icon: "\uD83C\uDF89", value: "club" },
  ]},
  { question: "En groupe ou tete-a-tete ?", options: [
    { label: "Solo", icon: "\uD83E\uDDD1", value: "solo" },
    { label: "Duo", icon: "\uD83D\uDC6B", value: "duo" },
    { label: "Petit groupe", icon: "\uD83D\uDC65", value: "small" },
    { label: "Grande fete", icon: "\uD83C\uDF8A", value: "party" },
  ]},
  { question: "Conversation ideale ?", options: [
    { label: "Deep talk", icon: "\uD83E\uDDE0", value: "deep" },
    { label: "Humour", icon: "\uD83D\uDE02", value: "humor" },
    { label: "Debat", icon: "\uD83D\uDDE3", value: "debate" },
    { label: "Ecouter", icon: "\uD83D\uDC42", value: "listen" },
  ]},
  { question: "Sport ou canape ?", options: [
    { label: "Sport", icon: "\u26BD", value: "sport" },
    { label: "Yoga", icon: "\uD83E\uDDD8", value: "yoga" },
    { label: "Marche", icon: "\uD83D\uDEB6", value: "walk" },
    { label: "Netflix", icon: "\uD83D\uDCFA", value: "netflix" },
  ]},
  { question: "Cuisine preferee ?", options: [
    { label: "Francaise", icon: "\uD83E\uDD50", value: "french" },
    { label: "Japonaise", icon: "\uD83C\uDF63", value: "japanese" },
    { label: "Italienne", icon: "\uD83C\uDF55", value: "italian" },
    { label: "Street food", icon: "\uD83C\uDF2E", value: "street" },
  ]},
  { question: "Musique ?", options: [
    { label: "Pop", icon: "\uD83C\uDFA4", value: "pop" },
    { label: "Rock", icon: "\uD83C\uDFB8", value: "rock" },
    { label: "Electro", icon: "\uD83C\uDFA7", value: "electro" },
    { label: "Jazz-Soul", icon: "\uD83C\uDFB7", value: "jazz" },
  ]},
  { question: "Tes amis disent de toi ?", options: [
    { label: "Drole", icon: "\uD83E\uDD23", value: "funny" },
    { label: "Reflechi", icon: "\uD83E\uDD14", value: "thoughtful" },
    { label: "Aventurier", icon: "\uD83E\uDDD7", value: "adventurous" },
    { label: "Calme", icon: "\uD83D\uDE0C", value: "calm" },
  ]},
  { question: "Weekend ideal ?", options: [
    { label: "Voyage", icon: "\u2708\uFE0F", value: "travel" },
    { label: "Brunch", icon: "\uD83E\uDD5E", value: "brunch" },
    { label: "Nature", icon: "\uD83C\uDF3F", value: "nature" },
    { label: "Gaming", icon: "\uD83C\uDFAE", value: "gaming" },
  ]},
  { question: "Boisson du soir ?", options: [
    { label: "Cocktail", icon: "\uD83C\uDF78", value: "cocktail" },
    { label: "Vin", icon: "\uD83C\uDF77", value: "wine" },
    { label: "Biere", icon: "\uD83C\uDF7A", value: "beer" },
    { label: "Sans alcool", icon: "\uD83C\uDF75", value: "sober" },
  ]},
  { question: "Ce soir, tu veux...", options: [
    { label: "Diner", icon: "\uD83C\uDF7D", value: "dine" },
    { label: "Sortir", icon: "\uD83C\uDF03", value: "go-out" },
    { label: "Parler", icon: "\uD83D\uDCAC", value: "talk" },
    { label: "Improviser", icon: "\uD83C\uDFB2", value: "improv" },
  ]},
];

interface PersonalityResult {
  type: string;
  title: string;
  description: string;
  color: string;
  modes: string[];
}

const RESULTS: PersonalityResult[] = [
  { type: "explorer", title: "L'Explorateur", description: "Aventurier dans l'ame, tu cherches toujours de nouvelles experiences. Ta curiosite est contagieuse.", color: "#06B6D4", modes: ["Tourist Tonight", "Night Owl", "Fit Date"] },
  { type: "gourmet", title: "Le Gourmet", description: "La vie est un festin et tu sais en profiter. Culture, gastronomie, et belles conversations.", color: "#F97316", modes: ["Solo Diner", "Foodie Quest", "Culture Club"] },
  { type: "noctambule", title: "Le Noctambule", description: "La nuit est ton terrain de jeu. Tu brilles quand les etoiles apparaissent.", color: "#8B5CF6", modes: ["Night Owl", "Gamer Night", "Plus-One"] },
  { type: "authentique", title: "L'Authentique", description: "Tu privilegies la profondeur et les connexions vraies. Pas de superficiel.", color: "#22C55E", modes: ["Breakup Recovery", "Sober Tonight", "Langue Exchange"] },
];

function getResult(answers: string[]): PersonalityResult {
  const scores = { explorer: 0, gourmet: 0, noctambule: 0, authentique: 0 };
  const mapping: Record<string, keyof typeof scores> = {
    club: "noctambule", restaurant: "gourmet", cinema: "gourmet", home: "authentique",
    party: "noctambule", duo: "authentique", small: "explorer", solo: "authentique",
    deep: "authentique", humor: "noctambule", debate: "explorer", listen: "authentique",
    sport: "explorer", yoga: "authentique", walk: "explorer", netflix: "noctambule",
    french: "gourmet", japanese: "gourmet", italian: "gourmet", street: "explorer",
    pop: "noctambule", rock: "explorer", electro: "noctambule", jazz: "gourmet",
    funny: "noctambule", thoughtful: "authentique", adventurous: "explorer", calm: "authentique",
    travel: "explorer", brunch: "gourmet", nature: "authentique", gaming: "noctambule",
    cocktail: "noctambule", wine: "gourmet", beer: "explorer", sober: "authentique",
    dine: "gourmet", "go-out": "noctambule", talk: "authentique", improv: "explorer",
  };
  answers.forEach((a) => { if (mapping[a]) scores[mapping[a]]++; });
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return RESULTS.find((r) => r.type === top) ?? RESULTS[0];
}

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<PersonalityResult | null>(null);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const r = getResult(newAnswers);
      setResult(r);
      try { localStorage.setItem("cesoir_personality", JSON.stringify(r)); } catch {}
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto pb-safe">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springs.elastic}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: `${result.color}20`, border: `2px solid ${result.color}40` }}>
            <span className="text-5xl">{result.type === "explorer" ? "\u2708\uFE0F" : result.type === "gourmet" ? "\uD83C\uDF7D" : result.type === "noctambule" ? "\uD83C\uDF19" : "\u2764\uFE0F"}</span>
          </div>
          <p className="text-[13px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: result.color }}>Ton profil</p>
          <h1 className="text-[32px] font-black text-text mb-3">{result.title}</h1>
          <p className="text-[15px] text-text-muted leading-relaxed mb-6">{result.description}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {result.modes.map((m) => (
              <span key={m} className="px-3 py-1.5 rounded-full text-[12px] font-semibold border" style={{ borderColor: `${result.color}40`, color: result.color, background: `${result.color}10` }}>{m}</span>
            ))}
          </div>
          <Link href="/browse" className="inline-block px-8 py-3.5 rounded-full text-[15px] font-semibold text-white gradient-bg shadow-glow">
            Voir profils compatibles
          </Link>
          <button onClick={() => { setStep(0); setAnswers([]); setResult(null); }} className="block mx-auto mt-4 text-[13px] text-text-muted hover:text-text py-2">
            Refaire le quiz
          </button>
        </motion.div>
      </div>
    );
  }

  const q = QUESTIONS[step];

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto pb-safe">
      {/* Progress */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-text-muted font-medium">{step + 1}/{QUESTIONS.length}</span>
          <button onClick={() => { try { localStorage.setItem("cesoir_personality", "skipped"); } catch {} window.location.href = "/browse"; }} className="text-[12px] text-text-muted hover:text-text">Passer</button>
        </div>
        <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div className="h-full rounded-full gradient-bg" animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={quizVariants.question}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
            style={{ perspective: 800 }}
          >
            <h2 className="text-[28px] font-black text-text text-center mb-8">{q.question}</h2>
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial="hidden"
              animate="visible"
            >
              {q.options.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  variants={quizVariants.option}
                  custom={i}
                  whileTap={{ scale: 0.95, transition: springs.micro }}
                  onClick={() => handleAnswer(opt.value)}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-border bg-bg-card hover:border-accent/40 hover:bg-accent/5 transition-all"
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-[14px] font-semibold text-text">{opt.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

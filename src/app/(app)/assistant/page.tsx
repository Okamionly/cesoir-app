"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";

type Step = "mood" | "social" | "budget" | "zone" | "suggestions" | "done";

const MOODS = [
  { id: "aventureux", emoji: "🚀", label: "Aventureux" },
  { id: "social", emoji: "🥂", label: "Social" },
  { id: "romantique", emoji: "💕", label: "Romantique" },
  { id: "chill", emoji: "😌", label: "Chill" },
  { id: "festif", emoji: "🎉", label: "Festif" },
  { id: "curieux", emoji: "🔍", label: "Curieux" },
];

const SOCIAL = [
  { id: "solo", emoji: "👤", label: "Solo" },
  { id: "duo", emoji: "👥", label: "Duo" },
  { id: "groupe", emoji: "👨‍👩‍👧", label: "Groupe" },
];

const BUDGETS = [
  { id: "gratuit", label: "Gratuit" },
  { id: "petit", label: "Petit budget" },
  { id: "plaisir", label: "On se fait plaisir" },
];

const ZONES = ["Marais", "Oberkampf", "Bastille", "Montmartre", "Canal St-Martin", "Saint-Germain", "Belleville", "Peu importe"];

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  type?: "text" | "options" | "suggestions";
  options?: { id: string; label: string; emoji?: string }[];
  suggestions?: Suggestion[];
}

interface Suggestion {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  match?: string;
  href: string;
}

function generateSuggestions(answers: Record<string, string>): Suggestion[] {
  const list: Suggestion[] = [];
  if (answers.social === "duo" || answers.social === "solo") {
    list.push({
      id: "s1",
      emoji: "💜",
      title: "Marie, 26",
      subtitle: `Mode ${answers.mood} · 92% compatible · 0.8 km`,
      match: "92%",
      href: "/p/marie",
    });
  }
  list.push({
    id: "s2",
    emoji: "🍽️",
    title: answers.budget === "gratuit" ? "Pique-nique au Canal" : "Diner italien",
    subtitle: `${answers.zone === "Peu importe" ? "Marais" : answers.zone} · 20h · ${answers.budget === "gratuit" ? "Gratuit" : "15-25€"}`,
    href: "/soiree",
  });
  list.push({
    id: "s3",
    emoji: "🎮",
    title: "Soiree jeux",
    subtitle: `${answers.zone === "Peu importe" ? "11e" : answers.zone} · 6 personnes · ${answers.budget === "plaisir" ? "30€" : "Gratuit"}`,
    href: "/soiree",
  });
  return list;
}

export default function AssistantPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mood");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "ai",
      content: "Salut ! Je suis ton assistant CeSoir 🌙 Comment tu te sens ce soir ?",
      type: "options",
      options: MOODS,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function addAiMessage(content: string, opts?: Partial<Message>) {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        role: "ai",
        content,
        type: "text",
        ...opts,
      }]);
      setTyping(false);
    }, 800);
  }

  function selectOption(value: string, label: string) {
    const newAnswers = { ...answers };

    if (step === "mood") {
      newAnswers.mood = value;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: label }]);
      setStep("social");
      addAiMessage("Tu veux sortir seul ou avec du monde ?", { type: "options", options: SOCIAL });
    } else if (step === "social") {
      newAnswers.social = value;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: label }]);
      setStep("budget");
      addAiMessage("Quel budget ?", { type: "options", options: BUDGETS });
    } else if (step === "budget") {
      newAnswers.budget = value;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: label }]);
      setStep("zone");
      addAiMessage("Quel quartier ?", { type: "options", options: ZONES.map((z) => ({ id: z.toLowerCase(), label: z })) });
    } else if (step === "zone") {
      newAnswers.zone = label;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: label }]);
      setStep("suggestions");
      const suggestions = generateSuggestions(newAnswers);
      setTyping(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: `sug-${Date.now()}`,
          role: "ai",
          content: "Voici 3 suggestions parfaites pour toi ce soir :",
          type: "suggestions",
          suggestions,
        }]);
        setTyping(false);
        setStep("done");
      }, 1200);
    }

    setAnswers(newAnswers);
  }

  function restart() {
    setStep("mood");
    setAnswers({});
    setMessages([{
      id: "init",
      role: "ai",
      content: "Recommencons ! Comment tu te sens ce soir ?",
      type: "options",
      options: MOODS,
    }]);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted"
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-text">Assistant CeSoir</h1>
            <p className="text-[10px] text-accent-2">En ligne</p>
          </div>
          <button
            onClick={restart}
            className="text-[12px] text-text-muted px-3 py-1.5"
          >
            Recommencer
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {msg.role === "ai" ? (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white shrink-0">
                  ☾
                </div>
                <div className="flex-1">
                  <div className="bg-bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-[85%]">
                    <p className="text-[14px] text-text">{msg.content}</p>
                  </div>

                  {/* Options */}
                  {msg.type === "options" && msg.options && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => selectOption(opt.id, opt.label)}
                          className="px-3.5 py-2 rounded-full text-[13px] font-medium bg-bg-card border border-border text-text hover:border-accent hover:text-accent transition-colors"
                        >
                          {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {msg.type === "suggestions" && msg.suggestions && (
                    <div className="space-y-2 mt-3">
                      {msg.suggestions.map((s) => (
                        <Link
                          key={s.id}
                          href={s.href}
                          className="block p-3 bg-bg-card border border-border rounded-xl hover:border-accent transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-[24px] shrink-0">
                              {s.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[14px] font-semibold text-text truncate">{s.title}</p>
                                {s.match && <span className="text-[11px] text-accent font-bold">{s.match}</span>}
                              </div>
                              <p className="text-[11px] text-text-muted truncate">{s.subtitle}</p>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="gradient-bg text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                  <p className="text-[14px]">{msg.content}</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing */}
        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2"
          >
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white shrink-0">
              ☾
            </div>
            <div className="bg-bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-text-muted"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      <AnimatePresence>
        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-20 left-0 right-0 px-4"
          >
            <button
              onClick={restart}
              className="w-full py-3 rounded-xl bg-bg-card border border-border text-text font-semibold text-[14px]"
            >
              Nouvelle recherche
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

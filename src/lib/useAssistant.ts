"use client";

// ========================================
// useAssistant — AI Matchmaker conversation engine
// ========================================
//
// Manages a multi-step conversational flow that guides the user
// through mood, group size, budget, and location preferences,
// then generates 3 personalized suggestions mixing profiles,
// events, venues, and date ideas.

import { useState, useCallback, useRef } from "react";
import { type Profile } from "@/lib/mock-profiles";
import { type PopUpEvent } from "@/lib/popup-events";
import { DATE_IDEAS } from "@/lib/dateIdeas";
import { VENUES } from "@/lib/venues";
import { PARIS_NEIGHBORHOODS } from "@/lib/neighborhoods";

// Mock profile/event arrays were removed 2026-04-20. Until a real AI suggestion
// endpoint (Anthropic/OpenAI) is wired in, the assistant seeds its suggestion
// pipeline with empty datasets and returns an empty suggestions list — the UI
// renders an empty-state gracefully.
// TODO(ai): replace these datasets with a call to /api/assistant/suggestions
// that generates suggestions from the user's recent activity + live profile
// and event tables.
const PROFILE_DATASET: Profile[] = [];
const EVENT_DATASET: PopUpEvent[] = [];

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type MoodOption =
  | "aventureux"
  | "social"
  | "romantique"
  | "chill"
  | "festif"
  | "curieux";

export type GroupOption = "solo" | "duo" | "groupe";

export type BudgetOption = "gratuit" | "petit" | "plaisir";

export type AssistantStep =
  | "greeting"
  | "mood"
  | "group"
  | "budget"
  | "location"
  | "thinking"
  | "suggestions"
  | "planning";

export interface AssistantOption {
  id: string;
  label: string;
  emoji: string;
}

export interface AssistantSuggestion {
  id: string;
  title: string;
  description: string;
  type: "match" | "event" | "venue";
  emoji: string;
  compatibility?: number;
  matchName?: string;
  matchPhoto?: string;
  location: string;
  price: string;
  time: string;
  tags: string[];
  conversationStarters?: string[];
}

export interface AssistantMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  type: "text" | "options" | "suggestions" | "planning";
  options?: AssistantOption[];
  suggestions?: AssistantSuggestion[];
  planningDetails?: PlanningDetails;
}

export interface PlanningDetails {
  suggestion: AssistantSuggestion;
  meetingPoint: string;
  suggestedTime: string;
  conversationStarters: string[];
  tips: string[];
}

export interface AssistantSession {
  id: string;
  date: string;
  mood: MoodOption | null;
  group: GroupOption | null;
  budget: BudgetOption | null;
  location: string | null;
  selectedSuggestion: AssistantSuggestion | null;
}

export interface UseAssistantResult {
  messages: AssistantMessage[];
  currentStep: AssistantStep;
  addUserReply: (optionId: string) => void;
  selectSuggestion: (suggestionId: string) => void;
  suggestions: AssistantSuggestion[];
  selectedSuggestion: AssistantSuggestion | null;
  restart: () => void;
  history: AssistantSession[];
  isTyping: boolean;
}

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const MOOD_OPTIONS: AssistantOption[] = [
  { id: "aventureux", label: "Aventureux", emoji: "\uD83D\uDE80" },
  { id: "social", label: "Social", emoji: "\uD83E\uDD42" },
  { id: "romantique", label: "Romantique", emoji: "\uD83D\uDC95" },
  { id: "chill", label: "Chill", emoji: "\uD83D\uDE0C" },
  { id: "festif", label: "Festif", emoji: "\uD83C\uDF89" },
  { id: "curieux", label: "Curieux", emoji: "\uD83E\uDDD0" },
];

const GROUP_OPTIONS: AssistantOption[] = [
  { id: "solo", label: "Seul(e)", emoji: "\uD83D\uDE4B" },
  { id: "duo", label: "En duo", emoji: "\uD83D\uDC6B" },
  { id: "groupe", label: "En groupe", emoji: "\uD83D\uDC65" },
];

const BUDGET_OPTIONS: AssistantOption[] = [
  { id: "gratuit", label: "Gratuit", emoji: "\u2728" },
  { id: "petit", label: "Petit budget", emoji: "\uD83D\uDCB0" },
  { id: "plaisir", label: "On se fait plaisir", emoji: "\uD83C\uDF7E" },
];

const LOCATION_OPTIONS: AssistantOption[] = [
  { id: "marais", label: "Le Marais", emoji: "\uD83C\uDFD8\uFE0F" },
  { id: "bastille", label: "Bastille", emoji: "\uD83C\uDF1F" },
  { id: "montmartre", label: "Montmartre", emoji: "\uD83C\uDFA8" },
  { id: "oberkampf", label: "Oberkampf", emoji: "\uD83C\uDFB6" },
  { id: "saint-germain", label: "Saint-Germain", emoji: "\uD83D\uDCDA" },
  { id: "belleville", label: "Belleville", emoji: "\uD83C\uDF0D" },
  { id: "chatelet", label: "Chatelet", emoji: "\u26F2" },
  { id: "peu-importe", label: "Peu importe", emoji: "\uD83C\uDF0E" },
];

// ─────────────────────────────────────────
// AI Response Templates
// ─────────────────────────────────────────

const GREETING_MESSAGES = [
  "Salut ! Je suis ton assistant CeSoir. Comment tu te sens ce soir ?",
  "Hey ! Pret(e) pour une super soiree ? Dis-moi ton mood du moment.",
  "Bonsoir ! Je suis la pour t'aider a trouver le plan parfait. Quel est ton etat d'esprit ?",
];

const MOOD_RESPONSES: Record<MoodOption, string> = {
  aventureux: "Mode aventure active ! Tu veux sortir seul(e) ou avec du monde ?",
  social: "Ambiance sociale, j'adore ! Tu preferes etre seul(e), en duo ou en groupe ?",
  romantique: "Soiree romantique en vue... Tu veux sortir seul(e) ou en duo ?",
  chill: "Soiree tranquille, bonne idee. Seul(e) ou accompagne(e) ?",
  festif: "On va faire la fete ! Seul(e), duo ou groupe ?",
  curieux: "La curiosite, c'est la meilleure qualite. Seul(e) ou avec quelqu'un ?",
};

const GROUP_RESPONSES: Record<GroupOption, string> = {
  solo: "Ok, soiree solo ! Quel budget tu veux mettre ?",
  duo: "A deux c'est mieux ! Quel budget pour la soiree ?",
  groupe: "Plus on est de fous, plus on rit ! Budget ?",
};

const BUDGET_RESPONSES: Record<BudgetOption, string> = {
  gratuit: "Gratuit et genial, c'est possible ! Quel quartier te tente ?",
  petit: "Bon plan sans se ruiner. Quel quartier ?",
  plaisir: "On se fait plaisir ce soir ! Quel quartier te ferait envie ?",
};

// ─────────────────────────────────────────
// Suggestion generator
// ─────────────────────────────────────────

function generateSuggestions(
  mood: MoodOption,
  group: GroupOption,
  budget: BudgetOption,
  location: string,
): AssistantSuggestion[] {
  const suggestions: AssistantSuggestion[] = [];

  // --- Suggestion A: Match + Venue ---
  const moodToMode: Record<MoodOption, string[]> = {
    aventureux: ["night-owl", "fit-date", "tourist"],
    social: ["plus-one", "new-in-town", "gamer-night"],
    romantique: ["solo-diner", "culture-club"],
    chill: ["sober-tonight", "breakup", "langue"],
    festif: ["night-owl", "plus-one", "foodie-quest"],
    curieux: ["tourist", "culture-club", "foodie-quest"],
  };

  const relevantModes = moodToMode[mood];
  const matchProfiles = PROFILE_DATASET.filter((p) =>
    relevantModes.includes(p.mode),
  );

  // Pick a profile (suggestion A only produced when a profile is available)
  const profile =
    matchProfiles[Math.floor(Math.random() * matchProfiles.length)] ||
    PROFILE_DATASET[0];

  // Find a venue matching location and budget
  const locationVenues = VENUES.filter((v) => {
    if (location === "peu-importe") return true;
    return v.arrondissement.toLowerCase().includes(location.slice(0, 3)) ||
      v.name.toLowerCase().includes(location);
  });
  const venuePool = locationVenues.length > 0 ? locationVenues : VENUES;
  const venue = venuePool[Math.floor(Math.random() * venuePool.length)];

  if (profile && venue) {
    const compatibility = 75 + Math.floor(Math.random() * 20);

    suggestions.push({
      id: "sug-1",
      title: `${venue.type === "restaurant" ? "Diner" : "Soiree"} ${venue.type === "restaurant" ? "a" : "au"} ${venue.name}`,
      description: `${group === "solo" ? "Rejoins" : "Retrouve"} ${profile.name} (${compatibility}% compatible) pour ${
        venue.type === "restaurant"
          ? "un diner"
          : venue.type === "bar"
            ? "un verre"
            : "une sortie"
      } ${mood === "chill" ? "tranquille" : mood === "festif" ? "de folie" : "sympa"}.`,
      type: "match",
      emoji: venue.type === "restaurant" ? "\uD83C\uDF7D\uFE0F" : venue.type === "bar" ? "\uD83C\uDF78" : "\uD83C\uDF1F",
      compatibility,
      matchName: profile.name,
      matchPhoto: profile.photo,
      location: `${venue.name}, ${venue.arrondissement}`,
      price: budget === "gratuit" ? "Gratuit" : budget === "petit" ? "\u20AC" : "\u20AC\u20AC",
      time: "20h00",
      tags: [mood, venue.type, venue.arrondissement],
      conversationStarters: [
        `Demande a ${profile.name} quel est son endroit prefere a Paris`,
        `Parle de ce qui t'a attire dans le mode ${mood}`,
        `Raconte ta meilleure soiree improvisee`,
      ],
    });
  }

  // --- Suggestion B: Event ---
  const events = EVENT_DATASET.filter((e) => {
    if (group === "solo" && e.maxAttendees > 10) return true;
    if (group === "groupe") return true;
    return e.currentAttendees < e.maxAttendees;
  });
  const event =
    events[Math.floor(Math.random() * events.length)] || EVENT_DATASET[0];

  if (event) {
    suggestions.push({
      id: "sug-2",
      title: event.title,
      description: `${event.description} ${event.currentAttendees} personnes inscrites, ${event.maxAttendees - event.currentAttendees} places restantes.`,
      type: "event",
      emoji: "\uD83C\uDF89",
      location: `${event.venue}, ${event.arrondissement}`,
      price: budget === "gratuit" ? "Gratuit" : "\u20AC",
      time: event.time,
      tags: event.tags,
      conversationStarters: [
        "Presente-toi au groupe en partageant ton meilleur souvenir de soiree",
        "Demande aux autres ce qui les a motives a venir",
      ],
    });
  }

  // --- Suggestion C: Date Idea + Venue ---
  const moodToCategory: Record<MoodOption, string[]> = {
    aventureux: ["aventure", "sport"],
    social: ["verre", "diner"],
    romantique: ["balade", "diner"],
    chill: ["chill", "balade"],
    festif: ["verre", "aventure"],
    curieux: ["culture", "balade"],
  };

  const relevantCategories = moodToCategory[mood];
  const ideas = DATE_IDEAS.filter((idea) =>
    relevantCategories.includes(idea.category),
  );
  const idea = ideas[Math.floor(Math.random() * ideas.length)] || DATE_IDEAS[0];

  const neighborhoods = PARIS_NEIGHBORHOODS;
  const neighborhood =
    location === "peu-importe"
      ? neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
      : neighborhoods.find((n) => n.name.toLowerCase().includes(location)) || neighborhoods[0];

  suggestions.push({
    id: "sug-3",
    title: `${idea.emoji} ${idea.title}`,
    description: `${idea.description} Ambiance ${neighborhood.vibe.toLowerCase()} dans le quartier ${neighborhood.name}.`,
    type: "venue",
    emoji: idea.emoji,
    location: neighborhood.name,
    price: idea.priceRange === "gratuit" ? "Gratuit" : idea.priceRange,
    time: idea.bestTime === "any" ? "Flexible" : idea.bestTime,
    tags: [idea.category, neighborhood.name, idea.duration],
    conversationStarters: [
      `Parfait pour une soiree ${mood}`,
      `Le quartier ${neighborhood.name} est ideal pour ca`,
    ],
  });

  return suggestions;
}

// ─────────────────────────────────────────
// Planning generator
// ─────────────────────────────────────────

function generatePlanning(suggestion: AssistantSuggestion): PlanningDetails {
  return {
    suggestion,
    meetingPoint: `Devant ${suggestion.location.split(",")[0]}`,
    suggestedTime: suggestion.time || "20h00",
    conversationStarters: suggestion.conversationStarters || [
      "Parle de ton quartier prefere a Paris",
      "Raconte ta derniere decouverte culinaire",
      "Quel est ton plan de soiree ideal ?",
    ],
    tips: [
      "Arrive 5 minutes en avance pour reperer l'endroit",
      "Previens un ami de l'endroit ou tu vas",
      "Laisse ton telephone dans ta poche et profite du moment",
    ],
  };
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

let _messageId = 0;
function nextId(): string {
  return `msg-${++_messageId}-${Date.now()}`;
}

const HISTORY_KEY = "cesoir_assistant_history";

function loadHistory(): AssistantSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(sessions: AssistantSession[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(-10)));
  } catch {
    // localStorage full — ignore
  }
}

export function useAssistant(): UseAssistantResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<AssistantStep>("greeting");
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AssistantSuggestion | null>(null);
  const [history, setHistory] = useState<AssistantSession[]>(() => loadHistory());
  const [isTyping, setIsTyping] = useState(false);

  const answers = useRef<{
    mood: MoodOption | null;
    group: GroupOption | null;
    budget: BudgetOption | null;
    location: string | null;
  }>({ mood: null, group: null, budget: null, location: null });

  const initialized = useRef(false);

  // Initialize with greeting on first render
  if (!initialized.current) {
    initialized.current = true;
    const greeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
    setMessages([
      {
        id: nextId(),
        role: "ai",
        content: greeting,
        type: "options",
        options: MOOD_OPTIONS,
      },
    ]);
    setCurrentStep("mood");
  }

  // Simulate AI typing delay
  const addAIMessage = useCallback(
    (message: Omit<AssistantMessage, "id">, delay = 800) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { ...message, id: nextId() }]);
      }, delay);
    },
    [],
  );

  // Handle user reply at each step
  const addUserReply = useCallback(
    (optionId: string) => {
      const option = [
        ...MOOD_OPTIONS,
        ...GROUP_OPTIONS,
        ...BUDGET_OPTIONS,
        ...LOCATION_OPTIONS,
      ].find((o) => o.id === optionId);

      if (!option) return;

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "user",
          content: `${option.emoji} ${option.label}`,
          type: "text",
        },
      ]);

      switch (currentStep) {
        case "mood": {
          answers.current.mood = optionId as MoodOption;
          setCurrentStep("group");
          addAIMessage({
            role: "ai",
            content: MOOD_RESPONSES[optionId as MoodOption],
            type: "options",
            options: GROUP_OPTIONS,
          });
          break;
        }
        case "group": {
          answers.current.group = optionId as GroupOption;
          setCurrentStep("budget");
          addAIMessage({
            role: "ai",
            content: GROUP_RESPONSES[optionId as GroupOption],
            type: "options",
            options: BUDGET_OPTIONS,
          });
          break;
        }
        case "budget": {
          answers.current.budget = optionId as BudgetOption;
          setCurrentStep("location");
          addAIMessage({
            role: "ai",
            content: BUDGET_RESPONSES[optionId as BudgetOption],
            type: "options",
            options: LOCATION_OPTIONS,
          });
          break;
        }
        case "location": {
          answers.current.location = optionId;
          setCurrentStep("thinking");

          // Simulate AI "thinking"
          addAIMessage(
            {
              role: "ai",
              content: "Je cherche les meilleurs plans pour toi...",
              type: "text",
            },
            600,
          );

          // Generate suggestions after a delay
          setTimeout(() => {
            const { mood, group, budget, location } = answers.current;
            if (mood && group && budget && location) {
              const generated = generateSuggestions(mood, group, budget, location);
              setSuggestions(generated);
              setCurrentStep("suggestions");
              setMessages((prev) => [
                ...prev,
                {
                  id: nextId(),
                  role: "ai",
                  content: `J'ai trouve 3 plans parfaits pour ta soiree ${mood} ! Lequel te tente ?`,
                  type: "suggestions",
                  suggestions: generated,
                },
              ]);
            }
          }, 2000);
          break;
        }
        default:
          break;
      }
    },
    [currentStep, addAIMessage],
  );

  // Handle suggestion selection
  const selectSuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = suggestions.find((s) => s.id === suggestionId);
      if (!suggestion) return;

      setSelectedSuggestion(suggestion);
      setCurrentStep("planning");

      // Add user selection message
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "user",
          content: `J'adore "${suggestion.title}" !`,
          type: "text",
        },
      ]);

      const planning = generatePlanning(suggestion);

      addAIMessage(
        {
          role: "ai",
          content: "Super choix ! Voici ton plan pour ce soir :",
          type: "planning",
          planningDetails: planning,
        },
        1000,
      );

      // Save session to history
      const session: AssistantSession = {
        id: `session-${Date.now()}`,
        date: new Date().toISOString(),
        mood: answers.current.mood,
        group: answers.current.group,
        budget: answers.current.budget,
        location: answers.current.location,
        selectedSuggestion: suggestion,
      };
      const updated = [...history, session];
      setHistory(updated);
      saveHistory(updated);
    },
    [suggestions, history, addAIMessage],
  );

  // Restart the conversation
  const restart = useCallback(() => {
    _messageId = 0;
    answers.current = { mood: null, group: null, budget: null, location: null };
    setSuggestions([]);
    setSelectedSuggestion(null);
    setIsTyping(false);

    const greeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
    setMessages([
      {
        id: nextId(),
        role: "ai",
        content: greeting,
        type: "options",
        options: MOOD_OPTIONS,
      },
    ]);
    setCurrentStep("mood");
  }, []);

  return {
    messages,
    currentStep,
    addUserReply,
    selectSuggestion,
    suggestions,
    selectedSuggestion,
    restart,
    history,
    isTyping,
  };
}

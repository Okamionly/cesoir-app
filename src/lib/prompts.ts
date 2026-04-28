// ---------- Editable Profile Prompts ----------

export type PromptCategory = "humour" | "passion" | "soiree" | "food" | "voyage";

export interface Prompt {
  id: string;
  category: PromptCategory;
  text: string;
}

export interface PromptAnswer {
  promptId: string;
  answer: string;
}

export const PROMPT_CATEGORIES: Record<PromptCategory, { label: string; icon: string }> = {
  humour: { label: "Humour", icon: "😂" },
  passion: { label: "Passion", icon: "🔥" },
  soiree: { label: "Soirée", icon: "🌙" },
  food: { label: "Food", icon: "🍽️" },
  voyage: { label: "Voyage", icon: "✈️" },
};

export const PROMPTS: Prompt[] = [
  // Humour (7)
  { id: "h1", category: "humour", text: "La blague qui fait toujours rire mes potes" },
  { id: "h2", category: "humour", text: "Mon pire date en une phrase" },
  { id: "h3", category: "humour", text: "Le truc le plus random que j'ai fait ce mois" },
  { id: "h4", category: "humour", text: "Ma théorie absurde sur la vie" },
  { id: "h5", category: "humour", text: "Le talent inutile dont je suis le plus fier" },
  { id: "h6", category: "humour", text: "Mon emoji spirit animal" },
  { id: "h7", category: "humour", text: "Le truc bizarre qui me fait rire à chaque fois" },

  // Passion (6)
  { id: "p1", category: "passion", text: "Je pourrais parler de ça pendant des heures" },
  { id: "p2", category: "passion", text: "Mon obsession du moment" },
  { id: "p3", category: "passion", text: "Le projet secret sur lequel je bosse" },
  { id: "p4", category: "passion", text: "Le livre/film qui m'a changé" },
  { id: "p5", category: "passion", text: "Mon dimanche parfait ressemble à" },
  { id: "p6", category: "passion", text: "Si j'avais un an sabbatique, je ferais" },

  // Soirée (6)
  { id: "s1", category: "soiree", text: "Ma soirée idéale commence par" },
  { id: "s2", category: "soiree", text: "Le bar/resto où je traîne toujours" },
  { id: "s3", category: "soiree", text: "Ce soir j'ai envie de" },
  { id: "s4", category: "soiree", text: "Mon cocktail signature" },
  { id: "s5", category: "soiree", text: "La musique qui me met de bonne humeur" },
  { id: "s6", category: "soiree", text: "Un plan soirée que j'ai jamais osé tenter" },

  // Food (6)
  { id: "f1", category: "food", text: "Mon plat comfort food numéro 1" },
  { id: "f2", category: "food", text: "La cuisine que je pourrais manger tous les jours" },
  { id: "f3", category: "food", text: "Mon opinion culinaire controversée" },
  { id: "f4", category: "food", text: "Le meilleur resto où j'ai mangé cette année" },
  { id: "f5", category: "food", text: "Ma spécialité en cuisine" },
  { id: "f6", category: "food", text: "Le plat que je refuse catégoriquement de manger" },

  // Voyage (6)
  { id: "v1", category: "voyage", text: "La ville qui m'a le plus marqué" },
  { id: "v2", category: "voyage", text: "Ma prochaine destination de rêve" },
  { id: "v3", category: "voyage", text: "Sac à dos ou resort tout inclus ?" },
  { id: "v4", category: "voyage", text: "Le meilleur souvenir de voyage" },
  { id: "v5", category: "voyage", text: "Le pays où je pourrais vivre" },
  { id: "v6", category: "voyage", text: "Mon astuce voyage secrète" },
];

export function getPromptsByCategory(category: PromptCategory): Prompt[] {
  return PROMPTS.filter((p) => p.category === category);
}

export function getPromptById(id: string): Prompt | undefined {
  return PROMPTS.find((p) => p.id === id);
}

// ---------- localStorage persistence ----------

const STORAGE_KEY = "cesoir_prompt_answers";

export function loadPromptAnswers(): PromptAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PromptAnswer[]) : [];
  } catch {
    return [];
  }
}

export function savePromptAnswers(answers: PromptAnswer[]): void {
  if (typeof window === "undefined") return;
  // Only keep up to 3 answers
  const limited = answers.slice(0, 3);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
}

// ============================================================================
// WAVE 17 — Hinge-style profile prompts
// ============================================================================
//
// PROMPT_QUESTIONS is a curated list of 50 French questions, each tagged with
// one of 6 broad categories (food / dating / lifestyle / travel / personality
// / humor) plus an emoji used as a category visual cue on cards.
//
// Why a separate constant from `PROMPTS` (above):
//   The `PROMPTS` array is the legacy "envies ce soir" surface — short,
//   action-oriented chips ("Ce soir j'ai envie de ..."). PROMPT_QUESTIONS is
//   the new long-form, personality-led surface that mirrors Hinge: the user
//   picks 3, types a 150-char answer, and the {question, answer} pair is
//   rendered as a card slot inside the photo carousel.
//
// PromptQuestionCategory is intentionally distinct from PromptCategory so the
// two surfaces can evolve independently without breaking imports.
//
// IDs use a `q-<slug>` namespace so DB rows can also reference the legacy
// `PROMPTS` IDs (h1, p1, …) in the future without collision risk.
// ============================================================================

export type PromptQuestionCategory =
  | "food"
  | "dating"
  | "lifestyle"
  | "travel"
  | "personality"
  | "humor";

export interface PromptQuestion {
  id: string;
  question: string;
  category: PromptQuestionCategory;
  emoji: string;
}

export const PROMPT_QUESTION_CATEGORIES: Record<
  PromptQuestionCategory,
  { label: string; emoji: string }
> = {
  food: { label: "Food", emoji: "🍽️" },
  dating: { label: "Dating", emoji: "💌" },
  lifestyle: { label: "Lifestyle", emoji: "✨" },
  travel: { label: "Voyage", emoji: "✈️" },
  personality: { label: "Personnalité", emoji: "🪞" },
  humor: { label: "Humour", emoji: "😂" },
};

export const PROMPT_QUESTIONS: PromptQuestion[] = [
  // ── Food (8) ──
  { id: "q-food-dinner", question: "Mon dîner idéal c'est…", category: "food", emoji: "🍽️" },
  { id: "q-food-comfort", question: "Mon plat doudou quand tout va mal", category: "food", emoji: "🍝" },
  { id: "q-food-controverse", question: "L'opinion culinaire qui choque mes amis", category: "food", emoji: "🌶️" },
  { id: "q-food-cook", question: "Ma spécialité en cuisine c'est…", category: "food", emoji: "👨‍🍳" },
  { id: "q-food-resto", question: "Le resto où je t'emmène au premier date", category: "food", emoji: "🥂" },
  { id: "q-food-petit-dej", question: "Mon petit-déjeuner du dimanche parfait", category: "food", emoji: "🥐" },
  { id: "q-food-jamais", question: "Le plat que je refuse de manger c'est…", category: "food", emoji: "🚫" },
  { id: "q-food-snack", question: "Mon snack honteux à 23h", category: "food", emoji: "🍫" },

  // ── Dating (9) ──
  { id: "q-dating-first", question: "Mon premier date idéal ressemble à", category: "dating", emoji: "💌" },
  { id: "q-dating-greenflag", question: "Le green flag que je remarque tout de suite", category: "dating", emoji: "🟢" },
  { id: "q-dating-redflag", question: "Le red flag qui me fait fuir", category: "dating", emoji: "🚩" },
  { id: "q-dating-amour", question: "Pour moi, l'amour c'est…", category: "dating", emoji: "💗" },
  { id: "q-dating-couple", question: "Mon couple modèle dans la pop culture", category: "dating", emoji: "💑" },
  { id: "q-dating-gestes", question: "Le petit geste qui me fait fondre", category: "dating", emoji: "🫶" },
  { id: "q-dating-call", question: "Appelle-moi si tu aimes…", category: "dating", emoji: "📞" },
  { id: "q-dating-soir", question: "Notre vendredi soir parfait à deux", category: "dating", emoji: "🌃" },
  { id: "q-dating-confess", question: "Je tombe amoureux/se quand…", category: "dating", emoji: "💘" },

  // ── Lifestyle (8) ──
  { id: "q-life-dimanche", question: "Mon dimanche parfait c'est…", category: "lifestyle", emoji: "☀️" },
  { id: "q-life-routine", question: "Ma routine du matin non négociable", category: "lifestyle", emoji: "☕" },
  { id: "q-life-flex", question: "Le flex le plus random de ma vie", category: "lifestyle", emoji: "💪" },
  { id: "q-life-projet", question: "Le projet sur lequel je bosse en secret", category: "lifestyle", emoji: "🛠️" },
  { id: "q-life-energy", question: "Ce qui me recharge à 200%", category: "lifestyle", emoji: "⚡" },
  { id: "q-life-sport", question: "Mon sport ou mon activité du moment", category: "lifestyle", emoji: "🏃" },
  { id: "q-life-spend", question: "Sur quoi je claque mon argent sans culpabiliser", category: "lifestyle", emoji: "💸" },
  { id: "q-life-jeune", question: "Ce que jeune moi serait fier/e de moi aujourd'hui", category: "lifestyle", emoji: "🌱" },

  // ── Travel (7) ──
  { id: "q-travel-next", question: "Ma prochaine destination de rêve", category: "travel", emoji: "✈️" },
  { id: "q-travel-marqué", question: "La ville qui m'a le plus marqué/e", category: "travel", emoji: "🏙️" },
  { id: "q-travel-style", question: "Sac à dos ou hôtel 5 étoiles ?", category: "travel", emoji: "🎒" },
  { id: "q-travel-souvenir", question: "Mon souvenir de voyage le plus dingue", category: "travel", emoji: "📸" },
  { id: "q-travel-vivre", question: "Le pays où je pourrais vivre demain", category: "travel", emoji: "🌍" },
  { id: "q-travel-secret", question: "Mon spot secret en France", category: "travel", emoji: "🗺️" },
  { id: "q-travel-bucket", question: "Le truc en haut de ma bucket list", category: "travel", emoji: "🪣" },

  // ── Personality (10) ──
  { id: "q-perso-flaw", question: "Mon défaut que j'assume complètement", category: "personality", emoji: "🪞" },
  { id: "q-perso-quote", question: "La phrase qui me définit", category: "personality", emoji: "💬" },
  { id: "q-perso-passion", question: "Je pourrais parler de ça pendant des heures", category: "personality", emoji: "🎯" },
  { id: "q-perso-livre", question: "Le livre qui m'a transformé/e", category: "personality", emoji: "📖" },
  { id: "q-perso-film", question: "Le film que je peux re-regarder en boucle", category: "personality", emoji: "🎬" },
  { id: "q-perso-musique", question: "La chanson qui me fait toujours danser", category: "personality", emoji: "🎶" },
  { id: "q-perso-superpouvoir", question: "Le super-pouvoir que je voudrais", category: "personality", emoji: "🦸" },
  { id: "q-perso-dream", question: "Mon rêve d'enfant, version 2026", category: "personality", emoji: "🌠" },
  { id: "q-perso-fear", question: "Ce qui me fait flipper le plus", category: "personality", emoji: "😨" },
  { id: "q-perso-fier", question: "Ce dont je suis le/la plus fier/e", category: "personality", emoji: "🏆" },

  // ── Humor (8) ──
  { id: "q-humor-blague", question: "La blague qui marche à tous les coups", category: "humor", emoji: "😂" },
  { id: "q-humor-pire", question: "Mon pire date en une phrase", category: "humor", emoji: "🙃" },
  { id: "q-humor-talent", question: "Le talent inutile dont je suis trop fier/e", category: "humor", emoji: "🎪" },
  { id: "q-humor-emoji", question: "Mon emoji spirit animal", category: "humor", emoji: "🐧" },
  { id: "q-humor-confess", question: "L'aveu qui va te faire rire", category: "humor", emoji: "🤐" },
  { id: "q-humor-theorie", question: "Ma théorie complotiste préférée", category: "humor", emoji: "🛸" },
  { id: "q-humor-bizarre", question: "Le truc bizarre qui me fait rire à chaque fois", category: "humor", emoji: "🤪" },
  { id: "q-humor-cringe", question: "Le moment cringe que je raconte en soirée", category: "humor", emoji: "😬" },
];

/** Hard cap on per-prompt answer length. Mirrored in the DB CHECK. */
export const PROMPT_ANSWER_MAX_LENGTH = 150;

/** Always exactly 3 prompt slots on the profile. */
export const PROMPT_SLOT_COUNT = 3;

/** Lookup helper used by SwipeCard + PromptEditor to render a question by id. */
export function getPromptQuestionById(id: string): PromptQuestion | undefined {
  return PROMPT_QUESTIONS.find((q) => q.id === id);
}

/** Group the question list by category — drives the picker grouping. */
export function getPromptQuestionsByCategory(
  category: PromptQuestionCategory,
): PromptQuestion[] {
  return PROMPT_QUESTIONS.filter((q) => q.category === category);
}

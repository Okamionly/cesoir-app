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
  soiree: { label: "Soiree", icon: "🌙" },
  food: { label: "Food", icon: "🍽️" },
  voyage: { label: "Voyage", icon: "✈️" },
};

export const PROMPTS: Prompt[] = [
  // Humour (7)
  { id: "h1", category: "humour", text: "La blague qui fait toujours rire mes potes" },
  { id: "h2", category: "humour", text: "Mon pire date en une phrase" },
  { id: "h3", category: "humour", text: "Le truc le plus random que j'ai fait ce mois" },
  { id: "h4", category: "humour", text: "Ma theorie absurde sur la vie" },
  { id: "h5", category: "humour", text: "Le talent inutile dont je suis le plus fier" },
  { id: "h6", category: "humour", text: "Mon emoji spirit animal" },
  { id: "h7", category: "humour", text: "Le truc bizarre qui me fait rire a chaque fois" },

  // Passion (6)
  { id: "p1", category: "passion", text: "Je pourrais parler de ca pendant des heures" },
  { id: "p2", category: "passion", text: "Mon obsession du moment" },
  { id: "p3", category: "passion", text: "Le projet secret sur lequel je bosse" },
  { id: "p4", category: "passion", text: "Le livre/film qui m'a change" },
  { id: "p5", category: "passion", text: "Mon dimanche parfait ressemble a" },
  { id: "p6", category: "passion", text: "Si j'avais un an sabbatique, je ferais" },

  // Soiree (6)
  { id: "s1", category: "soiree", text: "Ma soiree ideale commence par" },
  { id: "s2", category: "soiree", text: "Le bar/resto ou je trainetoujours" },
  { id: "s3", category: "soiree", text: "Ce soir j'ai envie de" },
  { id: "s4", category: "soiree", text: "Mon cocktail signature" },
  { id: "s5", category: "soiree", text: "La musique qui me met de bonne humeur" },
  { id: "s6", category: "soiree", text: "Un plan soiree que j'ai jamais ose tenter" },

  // Food (6)
  { id: "f1", category: "food", text: "Mon plat comfort food numero 1" },
  { id: "f2", category: "food", text: "La cuisine que je pourrais manger tous les jours" },
  { id: "f3", category: "food", text: "Mon opinion culinaire controversee" },
  { id: "f4", category: "food", text: "Le meilleur resto ou j'ai mange cette annee" },
  { id: "f5", category: "food", text: "Ma specialite en cuisine" },
  { id: "f6", category: "food", text: "Le plat que je refuse categoriquement de manger" },

  // Voyage (6)
  { id: "v1", category: "voyage", text: "La ville qui m'a le plus marque" },
  { id: "v2", category: "voyage", text: "Ma prochaine destination de reve" },
  { id: "v3", category: "voyage", text: "Sac a dos ou resort tout inclus ?" },
  { id: "v4", category: "voyage", text: "Le meilleur souvenir de voyage" },
  { id: "v5", category: "voyage", text: "Le pays ou je pourrais vivre" },
  { id: "v6", category: "voyage", text: "Mon astuce voyage secrete" },
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

/**
 * CeSoir Message Screening
 * Simple keyword-based message screening for safety.
 * Detects insults, sexual harassment, threats, spam, and personal info requests.
 */

// ─── Types ───────────────────────────────────────

export type Severity = "clean" | "warning" | "block";

export interface ScreeningResult {
  isClean: boolean;
  flaggedWords: string[];
  severity: Severity;
  category: string | null;
  warningMessage: string | null;
}

// ─── Flagged patterns ────────────────────────────

interface FlagPattern {
  words: string[];
  severity: Severity;
  category: string;
}

const FLAG_PATTERNS: FlagPattern[] = [
  // ── Insults (block) ──
  {
    severity: "block",
    category: "insulte",
    words: [
      "connard", "connasse", "salope", "putain", "pute",
      "enculer", "encule", "enculee", "nique", "ntm",
      "fdp", "fils de pute", "batard", "batarde", "pd",
      "petasse", "conne", "debile", "mongol", "mongole",
      "tarlouze", "tapette", "negre", "bougnoule", "sale race",
    ],
  },
  // ── Sexual harassment (block) ──
  {
    severity: "block",
    category: "harcelement sexuel",
    words: [
      "envoie tes nudes", "envoie des nudes", "montre tes seins",
      "montre ta chatte", "suce moi", "je vais te baiser",
      "t es bonne", "tu es bonne", "je bande", "je mouille",
      "ton cul", "ta chatte", "tes nichons", "tes seins",
      "sexto", "plan cul ce soir", "dtc", "tg",
    ],
  },
  // ── Threats (block) ──
  {
    severity: "block",
    category: "menace",
    words: [
      "je vais te tuer", "je vais te frapper", "je te retrouve",
      "t es morte", "tu vas mourir", "je vais te violer",
      "je te frappe", "tu vas le regretter", "je sais ou tu habites",
      "attention a toi", "gare a toi", "je vais te faire du mal",
    ],
  },
  // ── Personal info requests (warning) ──
  {
    severity: "warning",
    category: "demande d'infos personnelles",
    words: [
      "ton adresse", "ta adresse", "ou tu habites", "donne ton numero",
      "envoie ton numero", "ton code postal", "ton iban",
      "ta carte bancaire", "ton mot de passe", "ton mdp",
      "quel etage", "quelle rue", "ton nom de famille",
      "envoie moi de l argent", "prete moi de l argent",
      "ton rib", "ta carte bleue",
    ],
  },
  // ── Spam patterns (warning) ──
  {
    severity: "warning",
    category: "spam",
    words: [
      "clique sur ce lien", "gagne de l argent", "investis maintenant",
      "offre limitee", "code promo", "crypto gratuit",
      "bitcoin gratuit", "mlm", "schema pyramidal",
      "deviens riche", "revenu passif garanti", "formation gratuite",
      "whatsapp moi", "ajoute moi sur snap", "mon telegram",
    ],
  },
  // ── Offensive language (warning) ──
  {
    severity: "warning",
    category: "langage offensant",
    words: [
      "ta gueule", "ferme ta gueule", "casse toi", "degage",
      "t es moche", "tu es laide", "tu es laid", "grosse",
      "gros porc", "sale", "degueu", "tu pues",
      "personne te veut", "tu fais pitie",
    ],
  },
];

// ─── Normalize text for matching ─────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/['']/g, " ")
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Main screening function ─────────────────────

export function screenMessage(message: string): ScreeningResult {
  if (!message || message.trim().length === 0) {
    return {
      isClean: true,
      flaggedWords: [],
      severity: "clean",
      category: null,
      warningMessage: null,
    };
  }

  const normalized = normalize(message);
  const flaggedWords: string[] = [];
  let highestSeverity: Severity = "clean";
  let detectedCategory: string | null = null;

  for (const pattern of FLAG_PATTERNS) {
    for (const word of pattern.words) {
      const normalizedWord = normalize(word);
      if (normalized.includes(normalizedWord)) {
        flaggedWords.push(word);

        // Escalate severity (block > warning > clean)
        if (pattern.severity === "block") {
          highestSeverity = "block";
          detectedCategory = pattern.category;
        } else if (pattern.severity === "warning" && highestSeverity !== "block") {
          highestSeverity = "warning";
          detectedCategory = pattern.category;
        }
      }
    }
  }

  let warningMessage: string | null = null;
  if (highestSeverity === "warning") {
    warningMessage = "Ce message pourrait etre offensant. Envoyer quand meme ?";
  } else if (highestSeverity === "block") {
    warningMessage = "Message bloque. Ce contenu enfreint nos regles.";
  }

  return {
    isClean: highestSeverity === "clean",
    flaggedWords,
    severity: highestSeverity,
    category: detectedCategory,
    warningMessage,
  };
}

/**
 * Quick check — returns true if the message is safe to send.
 */
export function isMessageSafe(message: string): boolean {
  return screenMessage(message).severity !== "block";
}

/**
 * Returns the severity level for display purposes.
 */
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "clean":
      return "#22c55e";
    case "warning":
      return "#f59e0b";
    case "block":
      return "#EF4444";
  }
}

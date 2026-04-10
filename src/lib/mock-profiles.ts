import { ModeKey } from "./modes";

export interface Profile {
  id: string;
  name: string;
  age: number;
  mode: ModeKey;
  bio: string;
  distance: number;
  time: string;
  color: string;
  // Mode-specific
  cuisine?: string;
  event?: string;
  eventType?: string;
  from?: string;
  badge?: string;
  langs?: string[];
  safe?: boolean;
  since?: string;
  neighborhood?: string;
  ambassador?: boolean;
  speaks?: string[];
  learns?: string;
  level?: string;
  dog?: string;
  breed?: string;
  dogAge?: string;
}

export const MOCK_PROFILES: Profile[] = [
  // Solo Diner
  { id: "1", name: "Sarah", age: 27, mode: "solo-diner", bio: "Envie d'un bon sushi avec quelqu'un de cool. Je connais un super spot dans le 11e !", distance: 1.2, time: "Dispo a 20h", color: "#a855f7", cuisine: "Japonais" },
  { id: "2", name: "Chloe", age: 25, mode: "solo-diner", bio: "Pizza et conversation ! Je cherche quelqu'un de sympa pour une bonne soiree tranquille.", distance: 0.5, time: "Dispo maintenant", color: "#22c55e", cuisine: "Italien" },
  { id: "3", name: "Alex", age: 35, mode: "solo-diner", bio: "Je teste un nouveau restaurant libanais. Cherche quelqu'un pour partager le mezze !", distance: 0.9, time: "Dispo a 19h45", color: "#f59e0b", cuisine: "Libanais" },
  { id: "4", name: "Nadia", age: 29, mode: "solo-diner", bio: "Tartare et bon vin rouge dans un bistrot parisien, qui me rejoint ?", distance: 1.8, time: "Dispo a 20h30", color: "#ec4899", cuisine: "Francais" },

  // Plus-One
  { id: "5", name: "Thomas", age: 29, mode: "plus-one", bio: "Le dernier Nolan sort ce soir, j'ai 2 places ! Seance 20h30.", distance: 3.4, time: "Dispo a 20h", color: "#f59e0b", event: "Cinema - Nolan", eventType: "Cinema" },
  { id: "6", name: "Hugo", age: 33, mode: "plus-one", bio: "Concert jazz gratuit au Sunset ce soir. Place en plus, qui vient ?", distance: 4.2, time: "Dispo a 21h30", color: "#6366f1", event: "Concert Jazz - Sunset", eventType: "Concert" },
  { id: "7", name: "Ines", age: 27, mode: "plus-one", bio: "Escape game a Chatelet ! J'ai une place en plus, premier arrive premier servi.", distance: 4.0, time: "Dispo a 20h30", color: "#ec4899", event: "Escape Game - Chatelet", eventType: "Jeu" },
  { id: "8", name: "Romain", age: 28, mode: "plus-one", bio: "Vernissage dans le Marais ce soir + cocktails offerts. Quelqu'un ?", distance: 2.1, time: "Dispo a 19h", color: "#a855f7", event: "Vernissage - Le Marais", eventType: "Culture" },

  // Tourist
  { id: "9", name: "Emily", age: 26, mode: "tourist", bio: "American in Paris for 3 days! Looking for someone to show me the real Paris tonight.", distance: 2.3, time: "Dispo maintenant", color: "#06b6d4", from: "New York", badge: "Touriste", langs: ["EN", "FR"] },
  { id: "10", name: "Kenji", age: 30, mode: "tourist", bio: "Voyage d'affaires, libre ce soir. Je connais rien ici, guidez-moi !", distance: 1.1, time: "Dispo a 20h", color: "#8b5cf6", from: "Tokyo", badge: "Business", langs: ["JP", "EN"] },
  { id: "11", name: "Marco", age: 34, mode: "tourist", bio: "Parisien depuis 10 ans, je connais tous les spots caches. Je guide !", distance: 0.4, time: "Dispo maintenant", color: "#f59e0b", from: "Paris (local)", badge: "Guide local", langs: ["FR", "IT", "EN"] },

  // Night Owl
  { id: "12", name: "Luna", age: 24, mode: "night-owl", bio: "Balade nocturne le long du canal + glace a minuit. Les insomniaques, on se retrouve ?", distance: 2.1, time: "Dispo a 23h", color: "#6366f1" },
  { id: "13", name: "Yasmine", age: 28, mode: "night-owl", bio: "Kebab a 2h du mat et grandes discussions sur le sens de la vie. Qui est partant ?", distance: 1.5, time: "Dispo a minuit", color: "#818cf8" },
  { id: "14", name: "Theo", age: 26, mode: "night-owl", bio: "Bar de nuit avec musique live jusqu'a 4h. Je cherche un(e) complice.", distance: 3.2, time: "Dispo a 23h30", color: "#a855f7" },

  // Breakup Recovery
  { id: "15", name: "Marie", age: 30, mode: "breakup", bio: "Fraichement separee apres 4 ans. Juste besoin de parler a quelqu'un de bienveillant.", distance: 1.7, time: "Dispo maintenant", color: "#22c55e", safe: true },
  { id: "16", name: "Antoine", age: 32, mode: "breakup", bio: "Rupture recente, pas envie de rester seul. Film + discussion, ambiance zero pression.", distance: 2.4, time: "Dispo a 20h", color: "#10b981", safe: true },
  { id: "17", name: "Leonie", age: 25, mode: "breakup", bio: "Je passe par la aussi. Sortons prendre un chocolat chaud et oublions nos ex.", distance: 0.8, time: "Dispo maintenant", color: "#34d399", safe: true },

  // New in Town
  { id: "18", name: "Paul", age: 27, mode: "new-in-town", bio: "J'ai demenage a Paris il y a 2 semaines. Je connais personne, sauvez-moi !", distance: 1.3, time: "Dispo maintenant", color: "#f59e0b", since: "2 semaines", neighborhood: "Bastille" },
  { id: "19", name: "Sofia", age: 23, mode: "new-in-town", bio: "Erasmus a Paris depuis septembre. Montrez-moi vos coins preferes !", distance: 2.8, time: "Dispo a 20h", color: "#ec4899", since: "3 mois", neighborhood: "Quartier Latin" },
  { id: "20", name: "Karim", age: 35, mode: "new-in-town", bio: "Parisien pur jus, ambassadeur CeSoir. Je connais les meilleurs spots du 11e !", distance: 0.6, time: "Dispo maintenant", color: "#f59e0b", ambassador: true, neighborhood: "11e arrondissement" },

  // Langue Exchange
  { id: "21", name: "Marta", age: 26, mode: "langue", bio: "Espagnole, je veux pratiquer mon francais autour d'un cafe. Je t'apprends l'espagnol !", distance: 1.9, time: "Dispo a 19h30", color: "#06b6d4", speaks: ["Espagnol", "Anglais"], learns: "Francais", level: "B1" },
  { id: "22", name: "Julien", age: 29, mode: "langue", bio: "Je parle francais et anglais. Je cherche quelqu'un pour pratiquer le japonais ce soir.", distance: 3.1, time: "Dispo a 20h", color: "#a855f7", speaks: ["Francais", "Anglais"], learns: "Japonais", level: "A2" },
  { id: "23", name: "Yuki", age: 24, mode: "langue", bio: "Japonaise a Paris ! Mon francais est horrible mais j'adore essayer. Cafe + rires ?", distance: 2.0, time: "Dispo maintenant", color: "#ec4899", speaks: ["Japonais", "Anglais"], learns: "Francais", level: "A1" },

  // Dog Date
  { id: "24", name: "Claire", age: 28, mode: "dog-date", bio: "Moi et Rex (Golden, 3 ans) on cherche des copains de balade aux Buttes-Chaumont !", distance: 1.4, time: "Dispo a 19h", color: "#f59e0b", dog: "Rex", breed: "Golden Retriever", dogAge: "3 ans" },
  { id: "25", name: "Maxime", age: 32, mode: "dog-date", bio: "Lola (Bouledogue) veut des amis. On connait un bar dog-friendly genial !", distance: 0.7, time: "Dispo maintenant", color: "#8b5cf6", dog: "Lola", breed: "Bouledogue Francais", dogAge: "2 ans" },
  { id: "26", name: "Amandine", age: 25, mode: "dog-date", bio: "Luna (Berger Australien) a besoin de se depenser. Parc + cafe ? Chiots bienvenus !", distance: 2.5, time: "Dispo a 18h30", color: "#22c55e", dog: "Luna", breed: "Berger Australien", dogAge: "1 an" },

  // Seasonal
  { id: "27", name: "Luca", age: 29, mode: "seasonal", bio: "Seul pour les fetes cette annee. Organisons un diner entre 'orphelins' de Noel !", distance: 3.0, time: "Dispo toute la soiree", color: "#ef4444" },
  { id: "28", name: "Camille", age: 26, mode: "seasonal", bio: "Nouvel An sans plan ? Moi aussi ! Trouvons une soiree ensemble.", distance: 1.6, time: "Dispo a 22h", color: "#f59e0b" },
  { id: "29", name: "Oceane", age: 31, mode: "seasonal", bio: "Saint-Valentin solo et fiere ! Sortons entre celibataires pour un anti-Valentine.", distance: 2.2, time: "Dispo a 20h", color: "#ec4899" },
];

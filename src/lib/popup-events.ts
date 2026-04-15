import type { ModeKey } from "@/lib/modes";

export interface PopUpEvent {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  mode: ModeKey;
  lat: number;
  lng: number;
  venue: string;
  arrondissement: string;
  time: string;
  /** ISO datetime for sorting/countdown */
  datetime: string;
  maxAttendees: number;
  currentAttendees: number;
  description: string;
  tags: string[];
  attendees: EventAttendee[];
  messages: EventMessage[];
}

export interface EventAttendee {
  id: string;
  name: string;
  avatar: string;
}

export interface EventMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
}

function todayAt(hour: number, min = 0): string {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export const MOCK_EVENTS: PopUpEvent[] = [
  {
    id: "e1",
    title: "Soiree karaoke ce soir 21h!",
    creator: "Marie",
    creatorAvatar: "https://randomuser.me/api/portraits/women/1.jpg",
    mode: "night-owl",
    lat: 48.8654,
    lng: 2.3792,
    venue: "Le Karaokelub",
    arrondissement: "11e",
    time: "21h00",
    datetime: todayAt(21, 0),
    maxAttendees: 8,
    currentAttendees: 5,
    description: "On chante faux mais on s'amuse bien ! Venez comme vous etes.",
    tags: ["Karaoke", "Ambiance", "Bar"],
    attendees: [
      { id: "a1", name: "Marie", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
      { id: "a2", name: "Lucas", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
      { id: "a3", name: "Chloe", avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
      { id: "a4", name: "Thomas", avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
      { id: "a5", name: "Ines", avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
    ],
    messages: [
      { id: "m1", userId: "a1", userName: "Marie", userAvatar: "https://randomuser.me/api/portraits/women/1.jpg", text: "J'ai reserve la salle VIP!", time: "20:12" },
      { id: "m2", userId: "a2", userName: "Lucas", userAvatar: "https://randomuser.me/api/portraits/men/2.jpg", text: "Trop bien! Je ramene des snacks", time: "20:18" },
      { id: "m3", userId: "a3", userName: "Chloe", userAvatar: "https://randomuser.me/api/portraits/women/3.jpg", text: "Qui connait les paroles de Stromae? Pas moi en tout cas", time: "20:25" },
    ],
  },
  {
    id: "e2",
    title: "Running nocturne 5km",
    creator: "Lucas",
    creatorAvatar: "https://randomuser.me/api/portraits/men/2.jpg",
    mode: "fit-date",
    lat: 48.8566,
    lng: 2.3522,
    venue: "Jardin des Tuileries",
    arrondissement: "1er",
    time: "21h00",
    datetime: todayAt(21, 0),
    maxAttendees: 12,
    currentAttendees: 7,
    description: "5km relax le long de la Seine. Tous niveaux bienvenus!",
    tags: ["Sport", "Tous niveaux", "Gratuit"],
    attendees: [
      { id: "a6", name: "Lucas", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
      { id: "a7", name: "Axel", avatar: "https://randomuser.me/api/portraits/men/39.jpg" },
      { id: "a8", name: "Hugo", avatar: "https://randomuser.me/api/portraits/men/41.jpg" },
      { id: "a9", name: "Lea", avatar: "https://randomuser.me/api/portraits/women/42.jpg" },
      { id: "a10", name: "Priya", avatar: "https://randomuser.me/api/portraits/women/64.jpg" },
      { id: "a11", name: "Emma", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
      { id: "a12", name: "Noah", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
    ],
    messages: [
      { id: "m4", userId: "a6", userName: "Lucas", userAvatar: "https://randomuser.me/api/portraits/men/2.jpg", text: "RDV a l'entree cote Concorde", time: "20:30" },
    ],
  },
  {
    id: "e3",
    title: "Echange franco-japonais",
    creator: "Yuki",
    creatorAvatar: "https://randomuser.me/api/portraits/women/3.jpg",
    mode: "langue",
    lat: 48.853,
    lng: 2.3328,
    venue: "Cafe de Flore",
    arrondissement: "6e",
    time: "19h00",
    datetime: todayAt(19, 0),
    maxAttendees: 6,
    currentAttendees: 3,
    description: "Echange linguistique decontracte autour d'un cafe",
    tags: ["Langues", "Japonais", "Cafe"],
    attendees: [
      { id: "a13", name: "Yuki", avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
      { id: "a14", name: "Pierre", avatar: "https://randomuser.me/api/portraits/men/46.jpg" },
      { id: "a15", name: "Sakura", avatar: "https://randomuser.me/api/portraits/women/47.jpg" },
    ],
    messages: [],
  },
  {
    id: "e4",
    title: "Degustation ramen entre foodies",
    creator: "Thomas",
    creatorAvatar: "https://randomuser.me/api/portraits/men/4.jpg",
    mode: "foodie-quest",
    lat: 48.8717,
    lng: 2.3842,
    venue: "Kodawari Ramen",
    arrondissement: "2e",
    time: "19h30",
    datetime: todayAt(19, 30),
    maxAttendees: 4,
    currentAttendees: 2,
    description: "Les meilleurs ramen de Paris, ca vous dit ?",
    tags: ["Food", "Japonais", "Petit groupe"],
    attendees: [
      { id: "a16", name: "Thomas", avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
      { id: "a17", name: "Julie", avatar: "https://randomuser.me/api/portraits/women/48.jpg" },
    ],
    messages: [
      { id: "m5", userId: "a16", userName: "Thomas", userAvatar: "https://randomuser.me/api/portraits/men/4.jpg", text: "J'ai reserve pour 19h30 pile!", time: "18:45" },
    ],
  },
  {
    id: "e5",
    title: "Balade avec nos chiens",
    creator: "Camille",
    creatorAvatar: "https://randomuser.me/api/portraits/women/5.jpg",
    mode: "dog-date",
    lat: 48.8714,
    lng: 2.3652,
    venue: "Canal Saint-Martin",
    arrondissement: "10e",
    time: "18h00",
    datetime: todayAt(18, 0),
    maxAttendees: 10,
    currentAttendees: 4,
    description: "Balade tranquille au bord du canal avec nos toutous",
    tags: ["Chiens", "Nature", "Gratuit"],
    attendees: [
      { id: "a18", name: "Camille", avatar: "https://randomuser.me/api/portraits/women/5.jpg" },
      { id: "a19", name: "Romain", avatar: "https://randomuser.me/api/portraits/men/49.jpg" },
      { id: "a20", name: "Elise", avatar: "https://randomuser.me/api/portraits/women/50.jpg" },
      { id: "a21", name: "Maxime", avatar: "https://randomuser.me/api/portraits/men/51.jpg" },
    ],
    messages: [],
  },
  {
    id: "e6",
    title: "Expo photo + DJ set",
    creator: "Alex",
    creatorAvatar: "https://randomuser.me/api/portraits/men/6.jpg",
    mode: "culture-club",
    lat: 48.8867,
    lng: 2.3431,
    venue: "Galerie Montmartre",
    arrondissement: "18e",
    time: "20h00",
    datetime: todayAt(20, 0),
    maxAttendees: 0,
    currentAttendees: 9,
    description: "Vernissage gratuit + DJ set. Venez nombreux!",
    tags: ["Art", "Photo", "Gratuit"],
    attendees: [
      { id: "a22", name: "Alex", avatar: "https://randomuser.me/api/portraits/men/6.jpg" },
      { id: "a23", name: "Sofia", avatar: "https://randomuser.me/api/portraits/women/52.jpg" },
      { id: "a24", name: "Nathan", avatar: "https://randomuser.me/api/portraits/men/53.jpg" },
      { id: "a25", name: "Lea", avatar: "https://randomuser.me/api/portraits/women/54.jpg" },
    ],
    messages: [
      { id: "m6", userId: "a22", userName: "Alex", userAvatar: "https://randomuser.me/api/portraits/men/6.jpg", text: "Le DJ commence a 21h!", time: "19:30" },
    ],
  },
  {
    id: "e7",
    title: "Soiree board games & bieres",
    creator: "Marc",
    creatorAvatar: "https://randomuser.me/api/portraits/men/7.jpg",
    mode: "gamer-night",
    lat: 48.8622,
    lng: 2.3702,
    venue: "Le Dernier Bar avant la Fin du Monde",
    arrondissement: "4e",
    time: "20h30",
    datetime: todayAt(20, 30),
    maxAttendees: 8,
    currentAttendees: 6,
    description: "Catan, Codenames, 7 Wonders... Debutants bienvenus!",
    tags: ["Jeux", "Board Games", "Bar"],
    attendees: [
      { id: "a26", name: "Marc", avatar: "https://randomuser.me/api/portraits/men/7.jpg" },
      { id: "a27", name: "Amira", avatar: "https://randomuser.me/api/portraits/women/55.jpg" },
      { id: "a28", name: "Leo", avatar: "https://randomuser.me/api/portraits/men/56.jpg" },
      { id: "a29", name: "Clara", avatar: "https://randomuser.me/api/portraits/women/57.jpg" },
      { id: "a30", name: "Damien", avatar: "https://randomuser.me/api/portraits/men/58.jpg" },
      { id: "a31", name: "Nina", avatar: "https://randomuser.me/api/portraits/women/59.jpg" },
    ],
    messages: [
      { id: "m7", userId: "a26", userName: "Marc", userAvatar: "https://randomuser.me/api/portraits/men/7.jpg", text: "J'amene Catan et Codenames!", time: "19:00" },
      { id: "m8", userId: "a27", userName: "Amira", userAvatar: "https://randomuser.me/api/portraits/women/55.jpg", text: "Super! J'ai 7 Wonders aussi", time: "19:15" },
    ],
  },
  {
    id: "e8",
    title: "Mocktails & conversation",
    creator: "Sarah",
    creatorAvatar: "https://randomuser.me/api/portraits/women/8.jpg",
    mode: "sober-tonight",
    lat: 48.8494,
    lng: 2.3560,
    venue: "Le Paon qui Boit",
    arrondissement: "5e",
    time: "19h00",
    datetime: todayAt(19, 0),
    maxAttendees: 6,
    currentAttendees: 2,
    description: "Soiree 100% sans alcool, 100% bonne ambiance",
    tags: ["Mocktails", "Sans alcool", "Detente"],
    attendees: [
      { id: "a32", name: "Sarah", avatar: "https://randomuser.me/api/portraits/women/8.jpg" },
      { id: "a33", name: "Kevin", avatar: "https://randomuser.me/api/portraits/men/60.jpg" },
    ],
    messages: [],
  },
];

export const PARIS_ARRONDISSEMENTS = [
  "1er", "2e", "3e", "4e", "5e", "6e", "7e", "8e", "9e", "10e",
  "11e", "12e", "13e", "14e", "15e", "16e", "17e", "18e", "19e", "20e",
];

export const TIME_SLOTS = [
  "19h00", "19h30", "20h00", "20h30", "21h00", "21h30",
  "22h00", "22h30", "23h00", "23h30", "00h00", "00h30",
  "01h00", "01h30", "02h00",
];

export const MAX_ATTENDEES_OPTIONS = [2, 4, 6, 8, 10, 0] as const;

export function getMaxAttendeesLabel(n: number): string {
  return n === 0 ? "Illimite" : `${n} max`;
}

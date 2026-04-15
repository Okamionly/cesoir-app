export interface PopUpEvent {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  mode: string;
  lat: number;
  lng: number;
  venue: string;
  time: string;
  maxAttendees: number;
  currentAttendees: number;
  description: string;
  tags: string[];
}

export const MOCK_EVENTS: PopUpEvent[] = [
  {
    id: "e1",
    title: "Soiree jeux de societe",
    creator: "Marie",
    creatorAvatar: "https://randomuser.me/api/portraits/women/1.jpg",
    mode: "Gamer Night",
    lat: 48.8654,
    lng: 2.3792,
    venue: "Le Comptoir des Jeux",
    time: "20h30",
    maxAttendees: 8,
    currentAttendees: 5,
    description: "Catan, Codenames et bonne ambiance !",
    tags: ["Jeux", "Debutants bienvenus", "Bar"],
  },
  {
    id: "e2",
    title: "Running nocturne",
    creator: "Lucas",
    creatorAvatar: "https://randomuser.me/api/portraits/men/2.jpg",
    mode: "Fit Date",
    lat: 48.8566,
    lng: 2.3522,
    venue: "Jardin des Tuileries",
    time: "21h00",
    maxAttendees: 12,
    currentAttendees: 7,
    description: "5km relax le long de la Seine",
    tags: ["Sport", "Tous niveaux", "Gratuit"],
  },
  {
    id: "e3",
    title: "Conversation franco-japonais",
    creator: "Yuki",
    creatorAvatar: "https://randomuser.me/api/portraits/women/3.jpg",
    mode: "Langue Exchange",
    lat: 48.853,
    lng: 2.3328,
    venue: "Cafe de Flore",
    time: "19h00",
    maxAttendees: 6,
    currentAttendees: 3,
    description: "Echange linguistique decontracte autour d'un cafe",
    tags: ["Langues", "Japonais", "Cafe"],
  },
  {
    id: "e4",
    title: "Degustation de ramen",
    creator: "Thomas",
    creatorAvatar: "https://randomuser.me/api/portraits/men/4.jpg",
    mode: "Foodie Quest",
    lat: 48.8717,
    lng: 2.3842,
    venue: "Kodawari Ramen",
    time: "19h30",
    maxAttendees: 4,
    currentAttendees: 2,
    description: "Les meilleurs ramen de Paris, ca vous dit ?",
    tags: ["Food", "Japonais", "Petit groupe"],
  },
  {
    id: "e5",
    title: "Balade avec nos chiens",
    creator: "Camille",
    creatorAvatar: "https://randomuser.me/api/portraits/women/5.jpg",
    mode: "Dog Date",
    lat: 48.8714,
    lng: 2.3652,
    venue: "Canal Saint-Martin",
    time: "18h00",
    maxAttendees: 10,
    currentAttendees: 4,
    description: "Balade tranquille au bord du canal",
    tags: ["Chiens", "Nature", "Gratuit"],
  },
  {
    id: "e6",
    title: "Expo photo de nuit",
    creator: "Alex",
    creatorAvatar: "https://randomuser.me/api/portraits/men/6.jpg",
    mode: "Culture Club",
    lat: 48.8867,
    lng: 2.3431,
    venue: "Galerie Montmartre",
    time: "20h00",
    maxAttendees: 15,
    currentAttendees: 9,
    description: "Vernissage gratuit + DJ set",
    tags: ["Art", "Photo", "Gratuit"],
  },
];

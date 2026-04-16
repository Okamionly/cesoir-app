"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------- Types ----------

export type SoireeType =
  | "diner"
  | "bar"
  | "jeux"
  | "pique-nique"
  | "cinema"
  | "degustation"
  | "karaoke"
  | "mystere";

export type DressCode = "casual" | "smart-casual" | "chic" | "costume";
export type Ambiance = "chill" | "energique" | "romantique" | "festive" | "intime" | "decouverte";
export type BudgetRange = "gratuit" | "<10" | "10-20" | "20-50" | "50+";
export type BringWhat = "boisson" | "manger" | "rien";
export type AttendeeStatus = "confirmed" | "pending" | "declined";

export interface SoireeAttendee {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  status: AttendeeStatus;
  joinedAt: string;
}

export interface SoireeMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Soiree {
  id: string;
  type: SoireeType;
  title: string;
  description: string;
  date: string;
  time: string;
  datetime: string;
  venue: string;
  arrondissement: string;
  isAtHome: boolean;
  maxPlaces: number;
  currentAttendees: number;
  budget: BudgetRange;
  dressCode: DressCode;
  ambiance: Ambiance;
  bringWhat: BringWhat[];
  photos: string[];
  isPrivate: boolean;
  inviteCode: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorVerified: boolean;
  creatorTrustScore: number;
  attendees: SoireeAttendee[];
  tags: string[];
  createdAt: string;
}

export interface CreateSoireeData {
  type: SoireeType;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  arrondissement: string;
  isAtHome: boolean;
  maxPlaces: number;
  budget: BudgetRange;
  dressCode: DressCode;
  ambiance: Ambiance;
  bringWhat: BringWhat[];
  photos: string[];
  isPrivate: boolean;
}

// ---------- Type Meta ----------

export const SOIREE_TYPES: { key: SoireeType; label: string; emoji: string; description: string }[] = [
  { key: "diner", label: "Diner chez moi", emoji: "\uD83C\uDF7D\uFE0F", description: "Accueillez chez vous" },
  { key: "bar", label: "Sortie bar", emoji: "\uD83C\uDF78", description: "Tournee des bars" },
  { key: "jeux", label: "Soiree jeux", emoji: "\uD83C\uDFAE", description: "Jeux de societe" },
  { key: "pique-nique", label: "Pique-nique", emoji: "\uD83E\uDDFA", description: "En plein air" },
  { key: "cinema", label: "Soiree cinema", emoji: "\uD83C\uDFAC", description: "Film entre amis" },
  { key: "degustation", label: "Degustation", emoji: "\uD83C\uDF77", description: "Vins & saveurs" },
  { key: "karaoke", label: "Karaoke night", emoji: "\uD83C\uDFA4", description: "On chante!" },
  { key: "mystere", label: "Soiree mystere", emoji: "\uD83C\uDFAD", description: "Surprise totale" },
];

export const DRESS_CODES: { key: DressCode; label: string }[] = [
  { key: "casual", label: "Casual" },
  { key: "smart-casual", label: "Smart casual" },
  { key: "chic", label: "Chic" },
  { key: "costume", label: "Costume" },
];

export const AMBIANCES: { key: Ambiance; label: string; emoji: string }[] = [
  { key: "chill", label: "Chill", emoji: "\uD83C\uDF3F" },
  { key: "energique", label: "Energique", emoji: "\u26A1" },
  { key: "romantique", label: "Romantique", emoji: "\uD83D\uDD6F\uFE0F" },
  { key: "festive", label: "Festive", emoji: "\uD83C\uDF89" },
  { key: "intime", label: "Intime", emoji: "\uD83E\uDEF6" },
  { key: "decouverte", label: "Decouverte", emoji: "\uD83E\uDDED" },
];

export const BUDGET_OPTIONS: { key: BudgetRange; label: string }[] = [
  { key: "gratuit", label: "Gratuit" },
  { key: "<10", label: "< 10\u20AC" },
  { key: "10-20", label: "10-20\u20AC" },
  { key: "20-50", label: "20-50\u20AC" },
  { key: "50+", label: "50\u20AC+" },
];

export const BRING_OPTIONS: { key: BringWhat; label: string; emoji: string }[] = [
  { key: "boisson", label: "Ramener a boire", emoji: "\uD83C\uDF7B" },
  { key: "manger", label: "Ramener a manger", emoji: "\uD83C\uDF55" },
  { key: "rien", label: "Rien", emoji: "\u2728" },
];

// ---------- Helpers ----------

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function todayAt(hour: number, min = 0): string {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function tomorrowAt(hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

// ---------- Mock Soirees ----------

export const MOCK_SOIREES: Soiree[] = [
  {
    id: "s1",
    type: "diner",
    title: "Pasta party chez Marie",
    description: "Je prepare mes fameuses tagliatelles maison + tiramisu. Ramenez du vin!",
    date: "Ce soir",
    time: "20h00",
    datetime: todayAt(20, 0),
    venue: "Chez Marie",
    arrondissement: "11e",
    isAtHome: true,
    maxPlaces: 6,
    currentAttendees: 4,
    budget: "10-20",
    dressCode: "casual",
    ambiance: "intime",
    bringWhat: ["boisson"],
    photos: [],
    isPrivate: false,
    inviteCode: "PASTA6",
    creatorId: "u1",
    creatorName: "Marie",
    creatorAvatar: "https://randomuser.me/api/portraits/women/1.jpg",
    creatorVerified: true,
    creatorTrustScore: 92,
    attendees: [
      { id: "sa1", userId: "u1", name: "Marie", avatar: "https://randomuser.me/api/portraits/women/1.jpg", status: "confirmed", joinedAt: todayAt(14) },
      { id: "sa2", userId: "u2", name: "Lucas", avatar: "https://randomuser.me/api/portraits/men/2.jpg", status: "confirmed", joinedAt: todayAt(15) },
      { id: "sa3", userId: "u3", name: "Chloe", avatar: "https://randomuser.me/api/portraits/women/3.jpg", status: "confirmed", joinedAt: todayAt(15, 30) },
      { id: "sa4", userId: "u4", name: "Thomas", avatar: "https://randomuser.me/api/portraits/men/4.jpg", status: "pending", joinedAt: todayAt(16) },
    ],
    tags: ["Cuisine", "Italien", "Maison"],
    createdAt: todayAt(12),
  },
  {
    id: "s2",
    type: "bar",
    title: "Tournee Oberkampf",
    description: "On explore 3 bars du quartier. Premier arret: Le Mecano Bar a 21h.",
    date: "Ce soir",
    time: "21h00",
    datetime: todayAt(21, 0),
    venue: "Le Mecano Bar",
    arrondissement: "11e",
    isAtHome: false,
    maxPlaces: 10,
    currentAttendees: 7,
    budget: "20-50",
    dressCode: "smart-casual",
    ambiance: "energique",
    bringWhat: ["rien"],
    photos: [],
    isPrivate: false,
    inviteCode: "OBRKPF",
    creatorId: "u5",
    creatorName: "Alex",
    creatorAvatar: "https://randomuser.me/api/portraits/men/6.jpg",
    creatorVerified: true,
    creatorTrustScore: 88,
    attendees: [
      { id: "sa5", userId: "u5", name: "Alex", avatar: "https://randomuser.me/api/portraits/men/6.jpg", status: "confirmed", joinedAt: todayAt(13) },
      { id: "sa6", userId: "u6", name: "Sofia", avatar: "https://randomuser.me/api/portraits/women/52.jpg", status: "confirmed", joinedAt: todayAt(14) },
      { id: "sa7", userId: "u7", name: "Nathan", avatar: "https://randomuser.me/api/portraits/men/53.jpg", status: "confirmed", joinedAt: todayAt(14, 30) },
      { id: "sa8", userId: "u8", name: "Lea", avatar: "https://randomuser.me/api/portraits/women/54.jpg", status: "confirmed", joinedAt: todayAt(15) },
      { id: "sa9", userId: "u9", name: "Hugo", avatar: "https://randomuser.me/api/portraits/men/41.jpg", status: "confirmed", joinedAt: todayAt(15, 30) },
      { id: "sa10", userId: "u10", name: "Emma", avatar: "https://randomuser.me/api/portraits/women/44.jpg", status: "confirmed", joinedAt: todayAt(16) },
      { id: "sa11", userId: "u11", name: "Noah", avatar: "https://randomuser.me/api/portraits/men/45.jpg", status: "pending", joinedAt: todayAt(16, 30) },
    ],
    tags: ["Bars", "Oberkampf", "Sortie"],
    createdAt: todayAt(10),
  },
  {
    id: "s3",
    type: "jeux",
    title: "Board games & bieres artisanales",
    description: "Catan, Codenames, 7 Wonders... Debutants bienvenus! J'amene tout le matos.",
    date: "Ce soir",
    time: "20h30",
    datetime: todayAt(20, 30),
    venue: "Le Dernier Bar",
    arrondissement: "4e",
    isAtHome: false,
    maxPlaces: 8,
    currentAttendees: 5,
    budget: "<10",
    dressCode: "casual",
    ambiance: "chill",
    bringWhat: ["rien"],
    photos: [],
    isPrivate: false,
    inviteCode: "GAMES8",
    creatorId: "u12",
    creatorName: "Marc",
    creatorAvatar: "https://randomuser.me/api/portraits/men/7.jpg",
    creatorVerified: true,
    creatorTrustScore: 95,
    attendees: [
      { id: "sa12", userId: "u12", name: "Marc", avatar: "https://randomuser.me/api/portraits/men/7.jpg", status: "confirmed", joinedAt: todayAt(12) },
      { id: "sa13", userId: "u13", name: "Amira", avatar: "https://randomuser.me/api/portraits/women/55.jpg", status: "confirmed", joinedAt: todayAt(13) },
      { id: "sa14", userId: "u14", name: "Leo", avatar: "https://randomuser.me/api/portraits/men/56.jpg", status: "confirmed", joinedAt: todayAt(14) },
      { id: "sa15", userId: "u15", name: "Clara", avatar: "https://randomuser.me/api/portraits/women/57.jpg", status: "confirmed", joinedAt: todayAt(14, 30) },
      { id: "sa16", userId: "u16", name: "Damien", avatar: "https://randomuser.me/api/portraits/men/58.jpg", status: "confirmed", joinedAt: todayAt(15) },
    ],
    tags: ["Jeux", "Board Games", "Detente"],
    createdAt: todayAt(11),
  },
  {
    id: "s4",
    type: "karaoke",
    title: "Karaoke 90s-2000s",
    description: "On chante du Britney au Stromae. Aucun talent requis, juste du courage!",
    date: "Ce soir",
    time: "22h00",
    datetime: todayAt(22, 0),
    venue: "Neko Karaoke",
    arrondissement: "9e",
    isAtHome: false,
    maxPlaces: 12,
    currentAttendees: 3,
    budget: "10-20",
    dressCode: "casual",
    ambiance: "festive",
    bringWhat: ["rien"],
    photos: [],
    isPrivate: false,
    inviteCode: "SING90",
    creatorId: "u17",
    creatorName: "Ines",
    creatorAvatar: "https://randomuser.me/api/portraits/women/5.jpg",
    creatorVerified: false,
    creatorTrustScore: 78,
    attendees: [
      { id: "sa17", userId: "u17", name: "Ines", avatar: "https://randomuser.me/api/portraits/women/5.jpg", status: "confirmed", joinedAt: todayAt(16) },
      { id: "sa18", userId: "u18", name: "Romain", avatar: "https://randomuser.me/api/portraits/men/49.jpg", status: "confirmed", joinedAt: todayAt(17) },
      { id: "sa19", userId: "u19", name: "Elise", avatar: "https://randomuser.me/api/portraits/women/50.jpg", status: "confirmed", joinedAt: todayAt(17, 30) },
    ],
    tags: ["Karaoke", "Musique", "Fun"],
    createdAt: todayAt(14),
  },
  {
    id: "s5",
    type: "degustation",
    title: "Degustation vins naturels",
    description: "5 vins a decouvrir dans une cave secrete du Marais. Places limitees!",
    date: "Demain",
    time: "19h30",
    datetime: tomorrowAt(19, 30),
    venue: "Cave du Marais",
    arrondissement: "3e",
    isAtHome: false,
    maxPlaces: 8,
    currentAttendees: 6,
    budget: "20-50",
    dressCode: "smart-casual",
    ambiance: "decouverte",
    bringWhat: ["rien"],
    photos: [],
    isPrivate: true,
    inviteCode: "VINO8X",
    creatorId: "u20",
    creatorName: "Camille",
    creatorAvatar: "https://randomuser.me/api/portraits/women/60.jpg",
    creatorVerified: true,
    creatorTrustScore: 96,
    attendees: [
      { id: "sa20", userId: "u20", name: "Camille", avatar: "https://randomuser.me/api/portraits/women/60.jpg", status: "confirmed", joinedAt: todayAt(10) },
      { id: "sa21", userId: "u21", name: "Pierre", avatar: "https://randomuser.me/api/portraits/men/46.jpg", status: "confirmed", joinedAt: todayAt(11) },
      { id: "sa22", userId: "u22", name: "Sakura", avatar: "https://randomuser.me/api/portraits/women/47.jpg", status: "confirmed", joinedAt: todayAt(12) },
      { id: "sa23", userId: "u23", name: "Julien", avatar: "https://randomuser.me/api/portraits/men/48.jpg", status: "confirmed", joinedAt: todayAt(13) },
      { id: "sa24", userId: "u24", name: "Anna", avatar: "https://randomuser.me/api/portraits/women/61.jpg", status: "confirmed", joinedAt: todayAt(14) },
      { id: "sa25", userId: "u25", name: "Kevin", avatar: "https://randomuser.me/api/portraits/men/60.jpg", status: "pending", joinedAt: todayAt(15) },
    ],
    tags: ["Vin", "Degustation", "Marais"],
    createdAt: todayAt(9),
  },
  {
    id: "s6",
    type: "mystere",
    title: "Soiree ???",
    description: "Vous ne saurez rien avant d'arriver. Faites confiance. RDV metro Republique.",
    date: "Ce soir",
    time: "21h00",
    datetime: todayAt(21, 0),
    venue: "Metro Republique (sortie 3)",
    arrondissement: "10e",
    isAtHome: false,
    maxPlaces: 8,
    currentAttendees: 8,
    budget: "<10",
    dressCode: "casual",
    ambiance: "decouverte",
    bringWhat: ["rien"],
    photos: [],
    isPrivate: false,
    inviteCode: "MYST3R",
    creatorId: "u26",
    creatorName: "Maxime",
    creatorAvatar: "https://randomuser.me/api/portraits/men/51.jpg",
    creatorVerified: true,
    creatorTrustScore: 90,
    attendees: [
      { id: "sa26", userId: "u26", name: "Maxime", avatar: "https://randomuser.me/api/portraits/men/51.jpg", status: "confirmed", joinedAt: todayAt(11) },
      { id: "sa27", userId: "u27", name: "Nina", avatar: "https://randomuser.me/api/portraits/women/59.jpg", status: "confirmed", joinedAt: todayAt(12) },
      { id: "sa28", userId: "u28", name: "Damien", avatar: "https://randomuser.me/api/portraits/men/58.jpg", status: "confirmed", joinedAt: todayAt(12, 30) },
      { id: "sa29", userId: "u29", name: "Julie", avatar: "https://randomuser.me/api/portraits/women/48.jpg", status: "confirmed", joinedAt: todayAt(13) },
      { id: "sa30", userId: "u30", name: "Axel", avatar: "https://randomuser.me/api/portraits/men/39.jpg", status: "confirmed", joinedAt: todayAt(13, 30) },
      { id: "sa31", userId: "u31", name: "Priya", avatar: "https://randomuser.me/api/portraits/women/64.jpg", status: "confirmed", joinedAt: todayAt(14) },
      { id: "sa32", userId: "u32", name: "Lea", avatar: "https://randomuser.me/api/portraits/women/42.jpg", status: "confirmed", joinedAt: todayAt(14, 30) },
      { id: "sa33", userId: "u33", name: "Hugo", avatar: "https://randomuser.me/api/portraits/men/41.jpg", status: "confirmed", joinedAt: todayAt(15) },
    ],
    tags: ["Mystere", "Aventure", "Surprise"],
    createdAt: todayAt(10),
  },
  {
    id: "s7",
    type: "pique-nique",
    title: "Pique-nique au Canal",
    description: "Chacun ramene un truc. Couvertures, jeux, musique. Ambiance relax.",
    date: "Demain",
    time: "18h00",
    datetime: tomorrowAt(18, 0),
    venue: "Canal Saint-Martin",
    arrondissement: "10e",
    isAtHome: false,
    maxPlaces: 20,
    currentAttendees: 9,
    budget: "gratuit",
    dressCode: "casual",
    ambiance: "chill",
    bringWhat: ["boisson", "manger"],
    photos: [],
    isPrivate: false,
    inviteCode: "PKNK20",
    creatorId: "u34",
    creatorName: "Sarah",
    creatorAvatar: "https://randomuser.me/api/portraits/women/8.jpg",
    creatorVerified: true,
    creatorTrustScore: 85,
    attendees: [
      { id: "sa34", userId: "u34", name: "Sarah", avatar: "https://randomuser.me/api/portraits/women/8.jpg", status: "confirmed", joinedAt: todayAt(9) },
      { id: "sa35", userId: "u35", name: "Kevin", avatar: "https://randomuser.me/api/portraits/men/60.jpg", status: "confirmed", joinedAt: todayAt(10) },
      { id: "sa36", userId: "u36", name: "Amira", avatar: "https://randomuser.me/api/portraits/women/55.jpg", status: "confirmed", joinedAt: todayAt(10, 30) },
    ],
    tags: ["Plein air", "Gratuit", "Canal"],
    createdAt: todayAt(8),
  },
  {
    id: "s8",
    type: "cinema",
    title: "Cinema en plein air",
    description: "Projection du film 'Amelie Poulain' sur grand ecran au parc. Plaids bienvenus!",
    date: "Demain",
    time: "21h30",
    datetime: tomorrowAt(21, 30),
    venue: "Parc de la Villette",
    arrondissement: "19e",
    isAtHome: false,
    maxPlaces: 15,
    currentAttendees: 4,
    budget: "gratuit",
    dressCode: "casual",
    ambiance: "romantique",
    bringWhat: ["boisson", "manger"],
    photos: [],
    isPrivate: false,
    inviteCode: "CINE15",
    creatorId: "u37",
    creatorName: "Pierre",
    creatorAvatar: "https://randomuser.me/api/portraits/men/46.jpg",
    creatorVerified: false,
    creatorTrustScore: 72,
    attendees: [
      { id: "sa37", userId: "u37", name: "Pierre", avatar: "https://randomuser.me/api/portraits/men/46.jpg", status: "confirmed", joinedAt: todayAt(11) },
      { id: "sa38", userId: "u38", name: "Sakura", avatar: "https://randomuser.me/api/portraits/women/47.jpg", status: "confirmed", joinedAt: todayAt(12) },
      { id: "sa39", userId: "u39", name: "Clara", avatar: "https://randomuser.me/api/portraits/women/57.jpg", status: "confirmed", joinedAt: todayAt(13) },
      { id: "sa40", userId: "u40", name: "Leo", avatar: "https://randomuser.me/api/portraits/men/56.jpg", status: "pending", joinedAt: todayAt(14) },
    ],
    tags: ["Cinema", "Plein air", "Gratuit"],
    createdAt: todayAt(10),
  },
];

// ---------- Mock Chat Messages ----------

const MOCK_CHAT: Record<string, SoireeMessage[]> = {
  s1: [
    { id: "m1", userId: "u1", userName: "Marie", userAvatar: "https://randomuser.me/api/portraits/women/1.jpg", content: "J'ai commence a preparer la sauce!", createdAt: todayAt(16) },
    { id: "m2", userId: "u2", userName: "Lucas", userAvatar: "https://randomuser.me/api/portraits/men/2.jpg", content: "Je ramene un Chianti", createdAt: todayAt(16, 30) },
    { id: "m3", userId: "u3", userName: "Chloe", userAvatar: "https://randomuser.me/api/portraits/women/3.jpg", content: "Haaate j'ai trop faim deja", createdAt: todayAt(17) },
  ],
  s2: [
    { id: "m4", userId: "u5", userName: "Alex", userAvatar: "https://randomuser.me/api/portraits/men/6.jpg", content: "Premier bar confirme: Le Mecano! RDV devant a 21h", createdAt: todayAt(15) },
    { id: "m5", userId: "u6", userName: "Sofia", userAvatar: "https://randomuser.me/api/portraits/women/52.jpg", content: "On sera la! On vient a 3 du bureau", createdAt: todayAt(15, 30) },
  ],
  s3: [
    { id: "m6", userId: "u12", userName: "Marc", userAvatar: "https://randomuser.me/api/portraits/men/7.jpg", content: "J'amene Catan et Codenames!", createdAt: todayAt(14) },
    { id: "m7", userId: "u13", userName: "Amira", userAvatar: "https://randomuser.me/api/portraits/women/55.jpg", content: "Super! J'ai 7 Wonders aussi", createdAt: todayAt(14, 30) },
    { id: "m8", userId: "u14", userName: "Leo", userAvatar: "https://randomuser.me/api/portraits/men/56.jpg", content: "Qui sait jouer a Terraforming Mars?", createdAt: todayAt(15) },
  ],
};

// ---------- Hook ----------

export function useSoiree(soireeId?: string) {
  const [soirees, setSoirees] = useState<Soiree[]>(MOCK_SOIREES);
  const [soiree, setSoiree] = useState<Soiree | null>(null);
  const [chat, setChat] = useState<SoireeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load a specific soiree
  useEffect(() => {
    if (!soireeId) {
      setLoading(false);
      return;
    }
    const found = MOCK_SOIREES.find((s) => s.id === soireeId) ?? null;
    setSoiree(found);
    setChat(MOCK_CHAT[soireeId] ?? []);
    setLoading(false);

    // Subscribe to realtime for chat (when Supabase is live)
    const channel = supabase.channel(`soiree-chat-${soireeId}`);
    channelRef.current = channel;
    channel
      .on("broadcast", { event: "message" }, (payload: { payload: SoireeMessage }) => {
        setChat((prev) => [...prev, payload.payload]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [soireeId]);

  // Create a soiree
  const createSoiree = useCallback(async (data: CreateSoireeData): Promise<Soiree> => {
    const now = new Date().toISOString();
    const inviteCode = generateInviteCode();
    const newSoiree: Soiree = {
      id: `s-${Date.now()}`,
      ...data,
      datetime: `${data.date}T${data.time}`,
      currentAttendees: 1,
      inviteCode,
      creatorId: "current-user",
      creatorName: "Vous",
      creatorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
      creatorVerified: true,
      creatorTrustScore: 88,
      attendees: [
        {
          id: `sa-${Date.now()}`,
          userId: "current-user",
          name: "Vous",
          avatar: "https://randomuser.me/api/portraits/men/32.jpg",
          status: "confirmed",
          joinedAt: now,
        },
      ],
      tags: [],
      createdAt: now,
    };
    setSoirees((prev) => [newSoiree, ...prev]);
    return newSoiree;
  }, []);

  // Join a soiree (public)
  const joinSoiree = useCallback(async (id: string) => {
    setSoirees((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              currentAttendees: s.currentAttendees + 1,
              attendees: [
                ...s.attendees,
                {
                  id: `sa-${Date.now()}`,
                  userId: "current-user",
                  name: "Vous",
                  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                  status: "confirmed",
                  joinedAt: new Date().toISOString(),
                },
              ],
            }
          : s,
      ),
    );
    if (soiree?.id === id) {
      setSoiree((prev) =>
        prev
          ? {
              ...prev,
              currentAttendees: prev.currentAttendees + 1,
              attendees: [
                ...prev.attendees,
                {
                  id: `sa-${Date.now()}`,
                  userId: "current-user",
                  name: "Vous",
                  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                  status: "confirmed",
                  joinedAt: new Date().toISOString(),
                },
              ],
            }
          : null,
      );
    }
  }, [soiree]);

  // Request to join (private)
  const requestJoin = useCallback(async (id: string) => {
    setSoirees((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              attendees: [
                ...s.attendees,
                {
                  id: `sa-${Date.now()}`,
                  userId: "current-user",
                  name: "Vous",
                  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                  status: "pending",
                  joinedAt: new Date().toISOString(),
                },
              ],
            }
          : s,
      ),
    );
  }, []);

  // Accept a pending request (host only)
  const acceptRequest = useCallback(async (eventId: string, userId: string) => {
    const update = (s: Soiree) =>
      s.id === eventId
        ? {
            ...s,
            currentAttendees: s.currentAttendees + 1,
            attendees: s.attendees.map((a) => (a.userId === userId ? { ...a, status: "confirmed" as const } : a)),
          }
        : s;
    setSoirees((prev) => prev.map(update));
    setSoiree((prev) => (prev ? update(prev) : null));
  }, []);

  // Leave a soiree
  const leaveSoiree = useCallback(async (id: string) => {
    const update = (s: Soiree) =>
      s.id === id
        ? {
            ...s,
            currentAttendees: Math.max(0, s.currentAttendees - 1),
            attendees: s.attendees.filter((a) => a.userId !== "current-user"),
          }
        : s;
    setSoirees((prev) => prev.map(update));
    setSoiree((prev) => (prev ? update(prev) : null));
  }, []);

  // Cancel soiree (host)
  const cancelSoiree = useCallback(async (id: string) => {
    setSoirees((prev) => prev.filter((s) => s.id !== id));
    if (soiree?.id === id) setSoiree(null);
  }, [soiree]);

  // Send chat message
  const sendSoireeMessage = useCallback(async (id: string, content: string) => {
    const msg: SoireeMessage = {
      id: `m-${Date.now()}`,
      userId: "current-user",
      userName: "Vous",
      userAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
      content,
      createdAt: new Date().toISOString(),
    };
    setChat((prev) => [...prev, msg]);
    // Broadcast via realtime
    channelRef.current?.send({
      type: "broadcast",
      event: "message",
      payload: msg,
    });
  }, []);

  return {
    soirees,
    soiree,
    chat,
    loading,
    attendees: soiree?.attendees ?? [],
    requests: soiree?.attendees.filter((a) => a.status === "pending") ?? [],
    actions: {
      createSoiree,
      joinSoiree,
      requestJoin,
      acceptRequest,
      leaveSoiree,
      cancelSoiree,
      sendSoireeMessage,
    },
  };
}

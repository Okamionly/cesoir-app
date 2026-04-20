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

/**
 * `MOCK_EVENTS` was removed on 2026-04-20 as part of the mock-data cleanup.
 * Pop-up events are expected to come from the Supabase `events` table
 * (wiring TBD). Downstream consumers fall back gracefully to empty state when
 * no events are available.
 *
 * The types above (`PopUpEvent`, `EventAttendee`, `EventMessage`) and the
 * static registries below (`PARIS_ARRONDISSEMENTS`, `TIME_SLOTS`,
 * `MAX_ATTENDEES_OPTIONS`, `getMaxAttendeesLabel`) are NOT mock data — they
 * are legit static constants used by create-event forms.
 */

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

// ---------- SOS Service ----------
// Backend logic for the existing SOSButton component.

import { supabase } from "./supabase";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const CONTACTS_KEY = "cesoir_sos_contacts";

// ---------- Emergency contacts persistence ----------

export function loadEmergencyContacts(): EmergencyContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    return raw ? (JSON.parse(raw) as EmergencyContact[]) : [];
  } catch {
    return [];
  }
}

export function saveEmergencyContacts(contacts: EmergencyContact[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export function addEmergencyContact(
  contact: Omit<EmergencyContact, "id">,
): EmergencyContact {
  const contacts = loadEmergencyContacts();
  const newContact: EmergencyContact = {
    ...contact,
    id: `sos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  contacts.push(newContact);
  saveEmergencyContacts(contacts);
  return newContact;
}

export function removeEmergencyContact(id: string): void {
  const contacts = loadEmergencyContacts();
  saveEmergencyContacts(contacts.filter((c) => c.id !== id));
}

// ---------- SOS trigger ----------

export interface SOSEvent {
  userId: string;
  lat: number;
  lng: number;
  timestamp: string;
  contactsNotified: number;
  status: "triggered" | "cancelled" | "resolved";
}

/**
 * Triggers the SOS:
 * 1. Logs the event in the database (sos_events table)
 * 2. Sends notifications to emergency contacts
 * 3. Returns the event record
 */
export async function triggerSOS(
  lat: number,
  lng: number,
  userId: string,
): Promise<SOSEvent> {
  const contacts = loadEmergencyContacts();
  const timestamp = new Date().toISOString();

  const event: SOSEvent = {
    userId,
    lat,
    lng,
    timestamp,
    contactsNotified: contacts.length,
    status: "triggered",
  };

  // Log to DB (best-effort, don't block on failure)
  try {
    await supabase.from("sos_events").insert({
      user_id: userId,
      latitude: lat,
      longitude: lng,
      contacts_notified: contacts.length,
      status: "triggered",
      created_at: timestamp,
    });
  } catch (err) {
    console.error("[SOS] DB log failed:", err);
  }

  // Notify each emergency contact
  for (const contact of contacts) {
    await notifyContact(contact, lat, lng, timestamp);
  }

  return event;
}

/**
 * Cancels an active SOS (user pressed cancel before countdown ended).
 */
export async function cancelSOS(userId: string): Promise<void> {
  try {
    await supabase
      .from("sos_events")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "triggered");
  } catch (err) {
    console.error("[SOS] Cancel update failed:", err);
  }
}

// ---------- Internal ----------

async function notifyContact(
  contact: EmergencyContact,
  lat: number,
  lng: number,
  timestamp: string,
): Promise<void> {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const message = [
    `ALERTE SOS CeSoir`,
    `${contact.name}, un(e) ami(e) a declenche une alerte de securite.`,
    `Position: ${mapsUrl}`,
    `Heure: ${new Date(timestamp).toLocaleTimeString("fr-FR")}`,
    `Contactez-le/la immediatement.`,
  ].join("\n");

  // SMS via edge function (best-effort)
  if (contact.phone) {
    try {
      await supabase.functions.invoke("send-sms", {
        body: { to: contact.phone, message },
      });
    } catch {
      console.warn("[SOS] SMS envoi echoue pour", contact.name);
    }
  }

  // Email via edge function (best-effort)
  if (contact.email) {
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: contact.email,
          subject: "ALERTE SOS CeSoir",
          text: message,
        },
      });
    } catch {
      console.warn("[SOS] Email envoi echoue pour", contact.name);
    }
  }
}

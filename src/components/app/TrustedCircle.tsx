"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "@/lib/haptics";
import { TRUST_COLORS } from "@/lib/trust-colors";
import { Plus } from "@/components/ui/lucide";

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  shareLocation: boolean;
  alertNoCheckin: boolean;
  sendItinerary: boolean;
}

const STORAGE_KEY = "cesoir_trusted_circle";
const MAX_CONTACTS = 3;

function loadContacts(): TrustedContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrustedContact[]) : [];
  } catch {
    return [];
  }
}

function saveContacts(contacts: TrustedContact[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch {
    // ignore
  }
}

export default function TrustedCircle() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    setContacts(loadContacts());
  }, []);

  const addContact = useCallback(() => {
    if (!newName.trim() || !newPhone.trim()) return;
    haptics.success();
    const contact: TrustedContact = {
      id: `tc-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      shareLocation: true,
      alertNoCheckin: true,
      sendItinerary: false,
    };
    const updated = [...contacts, contact];
    setContacts(updated);
    saveContacts(updated);
    setNewName("");
    setNewPhone("");
    setAdding(false);
  }, [newName, newPhone, contacts]);

  const removeContact = useCallback(
    (id: string) => {
      haptics.medium();
      const updated = contacts.filter((c) => c.id !== id);
      setContacts(updated);
      saveContacts(updated);
    },
    [contacts],
  );

  const toggleOption = useCallback(
    (id: string, field: "shareLocation" | "alertNoCheckin" | "sendItinerary") => {
      haptics.light();
      const updated = contacts.map((c) =>
        c.id === id ? { ...c, [field]: !c[field] } : c,
      );
      setContacts(updated);
      saveContacts(updated);
    },
    [contacts],
  );

  const emptySlots = MAX_CONTACTS - contacts.length;

  return (
    <div
      className="w-full rounded-2xl p-4"
      style={{ backgroundColor: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}
      role="region"
      aria-label="Cercle de confiance"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          Cercle de confiance
        </h3>
        <span className="text-xs" style={{ color: TRUST_COLORS.trusted }}>
          {contacts.length}/{MAX_CONTACTS}
        </span>
      </div>

      {/* Contact slots */}
      <div className="mb-4 flex justify-center gap-4">
        {contacts.map((contact, i) => (
          <motion.div
            key={contact.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: TRUST_COLORS.trusted }}
              aria-label={contact.name}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <p className="mt-1 max-w-[70px] truncate text-xs" style={{ color: "var(--color-text)" }}>
              {contact.name}
            </p>
          </motion.div>
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => {
              haptics.light();
              setAdding(true);
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ border: "2px dashed rgba(0,0,0,0.15)" }}
            aria-label="Ajouter un contact de confiance"
          >
            <Plus size={20} strokeWidth={2} color="var(--color-text-muted)" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Add contact form */}
      <AnimatePresence>
        {adding && contacts.length < MAX_CONTACTS && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="space-y-2 rounded-xl bg-white/60 p-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Prenom"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(0,0,0,0.1)", color: "var(--color-text)" }}
                aria-label="Prenom du contact"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Numero de telephone"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "rgba(0,0,0,0.1)", color: "var(--color-text)" }}
                aria-label="Telephone du contact"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 rounded-lg py-2 text-sm font-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.05)", color: "var(--color-text-soft)" }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={addContact}
                  disabled={!newName.trim() || !newPhone.trim()}
                  className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: TRUST_COLORS.trusted }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact settings */}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="mb-3 rounded-xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              {contact.name}
            </p>
            <button
              type="button"
              onClick={() => removeContact(contact.id)}
              className="text-xs"
              style={{ color: "var(--color-danger)" }}
              aria-label={`Retirer ${contact.name}`}
            >
              Retirer
            </button>
          </div>

          {(
            [
              { key: "shareLocation" as const, label: "Partager ma position" },
              { key: "alertNoCheckin" as const, label: "Alerter si pas de check-in" },
              { key: "sendItinerary" as const, label: "Envoyer mon itineraire" },
            ] as const
          ).map((opt) => (
            <div key={opt.key} className="flex items-center justify-between py-1.5">
              <span className="text-xs" style={{ color: "var(--color-text-soft)" }}>
                {opt.label}
              </span>
              <button
                type="button"
                onClick={() => toggleOption(contact.id, opt.key)}
                className="relative h-5 w-9 rounded-full transition-colors"
                style={{
                  backgroundColor: contact[opt.key]
                    ? TRUST_COLORS.trusted
                    : "rgba(0,0,0,0.12)",
                }}
                role="switch"
                aria-checked={contact[opt.key]}
                aria-label={`${opt.label} pour ${contact.name}`}
              >
                <motion.span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full"
                  style={{ backgroundColor: "white" }}
                  animate={{ x: contact[opt.key] ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>
      ))}

      {/* Privacy notice */}
      <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
        Tes contacts ne voient ta position que quand tu l&apos;actives
      </p>
    </div>
  );
}

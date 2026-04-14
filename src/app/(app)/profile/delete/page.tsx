"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { IconX } from "@/components/ui/Icons";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmText !== "SUPPRIMER") return;
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await signOut();
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur de connexion");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="tap-target p-1" aria-label="Retour">
          <IconX size={20} className="text-text-muted" />
        </button>
        <h1 className="text-[15px] font-bold text-danger">Supprimer mon compte</h1>
        <div className="w-8" />
      </header>

      <div className="px-5 py-8 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-[20px] font-bold text-danger mb-2">Cette action est irreversible</h2>
          <p className="text-[14px] text-text-muted leading-relaxed">
            Toutes tes donnees seront definitivement supprimees : profil, photos, conversations, matchs, messages.
          </p>
        </div>

        <div className="bg-danger/5 border border-danger/15 rounded-2xl p-5 mb-6">
          <p className="text-[13px] text-text-soft mb-4">
            Pour confirmer, ecris <strong className="text-danger">SUPPRIMER</strong> ci-dessous :
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="Ecris SUPPRIMER"
            className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text text-center font-bold uppercase tracking-wider"
            aria-label="Confirmation de suppression"
          />
        </div>

        {error && (
          <div role="alert" className="bg-danger/10 border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleDelete}
          disabled={confirmText !== "SUPPRIMER" || loading}
          className="w-full bg-danger text-white font-semibold py-3.5 rounded-full text-sm disabled:opacity-30 active:scale-[0.98] transition-all tap-target"
        >
          {loading ? "Suppression..." : "Supprimer definitivement mon compte"}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full text-center text-[13px] text-text-muted font-medium mt-4 py-3 tap-target"
        >
          Annuler, je reste
        </button>

        <p className="text-[10px] text-text-muted text-center mt-6">
          Conformement au RGPD, tes donnees seront effacees sous 30 jours maximum.
        </p>
      </div>
    </div>
  );
}

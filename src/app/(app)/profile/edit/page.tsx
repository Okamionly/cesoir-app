"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/lib/useProfile";
import PhotoUpload from "@/components/app/PhotoUpload";
import { IconX } from "@/components/ui/Icons";

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile(user?.id);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(String(profile.age));
      setBio(profile.bio || "");
      setGender(profile.gender);
      setLookingFor(profile.looking_for);
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile({
      name,
      age: parseInt(age),
      bio,
      gender: gender as "homme" | "femme" | "autre",
      looking_for: lookingFor as "hommes" | "femmes" | "tous",
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => router.back(), 1000);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="text-3xl text-accent animate-pulse">☾</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="tap-target p-1" aria-label="Retour">
          <IconX size={20} className="text-text-muted" />
        </button>
        <h1 className="text-[15px] font-bold">Modifier mon profil</h1>
        <div className="w-8" />
      </header>

      <form onSubmit={handleSave} className="px-5 py-6 max-w-sm mx-auto space-y-5">
        {/* Photo */}
        <div className="flex justify-center">
          {user && <PhotoUpload userId={user.id} variant="default" onUploadComplete={() => {}} />}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="edit-name" className="block text-[11px] font-semibold text-text-muted mb-1">Prenom</label>
          <input id="edit-name" type="text" value={name} onChange={e => setName(e.target.value)} required
            className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
        </div>

        {/* Age */}
        <div>
          <label htmlFor="edit-age" className="block text-[11px] font-semibold text-text-muted mb-1">Age</label>
          <input id="edit-age" type="number" min={18} max={99} value={age} onChange={e => setAge(e.target.value)} required
            className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="edit-bio" className="block text-[11px] font-semibold text-text-muted mb-1">Bio</label>
          <textarea id="edit-bio" rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="Parle de toi..."
            className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text resize-none" />
          <p className="text-[10px] text-text-muted mt-1">{bio.length}/500</p>
        </div>

        {/* Gender */}
        <fieldset>
          <legend className="text-[11px] font-semibold text-text-muted mb-2">Je suis</legend>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: "homme", l: "Homme" }, { v: "femme", l: "Femme" }, { v: "autre", l: "Autre" }].map(g => (
              <button key={g.v} type="button" onClick={() => setGender(g.v)} aria-pressed={gender === g.v}
                className={`py-3 rounded-xl text-sm font-medium border transition-all tap-target ${gender === g.v ? "border-accent gradient-bg text-white" : "border-border text-text-muted"}`}>
                {g.l}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Looking for */}
        <fieldset>
          <legend className="text-[11px] font-semibold text-text-muted mb-2">Je cherche</legend>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: "hommes", l: "Hommes" }, { v: "femmes", l: "Femmes" }, { v: "tous", l: "Tout le monde" }].map(g => (
              <button key={g.v} type="button" onClick={() => setLookingFor(g.v)} aria-pressed={lookingFor === g.v}
                className={`py-3 rounded-xl text-sm font-medium border transition-all tap-target ${lookingFor === g.v ? "border-accent gradient-bg text-white" : "border-border text-text-muted"}`}>
                {g.l}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Save */}
        {saved ? (
          <div className="text-center text-safe font-semibold text-sm py-3">Profil sauvegarde !</div>
        ) : (
          <button type="submit" disabled={saving}
            className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm active:scale-[0.98] transition-transform disabled:opacity-50 tap-target">
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        )}
      </form>
    </div>
  );
}

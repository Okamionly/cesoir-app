"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { springs, micro } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/lib/useProfile";
import PhotoUpload from "@/components/app/PhotoUpload";
import { IconX } from "@/components/ui/Icons";

const BIO_MAX = 200;

const GENDERS = [
  { v: "homme", l: "Homme" },
  { v: "femme", l: "Femme" },
  { v: "autre", l: "Autre" },
] as const;

const LOOKING_FOR = [
  { v: "hommes", l: "Hommes" },
  { v: "femmes", l: "Femmes" },
  { v: "tous", l: "Tous" },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile(user?.id);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [city, setCity] = useState("Paris");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const btnControls = useAnimationControls();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(String(profile.age || ""));
      setBio(profile.bio || "");
      setGender(profile.gender || "");
      setLookingFor(profile.looking_for || "");
      setCity(profile.city || "Paris");
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
      city,
    });

    setSaving(false);

    if (ok) {
      // Success pop on button
      btnControls.start(micro.successPop);

      // Show toast
      setToast(true);
      setTimeout(() => {
        setToast(false);
        router.back();
      }, 1500);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.span
          className="text-3xl text-accent"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ☾
        </motion.span>
      </div>
    );

  // Stagger helper: each field delays by 0.06s
  const fieldMotion = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { ...springs.heavy, delay: i * 0.06 },
  });

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between">
        <motion.button
          onClick={() => router.back()}
          className="tap-target p-1"
          aria-label="Retour"
          whileTap={{ scale: 0.9 }}
        >
          <IconX size={20} className="text-text-muted" />
        </motion.button>
        <h1 className="text-[15px] font-bold text-text">Modifier mon profil</h1>
        <div className="w-8" />
      </header>

      <form
        ref={formRef}
        onSubmit={handleSave}
        className="px-5 py-6 max-w-sm mx-auto space-y-5"
      >
        {/* --- Photo --- */}
        <motion.div className="flex justify-center" {...fieldMotion(0)}>
          {user && (
            <PhotoUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url}
              onUploadComplete={() => {}}
              variant="compact"
              fallbackLetter={name?.charAt(0)?.toUpperCase() || "?"}
            />
          )}
        </motion.div>

        {/* --- Name --- */}
        <motion.div {...fieldMotion(1)}>
          <label
            htmlFor="edit-name"
            className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5"
          >
            Prenom
          </label>
          <input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent/40 outline-none transition-colors"
          />
        </motion.div>

        {/* --- Age --- */}
        <motion.div {...fieldMotion(2)}>
          <label
            htmlFor="edit-age"
            className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5"
          >
            Age
          </label>
          <input
            id="edit-age"
            type="number"
            min={18}
            max={99}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent/40 outline-none transition-colors"
          />
        </motion.div>

        {/* --- Bio --- */}
        <motion.div {...fieldMotion(3)}>
          <label
            htmlFor="edit-bio"
            className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5"
          >
            Bio
          </label>
          <textarea
            id="edit-bio"
            rows={4}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            placeholder="Parle de toi..."
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text resize-none focus:border-accent/40 outline-none transition-colors"
          />
          <p
            className={`text-[10px] mt-1 font-medium transition-colors ${
              bio.length >= BIO_MAX ? "text-danger" : "text-text-muted"
            }`}
          >
            {bio.length}/{BIO_MAX}
          </p>
        </motion.div>

        {/* --- Gender --- */}
        <motion.fieldset {...fieldMotion(4)}>
          <legend className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Je suis
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <motion.button
                key={g.v}
                type="button"
                onClick={() => setGender(g.v)}
                aria-pressed={gender === g.v}
                whileTap={{ scale: 0.92 }}
                className={`py-3 rounded-xl text-sm font-medium border transition-all tap-target ${
                  gender === g.v
                    ? "border-accent gradient-bg text-white shadow-glow"
                    : "border-border text-text-muted hover:border-accent/30"
                }`}
              >
                {g.l}
              </motion.button>
            ))}
          </div>
        </motion.fieldset>

        {/* --- Looking for --- */}
        <motion.fieldset {...fieldMotion(5)}>
          <legend className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Je cherche
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {LOOKING_FOR.map((g) => (
              <motion.button
                key={g.v}
                type="button"
                onClick={() => setLookingFor(g.v)}
                aria-pressed={lookingFor === g.v}
                whileTap={{ scale: 0.92 }}
                className={`py-3 rounded-xl text-sm font-medium border transition-all tap-target ${
                  lookingFor === g.v
                    ? "border-accent gradient-bg text-white shadow-glow"
                    : "border-border text-text-muted hover:border-accent/30"
                }`}
              >
                {g.l}
              </motion.button>
            ))}
          </div>
        </motion.fieldset>

        {/* --- City --- */}
        <motion.div {...fieldMotion(6)}>
          <label
            htmlFor="edit-city"
            className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5"
          >
            Ville
          </label>
          <input
            id="edit-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris"
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text focus:border-accent/40 outline-none transition-colors"
          />
        </motion.div>

        {/* --- Save button --- */}
        <motion.div {...fieldMotion(7)}>
          <motion.button
            type="submit"
            disabled={saving}
            animate={btnControls}
            whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(139,92,246,0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full gradient-bg text-white font-semibold py-3.5 rounded-full text-sm disabled:opacity-50 tap-target transition-shadow"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </motion.button>
        </motion.div>
      </form>

      {/* --- Toast --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springs.elastic}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-safe/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg"
          >
            Profil mis a jour !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

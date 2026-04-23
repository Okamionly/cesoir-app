"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/lib/useProfile";
import PhotoUpload from "@/components/app/PhotoUpload";
import PageHeader from "@/components/ui/PageHeader";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormChoice,
  FormSubmit,
  FormBanner,
} from "@/components/ui/forms";

const BIO_MAX = 200;

const GENDERS = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "autre", label: "Autre" },
] as const;

const LOOKING_FOR = [
  { value: "hommes", label: "Hommes" },
  { value: "femmes", label: "Femmes" },
  { value: "tous", label: "Tous" },
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
  const [city, setCity] = useState("Montpellier");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toast, setToast] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(String(profile.age || ""));
      setBio(profile.bio || "");
      setGender(profile.gender || "");
      setLookingFor(profile.looking_for || "");
      setCity(profile.city || "Montpellier");
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

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
      setSaveSuccess(true);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        router.back();
      }, 1500);
    } else {
      setSaveError("La sauvegarde a echoue. Reessaie.");
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <m.span
          className="text-3xl text-accent"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ☾
        </m.span>
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
      <PageHeader
        title="Modifier mon profil"
        onBack={() => router.back()}
        backIconVariant="close"
        magneticBack
        backLabel="Fermer"
      />

      <form
        ref={formRef}
        onSubmit={handleSave}
        className="px-5 py-6 max-w-sm mx-auto space-y-5"
        noValidate
      >
        {/* Form-level error */}
        <FormBanner tone="error">{saveError}</FormBanner>

        {/* --- Photo --- */}
        <m.div className="flex justify-center" {...fieldMotion(0)}>
          {user && (
            <PhotoUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url}
              onUploadComplete={() => {}}
              variant="compact"
              fallbackLetter={name?.charAt(0)?.toUpperCase() || "?"}
            />
          )}
        </m.div>

        {/* --- Name --- */}
        <m.div {...fieldMotion(1)}>
          <FormField label="Prenom" required>
            <FormInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
        </m.div>

        {/* --- Age --- */}
        <m.div {...fieldMotion(2)}>
          <FormField label="Age" required>
            <FormInput
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </FormField>
        </m.div>

        {/* --- Bio --- */}
        <m.div {...fieldMotion(3)}>
          <FormField label="Bio" hint={`${bio.length}/${BIO_MAX} caracteres`}>
            <FormTextarea
              rows={4}
              maxLength={BIO_MAX}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Parle de toi..."
            />
          </FormField>
        </m.div>

        {/* --- Gender --- */}
        <m.div {...fieldMotion(4)}>
          <FormChoice
            legend="Je suis"
            options={GENDERS}
            value={gender}
            onChange={setGender}
          />
        </m.div>

        {/* --- Looking for --- */}
        <m.div {...fieldMotion(5)}>
          <FormChoice
            legend="Je cherche"
            options={LOOKING_FOR}
            value={lookingFor}
            onChange={setLookingFor}
          />
        </m.div>

        {/* --- City --- */}
        <m.div {...fieldMotion(6)}>
          <FormField label="Ville">
            <FormInput
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Montpellier"
            />
          </FormField>
        </m.div>

        {/* --- Save --- */}
        <m.div {...fieldMotion(7)}>
          <FormSubmit
            isLoading={saving}
            isSuccess={saveSuccess}
            hasError={Boolean(saveError)}
            loadingLabel="Sauvegarde..."
          >
            Sauvegarder
          </FormSubmit>
        </m.div>
      </form>

      {/* --- Toast --- */}
      <AnimatePresence>
        {toast && (
          <m.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springs.elastic}
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-safe/90 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg"
          >
            Profil mis a jour !
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

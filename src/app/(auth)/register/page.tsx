"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/app/PhotoUpload";
import { landing } from "@/lib/design-tokens";
import { springs, easings } from "@/lib/motion-design";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormChoice,
  FormSubmit,
  FormBanner,
} from "@/components/ui/forms";

const GENDERS = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "autre", label: "Autre" },
] as const;

const LOOKING_FOR = [
  { value: "hommes", label: "Hommes" },
  { value: "femmes", label: "Femmes" },
  { value: "tous", label: "Tout le monde" },
] as const;

const stepVariants = {
  enter: { opacity: 0, x: 40, scale: 0.98 },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.45, ease: easings.out },
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.98,
    transition: { duration: 0.3, ease: easings.dramatic },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, loading: authLoading, error: authError } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const stepOneInvalid =
    !gender || !lookingFor || !name || !email || !password || !age;

  async function handleCreateAccount() {
    setError("");

    const user = await signUp(email, password, {
      name,
      age: parseInt(age),
      gender,
      looking_for: lookingFor,
    });

    if (!user) {
      setError(authError || "Erreur lors de l'inscription");
      return;
    }

    setTempUserId(user.id);
    setStep(2);
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!tempUserId) return;

    if (bio) {
      await supabase.from("profiles").update({ bio }).eq("id", tempUserId);
    }

    router.push("/onboarding");
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center px-6 py-10 overflow-hidden"
      style={{ background: landing.bg, color: landing.fg }}
    >
      {/* Ambient cinematic glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full blur-3xl opacity-30"
        style={{ background: landing.gradient }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(139,92,246,0.3) 0, transparent 40%), radial-gradient(circle at 85% 80%, rgba(0,255,136,0.22) 0, transparent 45%)",
        }}
      />

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easings.out }}
        className="relative w-full max-w-sm"
      >
        {/* Logo with breathing moon */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <m.span
            className="text-2xl drop-shadow-[0_0_14px_rgba(139,92,246,0.5)]"
            aria-hidden="true"
            style={{ color: landing.violet }}
            animate={{ rotate: [0, 6, 0, -6, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            ☾
          </m.span>
          <span className="font-display text-xl font-bold tracking-tight">
            CeSoir
          </span>
        </div>

        {/* Progress */}
        <div
          className="flex gap-1.5 mb-7"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Etape ${step} sur 3`}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{
                background:
                  s <= step ? landing.gradient : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>

        {/* Form-level error */}
        <div className="mb-4">
          <FormBanner tone="error" variant="dark">
            {error || authError || null}
          </FormBanner>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 — identity */}
          {step === 1 && (
            <m.div
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">
                Cree ton profil
              </h1>
              <p className="text-sm text-white/60 mb-6">
                30 secondes, promis.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_80px] gap-3">
                  <FormField label="Prenom" variant="dark" required>
                    <FormInput
                      type="text"
                      placeholder="Ton prenom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="given-name"
                      variant="dark"
                      size="md"
                    />
                  </FormField>
                  <FormField label="Age" variant="dark" required>
                    <FormInput
                      type="number"
                      min={18}
                      max={99}
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      variant="dark"
                      size="md"
                    />
                  </FormField>
                </div>
                <FormField label="Email" variant="dark" required>
                  <FormInput
                    type="email"
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    variant="dark"
                    size="md"
                  />
                </FormField>
                <FormField
                  label="Mot de passe"
                  variant="dark"
                  required
                  hint="Minimum 6 caracteres."
                >
                  <FormInput
                    type="password"
                    minLength={6}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    variant="dark"
                    size="md"
                  />
                </FormField>
                <FormChoice
                  legend="Je suis"
                  variant="dark"
                  options={GENDERS}
                  value={gender}
                  onChange={setGender}
                />
                <FormChoice
                  legend="Je cherche"
                  variant="dark"
                  options={LOOKING_FOR}
                  value={lookingFor}
                  onChange={setLookingFor}
                />
                <FormSubmit
                  type="button"
                  onClick={handleCreateAccount}
                  isLoading={authLoading}
                  loadingLabel="Creation..."
                  disabled={stepOneInvalid}
                  hasError={Boolean(error || authError)}
                  variant="dark"
                  magnetic={false}
                >
                  Creer mon compte
                </FormSubmit>
                <p className="text-[10px] text-white/40 text-center mt-2 leading-relaxed">
                  En t&apos;inscrivant, tu acceptes nos{" "}
                  <Link href="/cgu" className="underline" style={{ color: landing.violet }}>CGU</Link>{" "}et notre{" "}
                  <Link href="/privacy" className="underline" style={{ color: landing.violet }}>Politique de confidentialite</Link>.
                </p>
              </div>
            </m.div>
          )}

          {/* Step 2 — photo */}
          {step === 2 && tempUserId && (
            <m.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">
                Ajoute ta photo
              </h1>
              <p className="text-sm text-white/60 mb-8">
                Les profils avec photo recoivent 3x plus de matchs.
              </p>
              <PhotoUpload
                userId={tempUserId}
                onUploadComplete={() => setPhotoUploaded(true)}
              />
              <div className="flex gap-3 mt-8">
                <m.button
                  type="button"
                  onClick={() => setStep(3)}
                  whileTap={{ scale: 0.97 }}
                  transition={springs.micro}
                  className="flex-1 py-3.5 rounded-full text-sm font-medium tap-target min-h-[44px]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Passer
                </m.button>
                <div className="flex-1">
                  <FormSubmit
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!photoUploaded}
                    variant="dark"
                    magnetic={false}
                  >
                    Suivant
                  </FormSubmit>
                </div>
              </div>
            </m.div>
          )}

          {/* Step 3 — bio */}
          {step === 3 && (
            <m.form
              key="step3"
              onSubmit={handleFinish}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">
                Parle de toi
              </h1>
              <p className="text-sm text-white/60 mb-6">
                Qu&apos;est-ce qui te rend unique ?
              </p>
              <div className="space-y-4">
                <FormField label="Ta soiree ideale" variant="dark">
                  <FormTextarea
                    rows={3}
                    placeholder="Ex: Un bon sushi avec quelqu'un de cool..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    variant="dark"
                  />
                </FormField>
                <div className="flex gap-3">
                  <m.button
                    type="button"
                    onClick={() => setStep(2)}
                    whileTap={{ scale: 0.97 }}
                    transition={springs.micro}
                    className="flex-1 py-3.5 rounded-full text-sm font-medium tap-target min-h-[44px]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    Retour
                  </m.button>
                  <div className="flex-1">
                    <FormSubmit variant="dark">
                      C&apos;est parti !
                    </FormSubmit>
                  </div>
                </div>
              </div>
            </m.form>
          )}
        </AnimatePresence>

        <p className="text-sm text-white/60 text-center mt-6">
          Deja inscrit ?{" "}
          <Link
            href="/login"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: landing.vert }}
          >
            Se connecter
          </Link>
        </p>
      </m.div>
    </main>
  );
}

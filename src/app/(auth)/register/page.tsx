"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/app/PhotoUpload";
import { landing } from "@/lib/design-tokens";
import { springs, easings } from "@/lib/motion-design";
import { Magnetic } from "@/components/motion/Magnetic";

// Dark-mode input style shared by every step
const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: landing.fg,
};

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
  const [modes, setModes] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const toggleMode = (k: string) =>
    setModes((p) => (p.includes(k) ? p.filter((m) => m !== k) : [...p, k]));

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

    for (const mode of modes) {
      await supabase.from("mode_activations").insert({
        user_id: user.id,
        mode,
        is_active: true,
        available_time: "Dispo maintenant",
      });
    }

    setTempUserId(user.id);
    setStep(3);
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

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easings.out }}
        className="relative w-full max-w-sm"
      >
        {/* Logo with breathing moon */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <motion.span
            className="text-2xl drop-shadow-[0_0_14px_rgba(139,92,246,0.5)]"
            aria-hidden="true"
            style={{ color: landing.violet }}
            animate={{ rotate: [0, 6, 0, -6, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            ☾
          </motion.span>
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
          aria-valuemax={4}
          aria-label={`Etape ${step} sur 4`}
        >
          {[1, 2, 3, 4].map((s) => (
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

        {/* Error */}
        {(error || authError) && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.snap}
            className="text-[13px] px-4 py-3 rounded-xl mb-4 border"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.25)",
              color: "#FCA5A5",
            }}
          >
            {error || authError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1 — identity */}
          {step === 1 && (
            <motion.div
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
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-1.5"
                    >
                      Prenom
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="Ton prenom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="given-name"
                      className="w-full px-3 py-3 rounded-xl text-sm placeholder:text-white/30 focus:outline-none"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-age"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-1.5"
                    >
                      Age
                    </label>
                    <input
                      id="reg-age"
                      type="number"
                      min={18}
                      max={99}
                      required
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl text-sm placeholder:text-white/30 focus:outline-none"
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="ton@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full px-3 py-3 rounded-xl text-sm placeholder:text-white/30 focus:outline-none"
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-pass"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-1.5"
                  >
                    Mot de passe
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min. 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-3 rounded-xl text-sm placeholder:text-white/30 focus:outline-none"
                    style={INPUT_STYLE}
                  />
                </div>
                <fieldset>
                  <legend className="text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-2">
                    Je suis
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "homme", l: "Homme" },
                      { v: "femme", l: "Femme" },
                      { v: "autre", l: "Autre" },
                    ].map((g) => (
                      <button
                        key={g.v}
                        type="button"
                        onClick={() => setGender(g.v)}
                        aria-pressed={gender === g.v}
                        className="py-3 rounded-xl text-sm font-medium transition-all tap-target"
                        style={
                          gender === g.v
                            ? {
                                background: landing.gradient,
                                color: "#FFFFFF",
                                border: "1px solid transparent",
                                boxShadow: "0 0 24px rgba(139,92,246,0.35)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                                color: "rgba(255,255,255,0.7)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }
                        }
                      >
                        {g.l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-2">
                    Je cherche
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "hommes", l: "Hommes" },
                      { v: "femmes", l: "Femmes" },
                      { v: "tous", l: "Tout le monde" },
                    ].map((g) => (
                      <button
                        key={g.v}
                        type="button"
                        onClick={() => setLookingFor(g.v)}
                        aria-pressed={lookingFor === g.v}
                        className="py-3 rounded-xl text-sm font-medium transition-all tap-target"
                        style={
                          lookingFor === g.v
                            ? {
                                background: landing.gradient,
                                color: "#FFFFFF",
                                border: "1px solid transparent",
                                boxShadow: "0 0 24px rgba(139,92,246,0.35)",
                              }
                            : {
                                background: "rgba(255,255,255,0.04)",
                                color: "rgba(255,255,255,0.7)",
                                border: "1px solid rgba(255,255,255,0.1)",
                              }
                        }
                      >
                        {g.l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <motion.button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={
                    !gender ||
                    !lookingFor ||
                    !name ||
                    !email ||
                    !password ||
                    !age
                  }
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springs.snap}
                  className="w-full text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 tap-target"
                  style={{
                    background: landing.gradient,
                    boxShadow: landing.shadow,
                  }}
                >
                  Suivant
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — modes */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">
                Tes modes ce soir
              </h1>
              <p className="text-sm text-white/60 mb-6">
                Choisis un ou plusieurs modes.
              </p>
              <div
                className="grid grid-cols-3 gap-2 mb-6"
                role="group"
                aria-label="Selection des modes"
              >
                {MODE_KEYS.map((k) => {
                  const m = MODES[k];
                  const on = modes.includes(k);
                  const Icon = MODE_ICONS[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleMode(k)}
                      aria-pressed={on}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all tap-target"
                      style={
                        on
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(0,255,136,0.15))",
                              border: `1px solid ${landing.violet}`,
                              boxShadow: "0 0 18px rgba(139,92,246,0.3)",
                            }
                          : {
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }
                      }
                    >
                      {Icon ? (
                        <span
                          style={{
                            color: on ? landing.violet : "rgba(255,255,255,0.55)",
                            display: "inline-flex",
                          }}
                        >
                          <Icon size={20} />
                        </span>
                      ) : (
                        <span className="text-xl">{m.icon}</span>
                      )}
                      <span
                        className="text-[9px] font-medium"
                        style={{
                          color: on ? landing.violet : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-full text-sm font-medium tap-target transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  Retour
                </button>
                <motion.button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={modes.length === 0 || authLoading}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springs.snap}
                  className="flex-1 text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 tap-target"
                  style={{
                    background: landing.gradient,
                    boxShadow: landing.shadow,
                  }}
                >
                  {authLoading ? "Creation..." : "Suivant"}
                </motion.button>
              </div>
              <p className="text-[10px] text-white/40 text-center mt-4 leading-relaxed">
                En t&apos;inscrivant, tu acceptes nos{" "}
                <Link
                  href="/cgu"
                  className="underline"
                  style={{ color: landing.violet }}
                >
                  CGU
                </Link>{" "}
                et notre{" "}
                <Link
                  href="/privacy"
                  className="underline"
                  style={{ color: landing.violet }}
                >
                  Politique de confidentialite
                </Link>
                .
              </p>
            </motion.div>
          )}

          {/* Step 3 — photo */}
          {step === 3 && tempUserId && (
            <motion.div
              key="step3"
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
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3.5 rounded-full text-sm font-medium tap-target"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Passer
                </button>
                <motion.button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!photoUploaded}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springs.snap}
                  className="flex-1 text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 tap-target"
                  style={{
                    background: landing.gradient,
                    boxShadow: landing.shadow,
                  }}
                >
                  Suivant
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4 — bio */}
          {step === 4 && (
            <motion.form
              key="step4"
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
                <div>
                  <label
                    htmlFor="reg-bio"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-white/50 mb-1.5"
                  >
                    Ta soiree ideale
                  </label>
                  <textarea
                    id="reg-bio"
                    rows={3}
                    placeholder="Ex: Un bon sushi avec quelqu'un de cool..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm placeholder:text-white/30 resize-none focus:outline-none"
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3.5 rounded-full text-sm font-medium tap-target"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    Retour
                  </button>
                  <Magnetic as="div" strength={0.12} radius={120} className="flex-1">
                    <motion.button
                      type="submit"
                      whileHover={{
                        y: -2,
                        boxShadow: "0 14px 60px rgba(0,255,136,0.35)",
                        transition: springs.gentle,
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={springs.snap}
                      className="w-full text-white py-3.5 rounded-full text-sm font-semibold tap-target"
                      style={{
                        background: landing.gradient,
                        boxShadow: landing.shadow,
                      }}
                    >
                      C&apos;est parti !
                    </motion.button>
                  </Magnetic>
                </div>
              </div>
            </motion.form>
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
      </motion.div>
    </main>
  );
}

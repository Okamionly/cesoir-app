"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { trackAcquisition, track, identifyUser, captureFirstVisit, trackFirstTime } from "@/lib/analytics";
import dynamic from "next/dynamic";

// FIX H (perf-ml-001): PhotoUpload pulls in nsfwjs + @tensorflow/tfjs (~3 MB)
// via @/lib/nsfw. Lazy-load so those chunks are fetched only when the user
// reaches the photo step in the registration flow.
const PhotoUpload = dynamic(() => import("@/components/app/PhotoUpload"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-32 rounded-2xl bg-bg-card border border-border">
      <span className="text-[12px] text-text-muted">Chargement...</span>
    </div>
  ),
});
import { landing } from "@/lib/design-tokens";
import { springs, easings } from "@/lib/motion-design";
import { Eye, EyeOff, Loader2 } from "@/components/ui/lucide";
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

function RegisterFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <Loader2
        size={28}
        strokeWidth={1.8}
        className="animate-spin text-accent"
        aria-label="Chargement"
      />
    </main>
  );
}

// Wave 15.1 : wrap useSearchParams in Suspense to allow static prerender
// (Next.js 16 requires Suspense around search-params readers for SSG).
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, loading: authLoading, error: authError } = useAuth();

  // Wave 15 (2026-04-23) : invite-only launch.
  //   step 0 = invite code gate
  //   step 1 = identity
  //   step 2 = photo
  //   step 3 = bio
  const [step, setStep] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [, setInviteValid] = useState(false);
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [consentLookingFor, setConsentLookingFor] = useState(false);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const stepOneInvalid =
    !gender || !name || !email || !password || !age;

  // If an invite code is passed in the URL (e.g. from /invite/[code]),
  // auto-verify it and skip the gate. Falls through to step 0 on failure.
  useEffect(() => {
    const urlCode = searchParams?.get("invite")?.trim();
    if (!urlCode) return;
    setInviteCode(urlCode.toUpperCase());
    void verifyInviteCode(urlCode);
    // We intentionally run this once per URL change — no function deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function verifyInviteCode(candidate: string) {
    setInviteChecking(true);
    setInviteError("");
    try {
      const res = await fetch("/api/invites/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: candidate.trim(), verify: true }),
      });
      const data = (await res.json()) as { valid?: boolean; reason?: string };
      if (res.ok && data.valid) {
        setInviteValid(true);
        setStep(1);
      } else {
        setInviteValid(false);
        if (data.reason === "used") setInviteError("Ce code a deja ete utilise.");
        else if (data.reason === "expired") setInviteError("Ce code a expire.");
        else setInviteError("Code introuvable.");
      }
    } catch {
      setInviteError("Erreur reseau. Reessaye.");
    } finally {
      setInviteChecking(false);
    }
  }

  async function claimInviteCode(candidate: string): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return false;

    const res = await fetch("/api/invites/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ code: candidate.trim() }),
    });
    return res.ok;
  }

  async function handleCreateAccount() {
    setError("");

    // Ensure we have a UTM snapshot before we lose the window (e.g. hard
    // navigation). Idempotent — no-op after the first capture.
    captureFirstVisit();

    // RGPD Art.9: only send looking_for if user explicitly consented.
    // Default "u" (unspecified) has no impact on matching (filter is opt-in).
    const user = await signUp(email, password, {
      name,
      age: parseInt(age),
      gender,
      looking_for: consentLookingFor && lookingFor ? lookingFor : "u",
    });

    if (!user) {
      setError(authError || "Erreur lors de l'inscription");
      return;
    }

    // Claim the invite now that we have an authenticated session. Do not
    // block account creation on claim failure — the code was pre-verified
    // and the UX is graceful even if claiming races.
    if (inviteCode) {
      void claimInviteCode(inviteCode);
    }

    // Wire PostHog identity + persist first-touch attribution on the profile
    // row. Both calls are safe to await in parallel — failures are logged
    // but do not block onboarding.
    identifyUser(user.id, { name });
    // Wave 15 · CPO core-loop event #1
    trackFirstTime("register_complete", {
      step: 1,
      invite: inviteCode || "none",
    });
    // Keep the fine-grain "register_complete" track() for backwards-compat
    // analytics boards that look at raw counts rather than activation %.
    track("register_complete", { step: 1, invite: inviteCode || "none" });
    await trackAcquisition({ userId: user.id });

    // Fire the mint RPC so the user immediately has 3 codes to share.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.access_token) {
      void fetch("/api/invites/mine", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
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
          aria-valuemin={0}
          aria-valuemax={3}
          aria-label={`Etape ${step} sur 3`}
        >
          {[0, 1, 2, 3].map((s) => (
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
          {/* Step 0 — invite code */}
          {step === 0 && (
            <m.div
              key="step0"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="font-display text-2xl font-bold mb-1 tracking-tight">
                Sur invitation
              </h1>
              <p className="text-sm text-white/60 mb-6">
                CeSoir est en invitation uniquement pour les 3 premiers mois.
                Entre ton code pour rejoindre la waitlist prioritaire.
              </p>
              <div className="space-y-4">
                <FormField
                  label="Code d'invitation"
                  variant="dark"
                  required
                  hint="Donne par un(e) ami(e). 8 caracteres."
                >
                  <FormInput
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase().replace(/\s/g, ""))
                    }
                    placeholder="CESOIR01"
                    autoCapitalize="characters"
                    autoComplete="one-time-code"
                    maxLength={16}
                    variant="dark"
                    size="md"
                  />
                </FormField>
                {inviteError && (
                  <p className="text-xs text-red-400" role="alert">
                    {inviteError}
                  </p>
                )}
                <FormSubmit
                  type="button"
                  onClick={() => verifyInviteCode(inviteCode)}
                  isLoading={inviteChecking}
                  loadingLabel="Verification..."
                  disabled={!inviteCode || inviteCode.length < 4}
                  hasError={Boolean(inviteError)}
                  variant="dark"
                  magnetic={false}
                >
                  Valider le code
                </FormSubmit>
                <p className="text-[10px] text-white/40 text-center mt-2 leading-relaxed">
                  Pas de code ?{" "}
                  <Link
                    href="/"
                    className="underline"
                    style={{ color: landing.vert }}
                  >
                    Rejoindre la waitlist
                  </Link>
                </p>
              </div>
            </m.div>
          )}

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
                Crée ton profil
              </h1>
              <p className="text-sm text-white/60 mb-6">
                30 secondes, promis.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_80px] gap-3">
                  <FormField label="Prénom" variant="dark" required>
                    <FormInput
                      type="text"
                      placeholder="Ton prénom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="given-name"
                      variant="dark"
                      size="md"
                    />
                  </FormField>
                  <FormField label="Âge" variant="dark" required>
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
                  hint="Minimum 6 caractères."
                >
                  <div className="relative">
                    <FormInput
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      variant="dark"
                      size="md"
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-11 h-11 rounded-lg text-white/60 hover:text-white/90 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff size={20} aria-hidden="true" />
                      ) : (
                        <Eye size={20} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormField>
                <FormChoice
                  legend="Je suis"
                  variant="dark"
                  options={GENDERS}
                  value={gender}
                  onChange={setGender}
                />
                {/* RGPD Art.9: explicit consent before collecting orientation */}
                <div>
                  <div className="mb-2 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="consent-looking-for"
                      checked={consentLookingFor}
                      onChange={(e) => {
                        setConsentLookingFor(e.target.checked);
                        if (!e.target.checked) setLookingFor("");
                      }}
                      className="mt-0.5 h-4 w-4 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="consent-looking-for" className="text-[11px] text-white/60 leading-relaxed cursor-pointer">
                      Je consens a renseigner mes préférences (donnée sensible art.&nbsp;9 RGPD — facultatif)
                    </label>
                  </div>
                  {consentLookingFor && (
                    <FormChoice
                      legend="Je cherche"
                      variant="dark"
                      options={LOOKING_FOR}
                      value={lookingFor}
                      onChange={setLookingFor}
                    />
                  )}
                </div>
                <FormSubmit
                  type="button"
                  onClick={handleCreateAccount}
                  isLoading={authLoading}
                  loadingLabel="Création..."
                  disabled={stepOneInvalid}
                  hasError={Boolean(error || authError)}
                  variant="dark"
                  magnetic={false}
                >
                  Créer mon compte
                </FormSubmit>
                <p className="text-[10px] text-white/40 text-center mt-2 leading-relaxed">
                  En t&apos;inscrivant, tu acceptes nos{" "}
                  <Link href="/cgu" className="underline" style={{ color: landing.violet }}>CGU</Link>{" "}et notre{" "}
                  <Link href="/privacy" className="underline" style={{ color: landing.violet }}>Politique de confidentialité</Link>.
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
                <FormField label="Ta soirée idéale" variant="dark">
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

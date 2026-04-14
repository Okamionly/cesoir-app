"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MODES, MODE_KEYS } from "@/lib/modes";
import { MODE_ICONS } from "@/components/ui/Icons";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/app/PhotoUpload";

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

  const toggleMode = (k: string) => setModes(p => p.includes(k) ? p.filter(m => m !== k) : [...p, k]);

  // Create account at end of step 2 so photo upload (step 3) has an authenticated user
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

    // Activate selected modes
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

  // Final step: save bio and redirect
  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!tempUserId) return;

    if (bio) {
      await supabase.from("profiles").update({ bio }).eq("id", tempUserId);
    }

    router.push("/browse");
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-2xl text-accent" aria-hidden="true">☾</span>
          <span className="text-xl font-bold">CeSoir</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label={`Etape ${step} sur 4`}>
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "gradient-bg" : "bg-border"}`} />
          ))}
        </div>

        {/* Error */}
        {(error || authError) && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-xl mb-4">
            {error || authError}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h1 className="text-xl font-bold mb-1">Cree ton profil</h1>
            <p className="text-sm text-text-muted mb-6">30 secondes, promis.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <label htmlFor="reg-name" className="block text-[11px] font-semibold text-text-muted mb-1">Prenom</label>
                  <input id="reg-name" type="text" required placeholder="Ton prenom" value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
                </div>
                <div>
                  <label htmlFor="reg-age" className="block text-[11px] font-semibold text-text-muted mb-1">Age</label>
                  <input id="reg-age" type="number" min={18} max={99} required placeholder="25" value={age} onChange={e => setAge(e.target.value)} className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-[11px] font-semibold text-text-muted mb-1">Email</label>
                <input id="reg-email" type="email" required placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
              </div>
              <div>
                <label htmlFor="reg-pass" className="block text-[11px] font-semibold text-text-muted mb-1">Mot de passe</label>
                <input id="reg-pass" type="password" required minLength={6} placeholder="Min. 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
              </div>
              <fieldset>
                <legend className="text-[11px] font-semibold text-text-muted mb-2">Je suis</legend>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:"homme",l:"Homme"},{v:"femme",l:"Femme"},{v:"autre",l:"Autre"}].map(g => (
                    <button key={g.v} type="button" onClick={() => setGender(g.v)} aria-pressed={gender === g.v}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all tap-target ${gender === g.v ? "border-accent gradient-bg text-white" : "border-border text-text-muted"}`}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[11px] font-semibold text-text-muted mb-2">Je cherche</legend>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:"hommes",l:"Hommes"},{v:"femmes",l:"Femmes"},{v:"tous",l:"Tout le monde"}].map(g => (
                    <button key={g.v} type="button" onClick={() => setLookingFor(g.v)} aria-pressed={lookingFor === g.v}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all tap-target ${lookingFor === g.v ? "border-accent gradient-bg text-white" : "border-border text-text-muted"}`}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button type="button" onClick={() => setStep(2)} disabled={!gender || !lookingFor || !name || !email || !password || !age}
                className="w-full gradient-bg text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform tap-target">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h1 className="text-xl font-bold mb-1">Tes modes ce soir</h1>
            <p className="text-sm text-text-muted mb-6">Choisis un ou plusieurs modes.</p>
            <div className="grid grid-cols-3 gap-2 mb-6" role="group" aria-label="Selection des modes">
              {MODE_KEYS.map(k => {
                const m = MODES[k];
                const on = modes.includes(k);
                const Icon = MODE_ICONS[k];
                return (
                  <button key={k} type="button" onClick={() => toggleMode(k)} aria-pressed={on}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all tap-target ${on ? "border-accent gradient-bg-subtle" : "border-border"}`}>
                    {Icon ? <Icon size={20} className={on ? "text-accent" : "text-text-muted"} /> : <span className="text-xl">{m.icon}</span>}
                    <span className={`text-[9px] font-medium ${on ? "text-accent" : "text-text-muted"}`}>{m.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-full text-sm font-medium border border-border tap-target">Retour</button>
              <button type="button" onClick={handleCreateAccount} disabled={modes.length === 0 || authLoading}
                className="flex-1 gradient-bg text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform tap-target">
                {authLoading ? "Creation..." : "Suivant"}
              </button>
            </div>
            <p className="text-[10px] text-text-muted text-center mt-4 leading-relaxed">
              En t&apos;inscrivant, tu acceptes nos <Link href="/cgu" className="text-accent underline">CGU</Link> et notre <Link href="/privacy" className="text-accent underline">Politique de confidentialite</Link>.
            </p>
          </div>
        )}

        {/* Step 3 — Photo (optional) */}
        {step === 3 && tempUserId && (
          <div className="animate-fade-up">
            <h1 className="text-xl font-bold mb-1">Ajoute ta photo</h1>
            <p className="text-sm text-text-muted mb-8">Les profils avec photo recoivent 3x plus de matchs.</p>
            <PhotoUpload
              userId={tempUserId}
              onUploadComplete={() => setPhotoUploaded(true)}
            />
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-full text-sm font-medium border border-border text-text-muted tap-target">
                Passer
              </button>
              <button type="button" onClick={() => setStep(4)} disabled={!photoUploaded}
                className="flex-1 gradient-bg text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform tap-target">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Bio */}
        {step === 4 && (
          <form onSubmit={handleFinish} className="animate-fade-up">
            <h1 className="text-xl font-bold mb-1">Parle de toi</h1>
            <p className="text-sm text-text-muted mb-6">Qu&apos;est-ce qui te rend unique ?</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="reg-bio" className="block text-[11px] font-semibold text-text-muted mb-1">Ta soiree ideale</label>
                <textarea id="reg-bio" rows={3} placeholder="Ex: Un bon sushi avec quelqu'un de cool..." value={bio} onChange={e => setBio(e.target.value)}
                  className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-3.5 rounded-full text-sm font-medium border border-border tap-target">Retour</button>
                <button type="submit"
                  className="flex-1 gradient-bg text-white py-3.5 rounded-full text-sm font-semibold active:scale-[0.98] transition-transform tap-target">
                  C&apos;est parti !
                </button>
              </div>
            </div>
          </form>
        )}

        <p className="text-sm text-text-muted text-center mt-6">
          Deja inscrit ? <Link href="/login" className="text-accent font-semibold">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MODES, MODE_KEYS } from "@/lib/modes";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [modes, setModes] = useState<string[]>([]);

  const toggleMode = (k: string) => setModes(p => p.includes(k) ? p.filter(m => m !== k) : [...p, k]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push("/browse"), 500);
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-2xl text-accent" aria-hidden="true">☾</span>
          <span className="text-xl font-bold">CeSoir</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Etape ${step} sur 3`}>
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "gradient-bg" : "bg-border"}`} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h1 className="text-xl font-bold mb-1">Cree ton profil</h1>
            <p className="text-sm text-text-muted mb-6">30 secondes, promis.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <label htmlFor="reg-name" className="block text-[11px] font-semibold text-text-muted mb-1">Prenom</label>
                  <input id="reg-name" type="text" required placeholder="Ton prenom" autoComplete="given-name" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
                </div>
                <div>
                  <label htmlFor="reg-age" className="block text-[11px] font-semibold text-text-muted mb-1">Age</label>
                  <input id="reg-age" type="number" min={18} max={99} required placeholder="25" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-[11px] font-semibold text-text-muted mb-1">Email</label>
                <input id="reg-email" type="email" required placeholder="ton@email.com" autoComplete="email" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
              </div>
              <div>
                <label htmlFor="reg-pass" className="block text-[11px] font-semibold text-text-muted mb-1">Mot de passe</label>
                <input id="reg-pass" type="password" required minLength={6} placeholder="Min. 6 caracteres" autoComplete="new-password" className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text" />
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
              <button type="button" onClick={() => setStep(2)} disabled={!gender || !lookingFor}
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
                return (
                  <button key={k} type="button" onClick={() => toggleMode(k)} aria-pressed={on}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all tap-target ${on ? "border-accent gradient-bg-subtle" : "border-border"}`}>
                    <span className="text-xl" aria-hidden="true">{m.icon}</span>
                    <span className={`text-[9px] font-medium ${on ? "text-accent" : "text-text-muted"}`}>{m.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-full text-sm font-medium border border-border tap-target">Retour</button>
              <button type="button" onClick={() => setStep(3)} disabled={modes.length === 0}
                className="flex-1 gradient-bg text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform tap-target">
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="animate-fade-up">
            <h1 className="text-xl font-bold mb-1">Parle de toi</h1>
            <p className="text-sm text-text-muted mb-6">Qu&apos;est-ce qui te rend unique ?</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="reg-bio" className="block text-[11px] font-semibold text-text-muted mb-1">Ta soiree ideale</label>
                <textarea id="reg-bio" rows={3} placeholder="Ex: Un bon sushi avec quelqu'un de cool, ou une balade nocturne..."
                  className="w-full px-3 py-3 bg-bg border border-border rounded-xl text-sm text-text resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-full text-sm font-medium border border-border tap-target">Retour</button>
                <button type="submit" disabled={loading}
                  className="flex-1 gradient-bg text-white py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform tap-target">
                  {loading ? "..." : "C'est parti !"}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-text-muted text-center mt-6 leading-relaxed">
              En t&apos;inscrivant, tu acceptes nos <Link href="/cgu" className="text-accent underline">CGU</Link> et notre <Link href="/privacy" className="text-accent underline">Politique de confidentialite</Link>.
            </p>
          </form>
        )}

        <p className="text-sm text-text-muted text-center mt-6">
          Deja inscrit ? <Link href="/login" className="text-accent font-semibold">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}

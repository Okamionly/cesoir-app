import Link from "next/link";
import { MODES, MODE_KEYS } from "@/lib/modes";

const badgeStyles: Record<string, string> = {
  default: "bg-[rgba(168,85,247,0.15)] border-[rgba(168,85,247,0.3)] text-[#a855f7]",
  pink: "bg-[rgba(236,72,153,0.15)] border-[rgba(236,72,153,0.3)] text-[#ec4899]",
  indigo: "bg-[rgba(99,102,241,0.15)] border-[rgba(99,102,241,0.3)] text-[#818cf8]",
  green: "bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.3)] text-[#22c55e]",
  amber: "bg-[rgba(239,68,68,0.15)] border-[rgba(245,158,11,0.3)] text-[#f59e0b]",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#a855f7] opacity-40 blur-[100px] -top-24 -right-24 animate-float" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#ec4899] opacity-40 blur-[100px] -bottom-12 -left-24" style={{ animation: "float 10s ease-in-out infinite reverse" }} />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[#6366f1] opacity-30 blur-[100px] top-1/2 left-1/2 -translate-x-1/2" style={{ animation: "float 12s ease-in-out infinite" }} />
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-block bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.3)] px-4 py-1.5 rounded-full text-xs font-semibold text-[#a855f7] mb-6">
            9 modes de rencontre
          </span>

          <h1 className="text-5xl font-black leading-tight tracking-tight mb-5">
            Seul(e) ce soir ?<br />
            <span className="gradient-text">Plus maintenant.</span>
          </h1>

          <p className="text-[#888888] text-base leading-relaxed mb-8">
            Trouve quelqu&apos;un pres de chez toi pour passer une soiree memorable. 9 facons de connecter.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="gradient-bg text-white font-semibold py-4 px-8 rounded-full text-base shadow-glow-sm active:scale-[0.98] transition-transform text-center"
            >
              Je suis dispo ce soir →
            </Link>
            <Link
              href="/browse"
              className="border border-[#1a1a1a] text-white font-medium py-4 px-8 rounded-full text-base hover:border-[#a855f7] transition-colors text-center"
            >
              Explorer
            </Link>
          </div>
        </div>
      </section>

      {/* Modes */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-3xl font-extrabold mb-2">
          Choisis ton <span className="gradient-text">mode</span>
        </h2>
        <p className="text-[#888888] text-sm mb-10">9 facons uniques de ne plus etre seul(e)</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {MODE_KEYS.map((key) => {
            const mode = MODES[key];
            const badge = badgeStyles[mode.badgeColor || "default"];
            return (
              <div key={key} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 text-left hover:border-[#a855f7] transition-all">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{mode.icon}</span>
                  {mode.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge}`}>{mode.badge}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold mb-1">{mode.name}</h3>
                <p className="text-sm text-[#888888] leading-relaxed mb-3">{mode.description}</p>
                <div className="flex flex-wrap gap-1">
                  {mode.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.15)] px-2 py-0.5 rounded-full text-[#a855f7]">{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-3xl font-extrabold mb-10">Ta securite, notre priorite</h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {[
            { icon: "🔒", title: "Profils verifies", desc: "Selfie + telephone" },
            { icon: "👥", title: "Lieux publics", desc: "Toujours recommandes" },
            { icon: "📱", title: "Bouton SOS", desc: "Alerte tes proches" },
            { icon: "⭐", title: "Notes & avis", desc: "Apres chaque rencontre" },
          ].map((item) => (
            <div key={item.title} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h4 className="text-sm font-bold mb-1">{item.title}</h4>
              <p className="text-xs text-[#888888]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold mb-3">
          Ce soir, c&apos;est <span className="gradient-text">ton</span> soir.
        </h2>
        <p className="text-[#888888] mb-8">9 modes. Des milliers de personnes. Zero solitude.</p>
        <Link
          href="/register"
          className="inline-block gradient-bg text-white font-semibold py-4 px-10 rounded-full text-lg shadow-glow active:scale-[0.98] transition-transform"
        >
          Trouver quelqu&apos;un ce soir
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl text-[#a855f7]">☾</span>
          <span className="text-lg font-extrabold">CeSoir</span>
        </div>
        <p className="text-xs text-[#888888]">&copy; 2026 CeSoir. Tous droits reserves.</p>
      </footer>
    </div>
  );
}

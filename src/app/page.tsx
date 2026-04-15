import Link from "next/link";
import { FadeInSection, StaggerContainer, StaggerItem, ScaleIn } from "@/components/landing/AnimatedSection";
import { CountUpNumbers } from "@/components/landing/CountUpNumbers";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Full-screen hero — just the name */}
      <section className="relative h-screen flex flex-col items-center justify-center">
        {/* Animated orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#8B5CF6] opacity-30 blur-[120px] -top-32 -right-32" style={{ animation: "float 8s ease-in-out infinite" }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#00FF88] opacity-20 blur-[120px] -bottom-20 -left-32" style={{ animation: "float 10s ease-in-out infinite reverse" }} />
          <div className="absolute w-[250px] h-[250px] rounded-full bg-[#8B5CF6] opacity-20 blur-[100px] top-1/3 left-1/3" style={{ animation: "float 14s ease-in-out infinite" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Moon logo */}
          <span className="text-6xl text-[#8B5CF6] mb-6 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]" style={{ animation: "float 6s ease-in-out infinite" }}>☾</span>

          {/* App name — massive */}
          <h1 className="text-[80px] sm:text-[120px] font-black tracking-tighter leading-none mb-4" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CeSoir
          </h1>

          {/* One-liner */}
          <p className="text-[18px] sm:text-[22px] text-white/60 font-light tracking-wide mb-12">
            Trouve quelqu&apos;un. <span className="text-white font-medium">Ce soir.</span>
          </p>

          {/* Phone mockup */}
          <div className="mb-8" style={{ animation: "float 6s ease-in-out infinite" }}>
            <div className="relative mx-auto" style={{ width: 220, height: 440 }}>
              {/* iPhone frame */}
              <div className="absolute inset-0 rounded-[36px] border-[3px] border-white/20 bg-black/80 backdrop-blur-sm overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-b-2xl z-10" />
                {/* Screen content — mini browse preview */}
                <div className="absolute inset-[3px] rounded-[33px] overflow-hidden bg-[#0A0A0A]">
                  {/* Mini header */}
                  <div className="px-4 pt-8 pb-2 flex items-center gap-2">
                    <span className="text-[10px] text-[#8B5CF6]">☾</span>
                    <span className="text-[9px] font-bold text-white/90">CeSoir</span>
                  </div>
                  {/* Mini mode pills */}
                  <div className="px-3 flex gap-1 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[6px] font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#a855f7]/30">Solo Diner</span>
                    <span className="px-2 py-0.5 rounded-full text-[6px] font-semibold bg-white/5 text-white/40 border border-white/10">Night Owl</span>
                    <span className="px-2 py-0.5 rounded-full text-[6px] font-semibold bg-white/5 text-white/40 border border-white/10">Langues</span>
                  </div>
                  {/* Mini profile cards */}
                  <div className="px-3 space-y-2">
                    {[
                      { name: "Marie, 26", mode: "Solo Diner", dist: "0.8 km", color: "#8B5CF6" },
                      { name: "Lucas, 31", mode: "Night Owl", dist: "1.2 km", color: "#6366F1" },
                      { name: "Amina, 24", mode: "Langues", dist: "2.1 km", color: "#06B6D4" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-2 p-2 rounded-xl border border-white/5 bg-white/[0.02]">
                        <div className="w-8 h-8 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-bold text-white/90 truncate">{p.name}</p>
                          <p className="text-[6px] text-white/40">{p.mode} - {p.dist}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}>
                          ♥
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mini bottom nav */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t border-white/5 bg-black/80 flex justify-around">
                    {["☾", "🔍", "💬", "👤"].map((icon, i) => (
                      <span key={i} className={`text-[10px] ${i === 0 ? "text-[#8B5CF6]" : "text-white/30"}`}>{icon}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/register"
            className="px-10 py-4 rounded-full text-[16px] font-semibold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}
          >
            Commencer
          </Link>

          {/* Secondary */}
          <Link href="/browse" className="mt-4 text-[14px] text-white/60 hover:text-white/70 transition-colors py-2">
            Explorer les profils →
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 flex flex-col items-center gap-2 animate-pulse">
          <span className="text-[11px] text-white/60 tracking-widest uppercase">Scroll</span>
          <span className="text-white/60">↓</span>
        </div>
      </section>

      {/* Second screen — the promise */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
        <FadeInSection>
        <p className="text-[14px] text-[#8B5CF6] uppercase tracking-[0.3em] font-bold mb-6">Le concept</p>
        <h2 className="text-[36px] sm:text-[48px] font-black leading-tight mb-6 max-w-lg">
          Pas demain.<br />Pas la semaine prochaine.<br /><span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Maintenant.</span>
        </h2>
        <p className="text-[16px] text-white/50 max-w-md leading-relaxed mb-10">
          CeSoir te connecte avec des gens pres de toi, disponibles ce soir. 14 modes de rencontre. 100% gratuit. Zero bullshit.
        </p>

        {/* Stats */}
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[32px] font-black" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>14</p>
            <p className="text-[11px] text-white/60 uppercase tracking-wider">Modes</p>
          </div>
          <div className="text-center">
            <p className="text-[32px] font-black" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>0€</p>
            <p className="text-[11px] text-white/60 uppercase tracking-wider">Pour toujours</p>
          </div>
          <div className="text-center">
            <p className="text-[32px] font-black" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>2h</p>
            <p className="text-[11px] text-white/60 uppercase tracking-wider">Moy. avant RDV</p>
          </div>
        </div>
        </FadeInSection>
      </section>

      {/* Third screen — modes carousel */}
      <section className="py-20 px-6 relative">
        <FadeInSection>
          <p className="text-[14px] text-[#00FF88] uppercase tracking-[0.3em] font-bold mb-4 text-center">14 modes</p>
          <h2 className="text-[32px] font-black text-center mb-12">
            Choisis ton <span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ambiance</span>
          </h2>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {[
            { icon: "🍽️", name: "Solo Diner" },
            { icon: "🎬", name: "Plus-One" },
            { icon: "✈️", name: "Tourist" },
            { icon: "🌙", name: "Night Owl" },
            { icon: "💜", name: "Recovery" },
            { icon: "📦", name: "New in Town" },
            { icon: "🌐", name: "Langues" },
            { icon: "🐶", name: "Dog Date" },
            { icon: "🎄", name: "Seasonal" },
            { icon: "💪", name: "Fit Date" },
            { icon: "🔥", name: "Foodie Quest" },
            { icon: "🎭", name: "Culture Club" },
            { icon: "🍵", name: "Sober Tonight" },
            { icon: "🎮", name: "Gamer Night" },
          ].map((m) => (
            <StaggerItem key={m.name}>
            <Link
              href="/register"
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[#a855f7]/40 hover:bg-white/[0.04] transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{m.icon}</span>
              <span className="text-[13px] font-semibold text-white/70 group-hover:text-white">{m.name}</span>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Social proof numbers */}
      <section className="py-16 px-6">
        <CountUpNumbers />
      </section>

      {/* Temoignages */}
      <section className="py-20 px-6 relative">
        <FadeInSection>
          <p className="text-[14px] text-[#8B5CF6] uppercase tracking-[0.3em] font-bold mb-4 text-center">Temoignages</p>
          <h2 className="text-[32px] font-black text-center mb-12">
            Ils ont ose. <span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ils racontent.</span>
          </h2>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            {
              quote: "J'ai rencontre mon meilleur ami sur Solo Diner",
              name: "Marie",
              age: 26,
              stars: 5,
            },
            {
              quote: "Breakup Recovery m'a sauve la vie, zero jugement",
              name: "Lucas",
              age: 31,
              stars: 5,
            },
            {
              quote: "3 soirees en une semaine grace a Night Owl",
              name: "Amina",
              age: 24,
              stars: 5,
            },
          ].map((t) => (
            <StaggerItem key={t.name}>
              <div className="p-5 rounded-2xl border border-[#a855f7]/15 bg-white/[0.02] backdrop-blur-sm relative">
                {/* Quote marks */}
                <span className="absolute top-3 left-4 text-[32px] text-[#8B5CF6]/20 leading-none font-serif">&ldquo;</span>
                <div className="pt-6 pb-3">
                  <p className="text-[14px] text-white/80 leading-relaxed italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <span key={i} className="text-[12px] text-[#f59e0b]">★</span>
                    ))}
                  </div>
                  <p className="text-[13px] font-semibold text-white/90">
                    {t.name}, <span className="text-white/50 font-normal">{t.age} ans</span>
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Fourth screen — safety */}
      <section className="py-20 px-6 text-center">
        <FadeInSection>
          <p className="text-[14px] text-[#22c55e] uppercase tracking-[0.3em] font-bold mb-4">Securite</p>
          <h2 className="text-[32px] font-black mb-12">
            Ta securite est <span className="text-[#22c55e]">sacree.</span>
          </h2>
        </FadeInSection>
        <StaggerContainer className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[
            { icon: "📸", label: "Verifie" },
            { icon: "🆘", label: "SOS" },
            { icon: "⭐", label: "Avis" },
            { icon: "🛡️", label: "24/7" },
            { icon: "🚫", label: "Zero tol." },
            { icon: "📍", label: "Lieux surs" },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-[#22c55e]/10 bg-[#22c55e]/[0.03]">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[10px] text-[#22c55e] font-semibold uppercase tracking-wider">{s.label}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }} />
        </div>
        <ScaleIn className="relative z-10">
          <h2 className="text-[40px] font-black mb-4">
            Ce soir, c&apos;est<br /><span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ton</span> soir.
          </h2>
          <p className="text-white/60 text-[15px] mb-10">Gratuit. Sans pub. Sans paywall.</p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-full text-[17px] font-bold text-white active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}
          >
            Commencer maintenant
          </Link>
        </ScaleIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg text-[#8B5CF6]">☾</span>
          <span className="text-base font-bold">CeSoir</span>
        </div>
        <div className="flex justify-center gap-5 mb-4">
          <Link href="/safety" className="text-[11px] text-white/60 hover:text-white/60">Securite</Link>
          <Link href="/modes" className="text-[11px] text-white/60 hover:text-white/60">Modes</Link>
          <Link href="/cgu" className="text-[11px] text-white/60 hover:text-white/60">CGU</Link>
          <Link href="/privacy" className="text-[11px] text-white/60 hover:text-white/60">Confidentialite</Link>
        </div>
        <p className="text-[11px] text-white/60">&copy; 2026 CeSoir. Tous droits reserves.</p>
      </footer>
    </div>
  );
}

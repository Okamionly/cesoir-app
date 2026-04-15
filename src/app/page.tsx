"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springs, ambient, easings } from "@/lib/motion-design";
import { CountUpNumbers } from "@/components/landing/CountUpNumbers";

export default function LandingPage() {
  return (
    <motion.div
      id="main-content"
      className="min-h-screen bg-black text-white overflow-hidden"
      animate={ambient.gradientShift}
      style={{
        backgroundImage: "linear-gradient(135deg, #000000 0%, #0a0514 25%, #000000 50%, #010d05 75%, #000000 100%)",
        backgroundSize: "400% 400%",
      }}
    >
      {/* Full-screen hero — just the name */}
      <section className="relative h-screen flex flex-col items-center justify-center">
        {/* Animated orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full bg-[#8B5CF6] opacity-30 blur-[120px] -top-32 -right-32"
            animate={ambient.float(8)}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-[#00FF88] opacity-20 blur-[120px] -bottom-20 -left-32"
            animate={ambient.float(10)}
          />
          <motion.div
            className="absolute w-[250px] h-[250px] rounded-full bg-[#8B5CF6] opacity-20 blur-[100px] top-1/3 left-1/3"
            animate={ambient.float(14)}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Moon logo — ambient float */}
          <motion.span
            className="text-[80px] mb-4 drop-shadow-[0_0_40px_rgba(139,92,246,0.6)]"
            animate={ambient.float(6)}
            aria-hidden="true"
          >
            &#9790;
          </motion.span>

          {/* App name — cinematic reveal with shimmer */}
          <motion.h1
            className="text-[80px] sm:text-[120px] font-black tracking-tighter leading-none mb-4"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={springs.cinematic}
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #00FF88, #8B5CF6, #00FF88)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            <motion.span
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{
                background: "inherit",
                backgroundSize: "inherit",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CeSoir
            </motion.span>
          </motion.h1>

          {/* One-liner — delayed fade in */}
          <motion.p
            className="text-[18px] sm:text-[22px] text-white/60 font-light tracking-wide mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: easings.out }}
          >
            Trouve quelqu&apos;un. <span className="text-white font-medium">Ce soir.</span>
          </motion.p>

          {/* Phone mockup — heavy spring entrance */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 80, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ ...springs.heavy, delay: 0.4 }}
          >
            <motion.div
              animate={ambient.float(6)}
              className="relative mx-auto"
              style={{ width: 220, height: 440, perspective: 800 }}
            >
              {/* iPhone frame */}
              <div className="absolute inset-0 rounded-[36px] border-[3px] border-white/20 bg-black/80 backdrop-blur-sm overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-b-2xl z-10" />
                {/* Screen content — mini browse preview */}
                <div className="absolute inset-[3px] rounded-[33px] overflow-hidden bg-[#0A0A0A]">
                  {/* Mini header */}
                  <div className="px-4 pt-8 pb-2 flex items-center gap-2">
                    <span className="text-[10px] text-[#8B5CF6]">&#9790;</span>
                    <span className="text-[9px] font-bold text-white/90">CeSoir</span>
                  </div>
                  {/* Mini mode pills */}
                  <div className="px-3 flex gap-1 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[6px] font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">Solo Diner</span>
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
                    {["☾", "\uD83D\uDD0D", "\uD83D\uDCAC", "\uD83D\uDC64"].map((icon, i) => (
                      <span key={i} className={`text-[10px] ${i === 0 ? "text-[#8B5CF6]" : "text-white/30"}`}>{icon}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA buttons — staggered entrance */}
          <motion.div
            className="flex flex-col items-center"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.8 },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: springs.heavy },
              }}
            >
              <Link href="/register">
                <motion.span
                  className="inline-block px-10 py-4 rounded-full text-[16px] font-semibold text-white cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}
                  whileHover={{ y: -3, boxShadow: "0 8px 40px rgba(139,92,246,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={springs.snap}
                >
                  Commencer
                </motion.span>
              </Link>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: springs.heavy },
              }}
            >
              <Link href="/browse">
                <motion.span
                  className="inline-block mt-4 text-[14px] text-white/60 hover:text-white/70 transition-colors py-2 cursor-pointer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springs.snap}
                >
                  Explorer les profils →
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[11px] text-white/60 tracking-widest uppercase">Scroll</span>
          <motion.span
            className="text-white/60"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.span>
        </motion.div>
      </section>

      {/* Second screen — the promise */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 60, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ ...springs.cinematic }}
        >
          <p className="text-[14px] text-[#8B5CF6] uppercase tracking-[0.3em] font-bold mb-6">Le concept</p>
          <h2 className="text-[36px] sm:text-[48px] font-black leading-tight mb-6 max-w-lg">
            Pas demain.<br />Pas la semaine prochaine.<br /><span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Maintenant.</span>
          </h2>
          <p className="text-[16px] text-white/50 max-w-md leading-relaxed mb-10">
            CeSoir te connecte avec des gens pres de toi, disponibles ce soir. 14 modes de rencontre. 100% gratuit. Zero bullshit.
          </p>

          {/* Stats */}
          <motion.div
            className="flex gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
            }}
          >
            {[
              { value: "14", label: "Modes" },
              { value: "0\u20AC", label: "Pour toujours" },
              { value: "2h", label: "Moy. avant RDV" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={{
                  hidden: { opacity: 0, scale: 0.5, y: 20 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: springs.elastic },
                }}
              >
                <p className="text-[32px] font-black" style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</p>
                <p className="text-[11px] text-white/60 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Third screen — modes carousel */}
      <section className="py-20 px-6 relative">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ ...springs.heavy }}
        >
          <p className="text-[14px] text-[#00FF88] uppercase tracking-[0.3em] font-bold mb-4 text-center">14 modes</p>
          <h2 className="text-[32px] font-black text-center mb-12">
            Choisis ton <span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ambiance</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
          }}
        >
          {[
            { icon: "\uD83C\uDF7D\uFE0F", name: "Solo Diner" },
            { icon: "\uD83C\uDFAC", name: "Plus-One" },
            { icon: "\u2708\uFE0F", name: "Tourist" },
            { icon: "\uD83C\uDF19", name: "Night Owl" },
            { icon: "\uD83D\uDC9C", name: "Recovery" },
            { icon: "\uD83D\uDCE6", name: "New in Town" },
            { icon: "\uD83C\uDF10", name: "Langues" },
            { icon: "\uD83D\uDC36", name: "Dog Date" },
            { icon: "\uD83C\uDF84", name: "Seasonal" },
            { icon: "\uD83D\uDCAA", name: "Fit Date" },
            { icon: "\uD83D\uDD25", name: "Foodie Quest" },
            { icon: "\uD83C\uDFAD", name: "Culture Club" },
            { icon: "\uD83C\uDF75", name: "Sober Tonight" },
            { icon: "\uD83C\uDFAE", name: "Gamer Night" },
          ].map((m, i) => (
            <motion.div
              key={m.name}
              variants={{
                hidden: { opacity: 0, scale: 0.5, y: 30 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { ...springs.elastic, delay: i * 0.04 },
                },
              }}
            >
              <Link href="/register">
                <motion.span
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[#8B5CF6]/40 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                  whileHover={{ y: -6, scale: 1.05, transition: springs.gentle }}
                  whileTap={{ scale: 0.92, transition: springs.micro }}
                  style={{ display: "flex" }}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{m.icon}</span>
                  <span className="text-[13px] font-semibold text-white/70 group-hover:text-white">{m.name}</span>
                </motion.span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Social proof numbers */}
      <section className="py-16 px-6">
        <CountUpNumbers />
      </section>

      {/* Temoignages */}
      <section className="py-20 px-6 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ ...springs.cinematic }}
        >
          <p className="text-[14px] text-[#8B5CF6] uppercase tracking-[0.3em] font-bold mb-4 text-center">Temoignages</p>
          <h2 className="text-[32px] font-black text-center mb-12">
            Ils ont ose. <span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ils racontent.</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
          }}
        >
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
            <motion.div
              key={t.name}
              variants={{
                hidden: { opacity: 0, y: 40, rotateX: 8 },
                visible: { opacity: 1, y: 0, rotateX: 0, transition: springs.heavy },
              }}
            >
              <motion.div
                className="p-5 rounded-2xl border border-[#8B5CF6]/15 bg-white/[0.02] backdrop-blur-sm relative"
                whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(139,92,246,0.15)", transition: springs.gentle }}
              >
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
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Fourth screen — safety */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: easings.out }}
        >
          <p className="text-[14px] text-[#22c55e] uppercase tracking-[0.3em] font-bold mb-4">Securite</p>
          <h2 className="text-[32px] font-black mb-12">
            Ta securite est <span className="text-[#22c55e]">sacree.</span>
          </h2>
        </motion.div>
        <motion.div
          className="grid grid-cols-3 gap-4 max-w-sm mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
          }}
        >
          {[
            { icon: "\uD83D\uDCF8", label: "Verifie" },
            { icon: "\uD83C\uDD98", label: "SOS" },
            { icon: "\u2B50", label: "Avis" },
            { icon: "\uD83D\uDEE1\uFE0F", label: "24/7" },
            { icon: "\uD83D\uDEAB", label: "Zero tol." },
            { icon: "\uD83D\uDCCD", label: "Lieux surs" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, scale: 0, rotate: -10 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  transition: { ...springs.elastic, delay: i * 0.06 },
                },
              }}
            >
              <motion.div
                className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-[#22c55e]/10 bg-[#22c55e]/[0.03]"
                whileHover={{ y: -3, scale: 1.08, borderColor: "rgba(34,197,94,0.3)", transition: springs.gentle }}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[10px] text-[#22c55e] font-semibold uppercase tracking-wider">{s.label}</span>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)" }}
            animate={ambient.breathe(5)}
          />
        </div>
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={springs.cinematic}
        >
          <h2 className="text-[40px] font-black mb-4">
            Ce soir, c&apos;est<br /><span style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ton</span> soir.
          </h2>
          <p className="text-white/60 text-[15px] mb-10">Gratuit. Sans pub. Sans paywall.</p>
          <Link href="/register">
            <motion.span
              className="inline-block px-10 py-4 rounded-full text-[17px] font-bold text-white cursor-pointer"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #00FF88)", boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}
              whileHover={{ y: -3, boxShadow: "0 8px 40px rgba(139,92,246,0.5)" }}
              whileTap={{ scale: 0.95 }}
              transition={springs.snap}
            >
              Commencer maintenant
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg text-[#8B5CF6]">&#9790;</span>
          <span className="text-base font-bold">CeSoir</span>
        </div>
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/safety" className="text-[13px] text-white/50 hover:text-white transition-colors py-1">Securite</Link>
          <Link href="/modes" className="text-[13px] text-white/50 hover:text-white transition-colors py-1">Modes</Link>
          <Link href="/cgu" className="text-[13px] text-white/50 hover:text-white transition-colors py-1">CGU</Link>
          <Link href="/privacy" className="text-[13px] text-white/50 hover:text-white transition-colors py-1">Confidentialite</Link>
        </div>
        <p className="text-[11px] text-white/60">&copy; 2026 CeSoir. Tous droits reserves.</p>
      </footer>
    </motion.div>
  );
}
